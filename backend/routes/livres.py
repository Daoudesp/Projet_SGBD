from flask import Blueprint, request, jsonify
from database import execute_query

livres_bp = Blueprint('livres', __name__)

# GET tous les livres
@livres_bp.route('/api/livres', methods=['GET'])
def get_livres():
    data = execute_query("SELECT * FROM Livre ORDER BY titre")
    return jsonify(data), 200

# POST ajouter un livre
@livres_bp.route('/api/livres', methods=['POST'])
def add_livre():
    d = request.get_json()
    try:
        execute_query(
            """INSERT INTO Livre (isbn, titre, auteur, categorie, nb_exemplaires)
               VALUES (%s, %s, %s, %s, %s)""",
            (d['isbn'], d['titre'], d['auteur'], d['categorie'], d.get('nb_exemplaires', 0)),
            fetch=False
        )
        return jsonify({'message': 'Livre ajouté avec succès'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 422

# GET exemplaires disponibles
@livres_bp.route('/api/exemplaires/disponibles', methods=['GET'])
def get_disponibles():
    data = execute_query("SELECT * FROM vue_exemplaires_disponibles ORDER BY titre")
    return jsonify(data), 200

# POST ajouter un exemplaire
@livres_bp.route('/api/exemplaires', methods=['POST'])
def add_exemplaire():
    d = request.get_json()
    try:
        execute_query(
            "INSERT INTO Exemplaire (etat, isbn) VALUES ('disponible', %s)",
            (d['isbn'],),
            fetch=False
        )
        return jsonify({'message': 'Exemplaire ajouté avec succès'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 422
