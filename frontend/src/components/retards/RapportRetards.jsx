import { useEffect, useState } from 'react';
import api from '../../api/axios';

function RapportRetards() {
  const [retards, setRetards] = useState([]);

  useEffect(() => {
    api.get('/api/emprunts/retards').then(r => setRetards(r.data));
  }, []);

  const totalAmende = retards.reduce((s, r) => s + r.jours_retard * 100, 0);

  return (
    <div>
      {/* Header */}
      <div className="page-header mb-4">
        <div className="page-category">Suivi</div>
        <h2 className="page-title">Rapport des retards</h2>
        <p className="page-subtitle">Vue d'ensemble des emprunts en retard et amendes estimées.</p>
      </div>

      {retards.length === 0 ? (
        <div className="alert alert-success">
          🎉 Aucun emprunt en retard. Tous les livres sont rendus à temps !
        </div>
      ) : (
        <>
          {/* Résumé */}
          <div className="retard-summary">
            <div className="retard-summary-icon">⚠️</div>
            <div>
              <p className="retard-summary-title">{retards.length} emprunt{retards.length > 1 ? 's' : ''} en retard</p>
              <p className="retard-summary-sub">
                Amende totale estimée : <span className="amount">{totalAmende.toLocaleString('fr-FR')} FCFA</span>
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="table-container">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Adhérent</th>
                  <th>Filière</th>
                  <th>Livre</th>
                  <th>Date emprunt</th>
                  <th>Retour prévu</th>
                  <th>Jours de retard</th>
                  <th>Amende estimée</th>
                </tr>
              </thead>
              <tbody>
                {retards.map(r => (
                  <tr key={r.id_emprunt}>
                    <td style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>{r.id_emprunt}</td>
                    <td style={{ fontWeight: 600 }}>{r.adherent}</td>
                    <td style={{ color: 'var(--text-medium)' }}>{r.filiere}</td>
                    <td>{r.titre}</td>
                    <td style={{ color: 'var(--text-medium)', fontSize: '0.88rem' }}>{r.date_emprunt}</td>
                    <td style={{ color: 'var(--text-medium)', fontSize: '0.88rem' }}>{r.date_retour_prevue}</td>
                    <td>
                      <span className="pill-jours">{r.jours_retard} jour{r.jours_retard > 1 ? 's' : ''}</span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--red)', fontSize: '1rem' }}>
                        {(r.jours_retard * 100).toLocaleString('fr-FR')} FCFA
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default RapportRetards;
