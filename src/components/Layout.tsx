import { useState } from 'react';
import type { ReactNode } from 'react';
import { Icon } from './ui';
import type { IconName } from './ui';
import { api, getUser } from '../lib/api';

const NAV: [string, string, IconName][] = [
  ['/', 'Tableau de bord', 'dash'], ['/fiches', 'Fiches', 'card'], ['/clients', 'Clients', 'users'], ['/relances', 'Relances', 'zap'], ['/parametres', 'Paramètres', 'sliders'],
];

export default function Layout({ route, onLogout, children }: { route: string; onLogout: () => void; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const user = getUser();
  const label = user?.nom || user?.email || 'Administrateur';
  const active = (p: string) => (p === '/' ? route === '/' : route.startsWith(p));
  const logout = () => { api.logout(); onLogout(); };
  return (
    <div className="app">
      <aside className={`side${open ? ' open' : ''}`}>
        <div className="brand"><span className="logo">S</span><div><b>SUPPORT</b><small>CONNECTÉ · Back-office</small></div></div>
        <nav>{NAV.map(([p, l, i]) => <a key={p} href={'#' + p} className={active(p) ? 'on' : ''} onClick={() => setOpen(false)}><Icon n={i} />{l}</a>)}</nav>
        <div className="side-foot">
          <span className="me"><b>{label[0]?.toUpperCase()}</b>{label}<small>Administrateur</small></span>
          <button className="icon-btn light" onClick={logout} aria-label="Se déconnecter"><Icon n="out" /></button>
        </div>
      </aside>
      {open && <div className="side-veil" onClick={() => setOpen(false)} />}
      <div className="main">
        <div className="top-mob"><button className="icon-btn" onClick={() => setOpen(true)} aria-label="Menu"><Icon n="menu" /></button><span className="logo sm">S</span><b>Back-office</b></div>
        <main className="content">{children}</main>
      </div>
      <nav className="tabbar">{NAV.map(([p, l, i]) => <a key={p} href={'#' + p} className={active(p) ? 'on' : ''}><Icon n={i} /><span>{l.split(' ')[0]}</span></a>)}
        <button onClick={logout}><Icon n="out" /><span>Quitter</span></button></nav>
    </div>
  );
}
