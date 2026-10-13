import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { api } from '../lib/api';
import { Badge, Empty, ErrorBox, Icon, Loading, Pager, useData, useDebounced } from '../components/ui';
import { fdate } from '../lib/format';

export default function Clients() {
  const [text, setText] = useState(''), [role, setRole] = useState(''), [page, setPage] = useState(1);
  const search = useDebounced(text.trim(), 300);
  useEffect(() => setPage(1), [search]);
  const [data, reload, err] = useData(() => api.listUsers({ search: search || undefined, role: (role || undefined) as 'client' | 'admin' | undefined, page, limit: 20 }), [search, role, page]);
  return (
    <>
      <header className="ph"><p className="eyebrow">Comptes</p><h1>Clients</h1><p className="lede">Les comptes inscrits. Un client voit ses fiches après avoir saisi le code de sa carte.</p></header>
      <div className="filters">
        <label className="search"><Icon n="search" /><input placeholder="E-mail ou nom…" value={text} onChange={(e) => setText(e.target.value)} /></label>
        <select value={role} onChange={(e: ChangeEvent<HTMLSelectElement>) => { setRole(e.target.value); setPage(1); }} aria-label="Rôle"><option value="">Tous les rôles</option><option value="client">Clients</option><option value="admin">Administrateurs</option></select>
      </div>
      {err ? <ErrorBox message={err} onRetry={reload} /> : !data ? <Loading /> : data.users.length ? <>
        <div className="table-wrap"><table className="tbl">
          <thead><tr><th>Compte</th><th>Rôle</th><th>E-mail</th><th>Fiches</th><th>Inscrit le</th></tr></thead>
          <tbody>{data.users.map((u) => (
            <tr key={u.id} onClick={() => { location.hash = `#/fiches?userId=${u.id}`; }}>
              <td data-l="Compte"><b>{u.nom || u.email}</b>{u.nom && <small>{u.email}</small>}</td>
              <td data-l="Rôle">{u.role === 'admin' ? <Badge tone="dark">Admin</Badge> : <Badge>Client</Badge>}</td>
              <td data-l="E-mail">{u.emailVerifie ? <Badge tone="green">Vérifié</Badge> : <Badge tone="gold">Non vérifié</Badge>}</td>
              <td data-l="Fiches">{u.nbFiches ? <a className="link" href={`#/fiches?userId=${u.id}`} onClick={(e) => e.stopPropagation()}>{u.nbFiches}</a> : 0}</td>
              <td data-l="Inscrit le">{fdate(u.createdAt)}</td>
            </tr>))}</tbody></table></div>
        <Pager page={data.pagination.page} totalPages={data.pagination.totalPages} total={data.pagination.total} noun="compte" onPage={setPage} />
      </> : <Empty>Aucun compte trouvé.</Empty>}
    </>
  );
}
