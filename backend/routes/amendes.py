from flask import Blueprint, request, jsonify
from database import execute_query

amendes_bp = Blueprint('amendes', __name__)

# GET toutes les amendes non payées
@amendes_bp.route('/api/amendes', methods=['GET'])
def get_amendes():
    data = execute_query("SELECT * FROM vue_amendes_impayees ORDER BY montant DESC")
    return jsonify(data), 200

# PUT payer une amende
@amendes_bp.route('/api/amendes/<int:id>/payer', methods=['PUT'])
def payer_amende(id):
    try:
        execute_query(
            "UPDATE Amende SET statut_paiement = 'paye' WHERE id_amende = %s",
            (id,),
            fetch=False
        )
        return jsonify({'message': 'Amende marquée comme payée'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 422
