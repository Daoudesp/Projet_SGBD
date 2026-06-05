import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import '../App.css';

function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/api/dashboard').then(r => setStats(r.data));
  }, []);

  if (!stats) return (
    <div className="text-center mt-5">
      <div className="spinner-border" />
      <p className="mt-3" style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Chargement...</p>
    </div>
  );

  return (
    <div>
      {/* ── Hero ── */}
      <div className="dashboard-hero">
        <div className="row align-items-center">
          <div className="col-lg-7">
            <div className="hero-label">Tableau de bord</div>
            <h1 className="hero-title">
              Bienvenue à la <span>Bibliothèque</span><br />ESP
            </h1>
            <p className="hero-desc">
              Suivez en temps réel les emprunts, les retards et les amendes du Département Génie Informatique.
            </p>
            <div className="hero-actions">
              <Link to="/emprunts/nouveau" className="btn-hero-primary">+ Nouvel emprunt</Link>
              <Link to="/adherents/nouveau" className="btn-hero-outline">+ Adhérent</Link>
            </div>
          </div>
          <div className="col-lg-5 mt-4 mt-lg-0">
            <div className="hero-stats-grid">
              <div className="hero-stat-box">
                <div className="hero-stat-label">Emprunts</div>
                <div className="hero-stat-value">{stats.emprunts_actifs}</div>
              </div>
              <div className="hero-stat-box">
                <div className="hero-stat-label">Disponibles</div>
                <div className="hero-stat-value">{stats.exemplaires_dispo}</div>
              </div>
              <div className="hero-stat-box">
                <div className="hero-stat-label">Retards</div>
                <div className="hero-stat-value">{stats.en_retard}</div>
              </div>
              <div className="hero-stat-box">
                <div className="hero-stat-label">Impayés (FCFA)</div>
                <div className="hero-stat-value gold" style={{ fontSize: '1.7rem' }}>
                  {Number(stats.montant_impaye).toLocaleString('fr-FR')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="row g-3 mb-4">
        <div className="col-md-4 col-sm-6">
          <Link to="/emprunts" className="stat-card">
            <span className="stat-icon">📋</span>
            <div className="stat-number">{stats.emprunts_actifs}</div>
            <div className="stat-label">Emprunts actifs</div>
            <div className="stat-sublabel">livres en circulation</div>
          </Link>
        </div>

        <div className="col-md-4 col-sm-6">
          <Link to="/livres" className="stat-card">
            <span className="stat-icon">✅</span>
            <div className="stat-number text-green">{stats.exemplaires_dispo}</div>
            <div className="stat-label">Exemplaires disponibles</div>
            <div className="stat-sublabel">prêts à emprunter</div>
          </Link>
        </div>

        <div className="col-md-4 col-sm-6">
          <Link to="/retards" className="stat-card">
            <span className="stat-icon">⚠️</span>
            <div className={`stat-number ${stats.en_retard > 0 ? 'text-red' : 'text-green'}`}>
              {stats.en_retard}
            </div>
            <div className="stat-label">Emprunts en retard</div>
            <div className="stat-sublabel">à régulariser</div>
          </Link>
        </div>

        <div className="col-md-6 col-sm-6">
          <Link to="/amendes" className="stat-card">
            <span className="stat-icon">🔗</span>
            <div className={`stat-number ${stats.amendes_impayees > 0 ? 'text-gold' : 'text-green'}`}>
              {stats.amendes_impayees}
            </div>
            <div className="stat-label">Amendes non payées</div>
            <div className="stat-sublabel">dossiers ouverts</div>
          </Link>
        </div>

        <div className="col-md-6 col-sm-6">
          <Link to="/amendes" className="stat-card">
            <span className="stat-icon">💳</span>
            <div className={`stat-number ${stats.montant_impaye > 0 ? 'text-red' : 'text-green'}`} style={{ fontSize: '2.2rem' }}>
              {Number(stats.montant_impaye).toLocaleString('fr-FR')}
            </div>
            <div className="stat-label">FCFA impayés</div>
            <div className="stat-sublabel">total à recouvrer</div>
          </Link>
        </div>
      </div>

      {/* ── Accès rapide ── */}
      <div style={{ marginTop: '0.5rem' }}>
        <h5 style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-dark)' }}>
          Accès rapide
        </h5>
        <div className="quick-access-grid">
          {[
            { to: '/adherents', label: 'Adhérents',     icon: '👤' },
            { to: '/livres',    label: 'Livres',        icon: '📚' },
            { to: '/emprunts',  label: 'Emprunts',      icon: '📋' },
            { to: '/retards',   label: 'Retards',       icon: '⚠️' },
            { to: '/amendes',   label: 'Amendes',       icon: '🔗' },
          ].map(({ to, label, icon }) => (
            <Link key={to} to={to} className="quick-btn">
              <span>{icon}</span> {label} <span className="arrow">→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
