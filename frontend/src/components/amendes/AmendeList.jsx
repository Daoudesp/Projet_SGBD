import { useEffect, useState } from 'react';
import api from '../../api/axios';

function AmendeList() {
  const [amendes, setAmendes] = useState([]);
  const [msg, setMsg]         = useState(null);

  const load = () => {
    api.get('/api/amendes').then(r => setAmendes(r.data));
  };

  useEffect(() => { load(); }, []);

  const payer = (id) => {
    api.put(`/api/amendes/${id}/payer`)
       .then(() => { setMsg({ type: 'success', text: 'Amende marquée comme payée.' }); load(); })
       .catch(e => setMsg({ type: 'danger', text: e.response?.data?.error || 'Erreur' }));
  };

  const total = amendes.reduce((s, a) => s + parseFloat(a.montant), 0);

  return (
    <div>
      {/* Header */}
      <div className="page-header mb-4">
        <div className="page-category">Finance</div>
        <h2 className="page-title">Amendes impayées</h2>
        <p className="page-subtitle">Gérez le recouvrement des amendes de retard.</p>
      </div>

      {msg && (
        <div className={`alert alert-${msg.type} alert-dismissible mb-3`}>
          {msg.text}
          <button className="btn-close" onClick={() => setMsg(null)} />
        </div>
      )}

      {amendes.length === 0 ? (
        <div className="alert alert-success">✅ Aucune amende impayée.</div>
      ) : (
        <>
          {/* Résumé */}
          <div className="retard-summary mb-4" style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
            <div className="retard-summary-icon" style={{ background: 'var(--red)' }}>💰</div>
            <div>
              <p className="retard-summary-title">{amendes.length} amende{amendes.length > 1 ? 's' : ''} impayée{amendes.length > 1 ? 's' : ''}</p>
              <p className="retard-summary-sub">
                Total impayé : <span className="amount">{total.toLocaleString('fr-FR')} FCFA</span>
              </p>
            </div>
          </div>

          <div className="table-container">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>#</th><th>Adhérent</th><th>Filière</th>
                  <th>Livre</th><th>Montant</th><th>Statut</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {amendes.map(a => (
                  <tr key={a.id_amende}>
                    <td style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>{a.id_amende}</td>
                    <td style={{ fontWeight: 600 }}>{a.adherent}</td>
                    <td>
                      <span className={`badge ${a.filiere === 'Génie Logiciel' ? 'badge-gl' : 'badge-tc'}`}>
                        {a.filiere}
                      </span>
                    </td>
                    <td>{a.titre}</td>
                    <td>
                      <strong style={{ color: 'var(--red)', fontSize: '1rem' }}>
                        {Number(a.montant).toLocaleString('fr-FR')} FCFA
                      </strong>
                    </td>
                    <td>
                      <span className="pill-retard">{a.statut_paiement}</span>
                    </td>
                    <td>
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => payer(a.id_amende)}
                        style={{ fontSize: '0.82rem' }}
                      >
                        ✅ Marquer payée
                      </button>
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

export default AmendeList;
