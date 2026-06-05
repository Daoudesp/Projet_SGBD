import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

function NouvelEmprunt() {
  const navigate = useNavigate();
  const [adherents, setAdherents]     = useState([]);
  const [disponibles, setDisponibles] = useState([]);
  const [form, setForm] = useState({ num_adherent: '', id_exemplaire: '' });
  const [msg, setMsg]   = useState(null);

  useEffect(() => {
    api.get('/api/adherents').then(r => setAdherents(r.data));
    api.get('/api/exemplaires/disponibles').then(r => setDisponibles(r.data));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    api.post('/api/emprunts', form)
       .then(() => {
         setMsg({ type: 'success', text: 'Emprunt enregistré avec succès ! Retour prévu dans 14 jours.' });
         setForm({ num_adherent: '', id_exemplaire: '' });
         api.get('/api/exemplaires/disponibles').then(r => setDisponibles(r.data));
       })
       .catch(e => setMsg({ type: 'danger', text: e.response?.data?.error || 'Erreur serveur' }));
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-7">
        <div className="page-header mb-4">
          <div className="page-category">Circulation</div>
          <h2 className="page-title">Nouvel emprunt</h2>
          <p className="page-subtitle">Enregistrer un emprunt de livre.</p>
        </div>

        <div className="card">
          <div className="card-header">
            <h5>📋 Enregistrer un emprunt</h5>
          </div>
          <div className="card-body p-4">
            {msg && (
              <div className={`alert alert-${msg.type} alert-dismissible`}>
                {msg.text}
                <button className="btn-close" onClick={() => setMsg(null)} />
              </div>
            )}

            <div className="alert alert-info small mb-4">
              <strong>Règles vérifiées automatiquement :</strong><br />
              • Max 3 emprunts actifs par adhérent &nbsp;•&nbsp; Exemplaire non abîmé &nbsp;•&nbsp; Aucune amende impayée
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="form-label">Adhérent</label>
                <select className="form-select" required value={form.num_adherent}
                  onChange={e => setForm({...form, num_adherent: e.target.value})}>
                  <option value="">— Sélectionner un adhérent —</option>
                  {adherents.map(a => (
                    <option key={a.num_adherent} value={a.num_adherent}>
                      {a.nom} {a.prenom} — {a.filiere} {a.niveau}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="form-label">Exemplaire disponible</label>
                <select className="form-select" required value={form.id_exemplaire}
                  onChange={e => setForm({...form, id_exemplaire: e.target.value})}>
                  <option value="">— Sélectionner un exemplaire —</option>
                  {disponibles.map(ex => (
                    <option key={ex.id_exemplaire} value={ex.id_exemplaire}>
                      #{ex.id_exemplaire} — {ex.titre} ({ex.auteur})
                    </option>
                  ))}
                </select>
                {disponibles.length === 0 &&
                  <small style={{ color: 'var(--red)' }}>Aucun exemplaire disponible.</small>}
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary">Enregistrer l'emprunt</button>
                <button type="button" className="btn btn-secondary"
                  onClick={() => navigate('/emprunts')}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NouvelEmprunt;
