import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';

function AdherentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nom: '', prenom: '', filiere: 'Génie Logiciel',
    niveau: 'L1', email: ''
  });
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (id) api.get(`/api/adherents/${id}`).then(r => setForm(r.data));
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const req = id
      ? api.put(`/api/adherents/${id}`, form)
      : api.post('/api/adherents', form);
    req.then(() => navigate('/adherents'))
       .catch(e => setMsg({ type: 'danger', text: e.response?.data?.error || 'Erreur' }));
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <div className="page-header mb-4">
          <div className="page-category">{id ? 'Modification' : 'Inscription'}</div>
          <h2 className="page-title">{id ? 'Modifier un adhérent' : 'Nouvel adhérent'}</h2>
        </div>

        <div className="card">
          <div className="card-header">
            <h5>{id ? '✏️ Modifier' : '➕ Nouvel'} adhérent</h5>
          </div>
          <div className="card-body p-4">
            {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Nom</label>
                  <input className="form-control" value={form.nom} required
                    onChange={e => setForm({...form, nom: e.target.value})} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Prénom</label>
                  <input className="form-control" value={form.prenom} required
                    onChange={e => setForm({...form, prenom: e.target.value})} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Filière</label>
                  <select className="form-select" value={form.filiere}
                    onChange={e => setForm({...form, filiere: e.target.value})}>
                    <option value="Génie Logiciel">Génie Logiciel</option>
                    <option value="Telecom">Telecom</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Niveau</label>
                  <select className="form-select" value={form.niveau}
                    onChange={e => setForm({...form, niveau: e.target.value})}>
                    {['L1','L2','L3','M1','M2'].map(n =>
                      <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label">Email</label>
                  <input className="form-control" type="email" value={form.email} required
                    onChange={e => setForm({...form, email: e.target.value})} />
                </div>
              </div>
              <div className="d-flex gap-2 mt-4">
                <button type="submit" className="btn btn-primary">
                  {id ? 'Enregistrer les modifications' : 'Ajouter l\'adhérent'}
                </button>
                <button type="button" className="btn btn-secondary"
                  onClick={() => navigate('/adherents')}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdherentForm;
