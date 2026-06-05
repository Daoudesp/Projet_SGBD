import { useEffect, useState } from 'react';
import api from '../../api/axios';

/* ─── Mapping titre → image de couverture ─── */
const getImage = (titre = '') => {
  const t = titre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (t.includes('donnee') || t.includes('donnees') || t.includes('base'))
    return '/images/Base_de_donnee.jpg';
  if (t.includes('logiciel') || t.includes('genie'))
    return '/images/genie_logiciel.jpg';
  if (t.includes('algorithme'))
    return '/images/Algorithme.jpg';
  if (t.includes('reseau'))
    return '/images/Reseau_Informatique.jpg';
  if (t.includes('mathematique') || t.includes('math'))
    return '/images/Mathematique_L2.jpg';
  if (t.includes('information') || t.includes('systeme'))
    return '/images/Systeme_information.jpg';
  return null;
};

function LivreList() {
  const [livres, setLivres]       = useState([]);
  const [dispo, setDispo]         = useState([]);
  const [msg, setMsg]             = useState(null);
  const [onglet, setOnglet]       = useState('catalogue');
  const [formLivre, setFormLivre] = useState({
    isbn: '', titre: '', auteur: '', categorie: '', nb_exemplaires: 1
  });
  const [isbnEx, setIsbnEx] = useState('');

  useEffect(() => {
    api.get('/api/livres').then(r => setLivres(r.data));
    api.get('/api/exemplaires/disponibles').then(r => setDispo(r.data));
  }, []);

  const ajouterLivre = (e) => {
    e.preventDefault();
    api.post('/api/livres', formLivre)
       .then(() => {
         setMsg({ type: 'success', text: 'Livre ajouté !' });
         api.get('/api/livres').then(r => setLivres(r.data));
         setFormLivre({ isbn: '', titre: '', auteur: '', categorie: '', nb_exemplaires: 1 });
       })
       .catch(er => setMsg({ type: 'danger', text: er.response?.data?.error || 'Erreur' }));
  };

  const ajouterExemplaire = (e) => {
    e.preventDefault();
    api.post('/api/exemplaires', { isbn: isbnEx })
       .then(() => {
         setMsg({ type: 'success', text: 'Exemplaire ajouté !' });
         api.get('/api/exemplaires/disponibles').then(r => setDispo(r.data));
         setIsbnEx('');
       })
       .catch(er => setMsg({ type: 'danger', text: er.response?.data?.error || 'Erreur' }));
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div className="page-header mb-0">
          <div className="page-category">Catalogue</div>
          <h2 className="page-title">Livres & Exemplaires</h2>
          <p className="page-subtitle">Parcourez le fonds de la bibliothèque.</p>
        </div>
      </div>

      {msg && (
        <div className={`alert alert-${msg.type} alert-dismissible mb-4`}>
          {msg.text}
          <button className="btn-close" onClick={() => setMsg(null)} />
        </div>
      )}

      {/* Onglets */}
      <ul className="nav nav-tabs mb-4">
        {[
          { key: 'catalogue',   label: '📚 Catalogue' },
          { key: 'disponibles', label: '✅ Disponibles' },
          { key: 'ajouter',     label: '+ Ajouter' },
        ].map(({ key, label }) => (
          <li key={key} className="nav-item">
            <button
              className={`nav-link${onglet === key ? ' active' : ''}`}
              onClick={() => setOnglet(key)}
            >{label}</button>
          </li>
        ))}
      </ul>

      {/* ── Catalogue — cartes avec images ── */}
      {onglet === 'catalogue' && (
        <div className="row g-3">
          {livres.map(l => {
            const img = getImage(l.titre);
            return (
              <div key={l.isbn} className="col-md-4 col-sm-6">
                <div className="livre-card">
                  {/* Image de couverture */}
                  {img ? (
                    <div style={{
                      height: 180,
                      overflow: 'hidden',
                      position: 'relative',
                      borderRadius: '16px 16px 0 0',
                    }}>
                      <img
                        src={img}
                        alt={l.titre}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                      {/* Overlay dégradé */}
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(26,61,43,0.7) 0%, rgba(26,61,43,0.1) 60%)',
                      }} />
                      {/* Icône livre */}
                      <div className="livre-card-icon" style={{ position: 'absolute', top: '0.8rem', right: '0.8rem' }}>📖</div>
                    </div>
                  ) : (
                    <div className="livre-card-body" style={{ position: 'relative' }}>
                      <div className="livre-card-icon">📖</div>
                    </div>
                  )}

                  {/* Corps de la carte */}
                  <div className="livre-card-body" style={{ paddingTop: img ? '1rem' : '2rem' }}>
                    <div className="livre-card-cat">{l.categorie}</div>
                    <div className="livre-card-title">{l.titre}</div>
                    <div className="livre-card-author">{l.auteur}</div>
                  </div>

                  {/* Pied de carte */}
                  <div className="livre-card-footer">
                    <div>
                      <div style={{ opacity: 0.45, fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'white' }}>ISBN</div>
                      <div className="livre-card-isbn">{l.isbn}</div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge badge-cat">{l.categorie}</span>
                      <div className="livre-card-exemplaires">
                        <span className="livre-card-nb">{l.nb_exemplaires}</span>
                        <span>exempl.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {livres.length === 0 &&
            <p className="text-center py-4" style={{ color: 'var(--text-light)' }}>Aucun livre dans le catalogue.</p>}
        </div>
      )}

      {/* ── Disponibles ── */}
      {onglet === 'disponibles' && (
        <div className="table-container">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>#</th><th>Titre</th><th>Auteur</th><th>Catégorie</th><th>État</th>
              </tr>
            </thead>
            <tbody>
              {dispo.map(e => (
                <tr key={e.id_exemplaire}>
                  <td style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>{e.id_exemplaire}</td>
                  <td style={{ fontWeight: 500 }}>{e.titre}</td>
                  <td style={{ color: 'var(--text-medium)' }}>{e.auteur}</td>
                  <td><span className="badge badge-cat">{e.categorie}</span></td>
                  <td><span className="pill-atemps">{e.etat}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {dispo.length === 0 &&
            <p className="text-center py-4" style={{ color: 'var(--text-light)' }}>Aucun exemplaire disponible.</p>}
        </div>
      )}

      {/* ── Ajouter ── */}
      {onglet === 'ajouter' && (
        <div className="row g-4">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header"><h5>📚 Ajouter un livre</h5></div>
              <div className="card-body p-4">
                <form onSubmit={ajouterLivre}>
                  {[['isbn','ISBN'],['titre','Titre'],['auteur','Auteur'],['categorie','Catégorie']].map(([k,l]) => (
                    <div key={k} className="mb-3">
                      <label className="form-label">{l}</label>
                      <input className="form-control" required value={formLivre[k]}
                        onChange={e => setFormLivre({...formLivre, [k]: e.target.value})} />
                    </div>
                  ))}
                  <div className="mb-3">
                    <label className="form-label">Nombre d'exemplaires</label>
                    <input type="number" className="form-control" min="0"
                      value={formLivre.nb_exemplaires}
                      onChange={e => setFormLivre({...formLivre, nb_exemplaires: e.target.value})} />
                  </div>
                  <button className="btn btn-primary w-100">Ajouter le livre</button>
                </form>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card">
              <div className="card-header"><h5>➕ Ajouter un exemplaire</h5></div>
              <div className="card-body p-4">
                <form onSubmit={ajouterExemplaire}>
                  <div className="mb-4">
                    <label className="form-label">Choisir un livre</label>
                    <select className="form-select" value={isbnEx} required
                      onChange={e => setIsbnEx(e.target.value)}>
                      <option value="">— Sélectionner —</option>
                      {livres.map(l => (
                        <option key={l.isbn} value={l.isbn}>{l.titre}</option>
                      ))}
                    </select>
                  </div>
                  <button className="btn btn-primary w-100">Ajouter l'exemplaire</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LivreList;
