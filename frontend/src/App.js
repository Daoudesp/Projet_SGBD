import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar         from './components/Navbar';
import Dashboard      from './components/Dashboard';
import AdherentList   from './components/adherents/AdherentList';
import AdherentForm   from './components/adherents/AdherentForm';
import LivreList      from './components/livres/LivreList';
import EmpruntsActifs from './components/emprunts/EmpruntsActifs';
import NouvelEmprunt  from './components/emprunts/NouvelEmprunt';
import RapportRetards from './components/retards/RapportRetards';
import AmendeList     from './components/amendes/AmendeList';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="container mt-4 pb-5">
        <Routes>
          <Route path="/"                  element={<Dashboard />} />
          <Route path="/adherents"         element={<AdherentList />} />
          <Route path="/adherents/nouveau" element={<AdherentForm />} />
          <Route path="/adherents/edit/:id" element={<AdherentForm />} />
          <Route path="/livres"            element={<LivreList />} />
          <Route path="/emprunts"          element={<EmpruntsActifs />} />
          <Route path="/emprunts/nouveau"  element={<NouvelEmprunt />} />
          <Route path="/retards"           element={<RapportRetards />} />
          <Route path="/amendes"           element={<AmendeList />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
