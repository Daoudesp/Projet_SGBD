from flask import Blueprint, request, jsonify
from database import execute_query

emprunts_bp = Blueprint('emprunts', __name__)

# GET emprunts actifs
@emprunts_bp.route('/api/emprunts/actifs', methods=['GET'])
def get_actifs():
    data = execute_query("SELECT * FROM vue_emprunts_actifs ORDER BY jours_retard DESC")
    return jsonify(data), 200

# GET rapport des retards
@emprunts_bp.route('/api/emprunts/retards', methods=['GET'])
def get_retards():
    data = execute_query(
        "SELECT * FROM vue_emprunts_actifs WHERE jours_retard > 0 ORDER BY jours_retard DESC"
    )
    return jsonify(data), 200

# POST enregistrer un emprunt
# Le trigger vérifie automatiquement les 3 règles métier
@emprunts_bp.route('/api/emprunts', methods=['POST'])
def creer_emprunt():
    d = request.get_json()
    num_adherent  = d.get('num_adherent')
    id_exemplaire = d.get('id_exemplaire')

    if not num_adherent or not id_exemplaire:
        return jsonify({'error': 'Données manquantes'}), 400

    try:
        execute_query(
            """INSERT INTO Emprunt (date_emprunt, date_retour_prevue, num_adherent, id_exemplaire)
               VALUES (CURDATE(), CURDATE(), %s, %s)""",
            (num_adherent, id_exemplaire),
            fetch=False
        )
        return jsonify({'message': 'Emprunt enregistré avec succès'}), 201
    except Exception as e:
        # Le trigger renvoie le message métier (ex: "Exemplaire abîmé")
        return jsonify({'error': str(e)}), 422

# PUT enregistrer un retour
# Le trigger calcule l'amende automatiquement
@emprunts_bp.route('/api/emprunts/<int:id>/retour', methods=['PUT'])
def retourner(id):
    try:
        execute_query(
            "UPDATE Emprunt SET date_retour_reelle = CURDATE() WHERE id_emprunt = %s AND date_retour_reelle IS NULL",
            (id,),
            fetch=False
        )
        # Vérifier si une amende a été créée
        amende = execute_query(
            "SELECT * FROM Amende WHERE id_emprunt = %s", (id,)
        )
        if amende:
            return jsonify({
                'message': f'Retour enregistré. Amende de {amende[0]["montant"]} FCFA générée.',
                'amende': amende[0]
            }), 200
        return jsonify({'message': 'Retour enregistré. Aucun retard.'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 422
