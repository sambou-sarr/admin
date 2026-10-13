import { useState } from 'react';
import type { FormEvent } from 'react';
import { api, errMsg } from '../lib/api';

export default function Login({ notice, onDone }: { notice?: string; onDone: () => void }) {
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [err, setErr] = useState(notice ?? ''), [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { await api.login(email.trim(), password); onDone(); } catch (x) { setErr(errMsg(x)); } finally { setBusy(false); }
  };
  return (
    <div className="login">
      <form onSubmit={submit}>
        <span className="logo lg">S</span><h1>Back-office</h1>
        <p>Accès réservé aux administrateurs.</p>
        <input type="email" required autoComplete="username" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" required autoComplete="current-password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn btn-red" type="submit" disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</button>
        {err && <small className="err">{err}</small>}
      </form>
    </div>
  );
}
