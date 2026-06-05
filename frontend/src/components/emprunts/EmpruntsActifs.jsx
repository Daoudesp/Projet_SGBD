import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

function EmpruntsActifs() {
  const [emprunts, setEmprunts] = useState([]);
  const [msg, setMsg]           = useState(null);

  const load = () => {
    api.get('/api/emprunts/actifs').then(r => setEmprunts(r.data));
  };

  useEffect(() => { load(); }, []);

  const enregistrerRetour = (id) => {
    if (!window.confirm('Confirmer le retour de cet exemplaire ?')) return;
    api.put(`/api/emprunts/${id}/retour`)
       .then(r => { setMsg({ type: 'success', text: r.data.message }); load(); })
       .catch(e => setMsg({ type: 'danger', text: e.response?.data?.error || 'Erreur' }));
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div className="page-header mb-0">
          <div className="page-category">Circulation</div>
          <h2 className="page-title">Emprunts actifs</h2>
          <p className="page-subtitle">Suivez les livres en circulation et leurs échéances.</p>
        </div>
        <Link to="/emprunts/nouveau" className="btn btn-primary">+ Nouvel emprunt</Link>
      </div>

      {msg && (
        <div className={`alert alert-${msg.type} alert-dismissible mb-3`}>
          {msg.text}
          <button className="btn-close" onClick={() => setMsg(null)} />
        </div>
      )}

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
              <th>Statut</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {emprunts.map(e => (
              <tr key={e.id_emprunt}>
                <td style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>{e.id_emprunt}</td>
                <td style={{ fontWeight: 500 }}>{e.adherent}</td>
                <td>
                  <span className={`badge ${e.filiere === 'Génie Logiciel' ? 'badge-gl' : 'badge-tc'}`}>
                    {e.filiere}
                  </span>
                </td>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.9rem' }}>📖</span>
                    {e.titre}
                  </span>
                </td>
                <td style={{ color: 'var(--text-medium)', fontSize: '0.88rem' }}>{e.date_emprunt}</td>
                <td style={{ color: 'var(--text-medium)', fontSize: '0.88rem' }}>{e.date_retour_prevue}</td>
                <td>
                  {e.jours_retard > 0
                    ? <span className="pill-retard">{e.jours_retard} j de retard</span>
                    : <span className="pill-atemps">À temps</span>}
                </td>
                <td>
                  <button
                    className="btn btn-retour"
                    onClick={() => enregistrerRetour(e.id_emprunt)}
                  >
                    ↩ Retour
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {emprunts.length === 0 &&
          <p className="text-center py-4" style={{ color: 'var(--text-light)' }}>Aucun emprunt actif.</p>}
      </div>
    </div>
  );
}

export default EmpruntsActifs;
