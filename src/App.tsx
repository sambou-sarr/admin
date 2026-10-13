import { useEffect, useState } from 'react';
import { api, ApiError, errMsg, getToken, onSessionLost } from './lib/api';
import Layout from './components/Layout';
import { Btn, Loading, ToastProvider } from './components/ui';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Fiches from './pages/Fiches';
import FicheDetail from './pages/FicheDetail';
import Clients from './pages/Clients';
import Parametres from './pages/Parametres';
import Relances from './pages/Relances';

const useRoute = () => {
  const get = () => location.hash.replace(/^#/, '') || '/';
  const [r, setR] = useState(get);
  useEffect(() => { const h = () => { setR(get()); window.scrollTo(0, 0); }; window.addEventListener('hashchange', h); return () => window.removeEventListener('hashchange', h); }, []);
  return r;
};

function NotFound() {
  return <div className="empty-page"><h2>Page introuvable</h2><Btn kind="red" icon="back" onClick={() => { location.hash = '#/'; }}>Tableau de bord</Btn></div>;
}

export default function App() {
  const route = useRoute();
  const [auth, setAuth] = useState<'checking' | 'out' | 'in'>(getToken() ? 'checking' : 'out');
  const [notice, setNotice] = useState('');

  // Un jeton enregistré est vérifié une fois au démarrage (et doit être celui d'un administrateur).
  useEffect(() => {
    if (auth !== 'checking') return;
    api.checkSession().then(() => setAuth('in')).catch((e: unknown) => {
      if (e instanceof ApiError && e.status === 403) setNotice(e.message);
      else if (!(e instanceof ApiError && e.status === 401)) setNotice(errMsg(e));
      setAuth('out');
    });
  }, [auth]);
  useEffect(() => onSessionLost(() => { setNotice('Session expirée, reconnecte-toi.'); setAuth('out'); }), []);

  if (auth === 'checking') return <Loading />;
  if (auth === 'out') return <Login notice={notice} onDone={() => { setNotice(''); setAuth('in'); }} />;

  const [path, search = ''] = route.split('?');
  const [, base, id] = path.split('/');
  const query = new URLSearchParams(search);
  const n = Number(id);
  let page = <NotFound />;
  if (!base) page = <Dashboard />;
  else if (base === 'fiches') page = id ? (Number.isInteger(n) && n > 0 ? <FicheDetail id={n} /> : <NotFound />) : <Fiches query={query} />;
  else if (base === 'clients') page = <Clients />;
  else if (base === 'relances') page = <Relances />;
  else if (base === 'parametres') page = <Parametres />;

  return (
    <ToastProvider>
      <Layout route={path} onLogout={() => { setNotice(''); setAuth('out'); }}><div key={route} className="page-in">{page}</div></Layout>
    </ToastProvider>
  );
}
