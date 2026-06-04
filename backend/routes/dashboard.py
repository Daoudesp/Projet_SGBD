from flask import Blueprint, jsonify
from database import execute_query

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    # Nombre d'emprunts actifs
    emprunts_actifs = execute_query(
        "SELECT COUNT(*) as total FROM Emprunt WHERE date_retour_reelle IS NULL"
    )[0]['total']

    # Nombre d'exemplaires disponibles
    exemplaires_dispo = execute_query(
        "SELECT COUNT(*) as total FROM Exemplaire WHERE etat = 'disponible'"
    )[0]['total']

    # Nombre d'amendes non payées
    amendes_impayees = execute_query(
        "SELECT COUNT(*) as total FROM Amende WHERE statut_paiement = 'non_paye'"
    )[0]['total']

    # Montant total des amendes impayées
    montant_impaye = execute_query(
        "SELECT COALESCE(SUM(montant), 0) as total FROM Amende WHERE statut_paiement = 'non_paye'"
    )[0]['total']

    # Nombre d'emprunts en retard
    en_retard = execute_query(
        """SELECT COUNT(*) as total FROM Emprunt
           WHERE date_retour_reelle IS NULL
           AND date_retour_prevue < CURDATE()"""
    )[0]['total']

    return jsonify({
        'emprunts_actifs':   emprunts_actifs,
        'exemplaires_dispo': exemplaires_dispo,
        'amendes_impayees':  amendes_impayees,
        'montant_impaye':    float(montant_impaye),
        'en_retard':         en_retard
    }), 200
