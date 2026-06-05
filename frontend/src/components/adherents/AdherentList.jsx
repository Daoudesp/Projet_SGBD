import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

/* Palette de couleurs pour les avatars */
const AVATAR_COLORS = [
  '#1a3d2b','#2d5a3d','#4a7c5f','#c9a84c',
  '#7c3aed','#0d9488','#dc2626','#1a56db',
];

function getAvatarColor(name = '') {
  let hash = 0;
  for (let c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(nom = '', prenom = '') {
  return `${(nom[0] || '').toUpperCase()}${(prenom[0] || '').toUpperCase()}`;
}

function AdherentList() {
  const [adherents, setAdherents] = useState([]);
  const [search, setSearch]       = useState('');
  const [filiere, setFiliere]     = useState('');
  const [msg, setMsg]             = useState(null);

  const load = () => {
    api.get('/api/adherents', { params: { search, filiere } })
       .then(r => setAdherents(r.data));
  };

  useEffect(() => { load(); }, [search, filiere]);

  const supprimer = (id) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    api.delete(`/api/adherents/${id}`)
       .then(() => { setMsg({ type: 'success', text: 'Adhérent supprimé.' }); load(); })
       .catch(e => setMsg({ type: 'danger', text: e.response?.data?.error || 'Erreur' }));
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div className="page-header mb-0">
          <div className="page-category">Communauté</div>
          <h2 className="page-title">Adhérents</h2>
          <p className="page-subtitle">Gérez les étudiants inscrits à la bibliothèque.</p>
        </div>
        <Link to="/adherents/nouveau" className="btn btn-primary">+ Ajouter</Link>
      </div>

      {msg && <div className={`alert alert-${msg.type} mb-3`}>{msg.text}</div>}

      {/* Filtres */}
      <div className="d-flex gap-3 mb-4">
        <div style={{ flex: 1 }}>
          <input
            className="form-control"
            placeholder="Rechercher par nom ou prénom..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div>
          <select className="form-select" value={filiere} onChange={e => setFiliere(e.target.value)}>
            <option value="">Toutes les filières</option>
            <option value="Génie Logiciel">Génie Logiciel</option>
            <option value="Telecom">Telecom</option>
          </select>
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
              <th>Niveau</th>
              <th>Email</th>
              <th>Inscription</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {adherents.map(a => (
              <tr key={a.num_adherent}>
                <td style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>{a.num_adherent}</td>
                <td>
                  <div className="adherent-cell">
                    <div
                      className="adherent-avatar"
                      style={{ background: getAvatarColor(a.nom + a.prenom) }}
                    >
                      {initials(a.nom, a.prenom)}
                    </div>
                    <span style={{ fontWeight: 500 }}>{a.nom} {a.prenom}</span>
                  </div>
                </td>
                <td>
                  <span className={`badge ${a.filiere === 'Génie Logiciel' ? 'badge-gl' : 'badge-tc'}`}>
                    {a.filiere}
                  </span>
                </td>
                <td style={{ color: 'var(--text-medium)' }}>{a.niveau}</td>
                <td style={{ color: 'var(--text-medium)', fontSize: '0.88rem' }}>{a.email}</td>
                <td style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>{a.date_inscription}</td>
                <td>
                  <div className="d-flex gap-2">
                    <Link
                      to={`/adherents/edit/${a.num_adherent}`}
                      className="btn btn-sm"
                      style={{ background: '#f8f9fa', border: '1px solid #e2e8f0', color: 'var(--text-medium)', padding: '0.3rem 0.65rem' }}
                      title="Modifier"
                    >✏️</Link>
                    <button
                      className="btn btn-sm"
                      style={{ background: '#fef2f2', border: '1px solid #fecaca', color: 'var(--red)', padding: '0.3rem 0.65rem' }}
                      onClick={() => supprimer(a.num_adherent)}
                      title="Supprimer"
                    >🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {adherents.length === 0 &&
          <p className="text-center py-4" style={{ color: 'var(--text-light)' }}>Aucun adhérent trouvé.</p>}
      </div>
    </div>
  );
}

export default AdherentList;
