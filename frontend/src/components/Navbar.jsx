import { Link, useLocation } from 'react-router-dom';
import '../App.css';

const NAV_ITEMS = [
  { path: '/',          label: 'Tableau de bord', icon: '⊞' },
  { path: '/adherents', label: 'Adhérents',        icon: '👤' },
  { path: '/livres',    label: 'Livres',           icon: '📚' },
  { path: '/emprunts',  label: 'Emprunts',         icon: '📋' },
  { path: '/retards',   label: 'Retards',          icon: '⚠' },
  { path: '/amendes',   label: 'Amendes',          icon: '🔗' },
];

function Navbar() {
  const { pathname } = useLocation();

  const isActive = (path) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path);

  return (
    <nav className="navbar navbar-expand-lg" style={{ background: 'white', borderBottom: '1px solid rgba(26,61,43,0.1)', padding: '0.65rem 1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
      <div className="container d-flex align-items-center justify-content-between w-100" style={{ maxWidth: 1200 }}>

        {/* Logo */}
        <Link to="/" className="navbar-brand d-flex align-items-center gap-2" style={{ textDecoration: 'none' }}>
          <div className="brand-logo">📚</div>
          <div className="brand-text">
            <span className="brand-name">Bibliothèque ESP</span>
            <span className="brand-sub">Génie Informatique</span>
          </div>
        </Link>

        {/* Toggler */}
        <button
          className="navbar-toggler border-0"
          data-bs-toggle="collapse"
          data-bs-target="#navMenu"
          style={{ boxShadow: 'none' }}
        >
          <span className="navbar-toggler-icon" />
        </button>

        {/* Nav links */}
        <div className="collapse navbar-collapse justify-content-center" id="navMenu">
          <ul className="navbar-nav gap-1 mx-auto">
            {NAV_ITEMS.map(({ path, label }) => (
              <li key={path} className="nav-item">
                <Link
                  to={path}
                  className={`nav-link${isActive(path) ? ' active' : ''}`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* User avatar */}
        <div className="user-avatar d-none d-lg-flex">AD</div>
      </div>
    </nav>
  );
}

export default Navbar;
