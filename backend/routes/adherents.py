from flask import Blueprint, request, jsonify
from database import execute_query

adherents_bp = Blueprint('adherents', __name__)

# GET tous les adhérents
@adherents_bp.route('/api/adherents', methods=['GET'])
def get_adherents():
    search = request.args.get('search', '')
    filiere = request.args.get('filiere', '')

    if search and filiere:
        sql = """SELECT * FROM Adherent
                 WHERE (nom LIKE %s OR prenom LIKE %s)
                 AND filiere = %s
                 ORDER BY nom"""
        data = execute_query(sql, (f'%{search}%', f'%{search}%', filiere))
    elif search:
        sql = """SELECT * FROM Adherent
                 WHERE nom LIKE %s OR prenom LIKE %s
                 ORDER BY nom"""
        data = execute_query(sql, (f'%{search}%', f'%{search}%'))
    elif filiere:
        sql = "SELECT * FROM Adherent WHERE filiere = %s ORDER BY nom"
        data = execute_query(sql, (filiere,))
    else:
        data = execute_query("SELECT * FROM Adherent ORDER BY nom")

    return jsonify(data), 200

# GET un adhérent par id
@adherents_bp.route('/api/adherents/<int:id>', methods=['GET'])
def get_adherent(id):
    data = execute_query(
        "SELECT * FROM Adherent WHERE num_adherent = %s", (id,)
    )
    if not data:
        return jsonify({'error': 'Adhérent introuvable'}), 404
    return jsonify(data[0]), 200

# POST ajouter un adhérent
@adherents_bp.route('/api/adherents', methods=['POST'])
def add_adherent():
    d = request.get_json()
    try:
        execute_query(
            """INSERT INTO Adherent (nom, prenom, filiere, niveau, email)
               VALUES (%s, %s, %s, %s, %s)""",
            (d['nom'], d['prenom'], d['filiere'], d['niveau'], d['email']),
            fetch=False
        )
        return jsonify({'message': 'Adhérent ajouté avec succès'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 422

# PUT modifier un adhérent
@adherents_bp.route('/api/adherents/<int:id>', methods=['PUT'])
def update_adherent(id):
    d = request.get_json()
    try:
        execute_query(
            """UPDATE Adherent SET nom=%s, prenom=%s, filiere=%s,
               niveau=%s, email=%s WHERE num_adherent=%s""",
            (d['nom'], d['prenom'], d['filiere'], d['niveau'], d['email'], id),
            fetch=False
        )
        return jsonify({'message': 'Adhérent modifié avec succès'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 422

# DELETE supprimer un adhérent
@adherents_bp.route('/api/adherents/<int:id>', methods=['DELETE'])
def delete_adherent(id):
    try:
        execute_query(
            "DELETE FROM Adherent WHERE num_adherent = %s", (id,), fetch=False
        )
        return jsonify({'message': 'Adhérent supprimé'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 422
