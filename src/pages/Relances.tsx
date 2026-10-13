import { useState } from 'react';
import { api } from '../lib/api';
import { Badge, Empty, ErrorBox, Icon, Loading, useData } from '../components/ui';
import { FORMULES, FORMULE_TONE, fdate } from '../lib/format';
import { waLink } from '../lib/whatsapp';
import type { RelanceItem, RelanceType } from '../lib/types';

const TABS: { id: RelanceType; label: string; aide: string }[] = [
  { id: 'bientot', label: 'À renouveler', aide: 'Abonnement qui se termine dans les 30 jours. Les plus proches en premier.' },
  { id: 'expirees', label: 'Expirées', aide: 'Plus aucun abonnement valable. Les plus scannées en premier : ce sont les plus faciles à récupérer.' },
  { id: 'montee', label: 'Montée en gamme', aide: 'Formule Essentielle déjà scannée au moins 50 fois : bon moment pour proposer la Pro.' },
];

export default function Relances() {
  const [tab, setTab] = useState<RelanceType>('bientot');
  const [data, reload, err] = useData(() => Promise.all(TABS.map((t) => api.getRelances(t.id))));
  if (err) return <ErrorBox message={err} onRetry={reload} />;
  if (!data) return <Loading />;
  const idx = TABS.findIndex((t) => t.id === tab);
  const cur = data[idx];

  return (
    <>
      <header className="ph"><p className="eyebrow">Suivi commercial</p><h1>Relances</h1>
        <p className="lede">Les fiches à contacter. Le bouton WhatsApp ouvre la conversation avec un message prêt : tu le relis, puis tu l’envoies.</p></header>

      <div className="filters">
        {TABS.map((t, i) => <button key={t.id} className={`chip${tab === t.id ? ' on' : ''}`} onClick={() => setTab(t.id)}>{t.label} ({data[i].total})</button>)}
      </div>
      <p className="muted small">{TABS[idx].aide}</p>

      {cur.items.length ? <>
        <div className="table-wrap"><table className="tbl">
          <thead><tr><th>Fiche</th><th>Formule</th><th>Échéance</th><th>Scans</th><th>Contact</th><th /></tr></thead>
          <tbody>{cur.items.map((r) => <Row key={r.id} r={r} type={tab} />)}</tbody></table></div>
        {cur.total > cur.items.length && <p className="muted small">{cur.items.length} affichées sur {cur.total}.</p>}
      </> : <Empty>Rien à relancer ici pour le moment.</Empty>}
    </>
  );
}

function Row({ r, type }: { r: RelanceItem; type: RelanceType }) {
  const wa = waLink(type, r);
  const j = r.joursRestants;
  return (
    <tr onClick={() => { location.hash = `#/fiches/${r.id}`; }}>
      <td data-l="Fiche"><a href={`#/fiches/${r.id}`} onClick={(e) => e.stopPropagation()}><b>{r.entreprise || r.nom}</b></a><small>{r.entreprise ? `${r.nom} · ` : ''}/{r.slug}</small></td>
      <td data-l="Formule"><Badge tone={FORMULE_TONE[r.formule]}>{FORMULES[r.formule]}</Badge></td>
      <td data-l="Échéance">{r.dateEcheance ? <>{fdate(r.dateEcheance)}{j !== null && <small>{j >= 0 ? `dans ${j} j` : `expirée depuis ${-j} j`}</small>}</> : '—'}</td>
      <td data-l="Scans">{r.scansTotal}</td>
      <td data-l="Contact">{r.whatsapp || r.telephone || r.email || <span className="muted">Aucun</span>}</td>
      <td onClick={(e) => e.stopPropagation()}>{wa ? <a className="btn btn-ghost" href={wa} target="_blank" rel="noreferrer"><Icon n="ext" s={16} />WhatsApp</a> : <span className="muted small">Pas de numéro</span>}</td>
    </tr>
  );
}
