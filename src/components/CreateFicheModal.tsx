import { useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../lib/api';
import { FORMULES, SECTEURS } from '../lib/format';
import { Btn, CopyBtn, Field, Modal, Seg, useAction } from './ui';
import UserPicker from './UserPicker';
import type { CreateFicheInput, Formule, UserRow } from '../lib/types';

const EMPTY = { prenom: '', nom: '', fonction: '', entreprise: '', telephone: '', whatsapp: '', email: '', secteur: '', slug: '', formule: 'essentielle' as Formule, amountFcfa: '', paymentRef: '', enLigneSeule: false };
const opt = (s: string) => s.trim() || undefined;

export default function CreateFicheModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [v, setV] = useState(EMPTY);
  const [owner, setOwner] = useState<UserRow | null>(null);
  const [mode, setMode] = useState<'carte' | 'client'>('carte');
  const [done, setDone] = useState<{ id: number; slug: string; claimCode: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const run = useAction();
  const set = <K extends keyof typeof EMPTY>(k: K, val: (typeof EMPTY)[K]) => setV((x) => ({ ...x, [k]: val }));
  const text = (k: keyof typeof EMPTY) => ({ value: v[k] as string, onChange: (e: { target: { value: string } }) => set(k, e.target.value as never) });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (mode === 'client' && !owner) return run(() => Promise.reject(new Error('Choisis le compte client, ou passe en « Code de carte ».')));
    const body: CreateFicheInput = {
      prenom: v.prenom.trim(), nom: opt(v.nom), fonction: opt(v.fonction), entreprise: opt(v.entreprise), telephone: opt(v.telephone), whatsapp: opt(v.whatsapp),
      email: opt(v.email), secteur: opt(v.secteur), slug: opt(v.slug), userId: mode === 'client' ? owner!.id : undefined,
      formule: v.formule, amountFcfa: v.amountFcfa === '' ? undefined : Number(v.amountFcfa), paymentRef: opt(v.paymentRef), enLigneSeule: v.enLigneSeule,
    };
    setBusy(true);
    const r = await run(() => api.createFiche(body), 'Fiche créée');
    setBusy(false);
    if (r) { setDone({ id: r.fiche.id, slug: r.fiche.slug, claimCode: r.claimCode }); onCreated(); }
  };

  if (done) return (
    <Modal title="Fiche créée" onClose={onClose}>
      <div className="form">
        <p className="muted">Adresse de la fiche : <b>/{done.slug}</b></p>
        {done.claimCode ? <>
          <p>Code à imprimer sur la carte. Le client le saisira après avoir créé son compte :</p>
          <div className="code-box"><code>{done.claimCode}</code><CopyBtn text={done.claimCode} /></div>
          <p className="note-gold">Ce code est aussi consultable plus tard sur la fiche, tant qu’il n’a pas été utilisé.</p>
        </> : <p>La fiche est déjà rattachée à <b>{owner?.email}</b>.</p>}
        <div className="form-a"><Btn onClick={onClose}>Fermer</Btn><Btn kind="red" onClick={() => { location.hash = `#/fiches/${done.id}`; }}>Ouvrir la fiche</Btn></div>
      </div>
    </Modal>
  );

  return (
    <Modal title="Nouvelle fiche" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <div className="f2"><Field label="Prénom *"><input required maxLength={100} autoFocus {...text('prenom')} /></Field><Field label="Nom"><input maxLength={100} {...text('nom')} /></Field></div>
        <div className="f2"><Field label="Entreprise"><input maxLength={150} {...text('entreprise')} /></Field><Field label="Fonction"><input maxLength={150} {...text('fonction')} /></Field></div>
        <div className="f2"><Field label="Téléphone"><input type="tel" maxLength={30} {...text('telephone')} /></Field><Field label="WhatsApp"><input type="tel" maxLength={30} {...text('whatsapp')} /></Field></div>
        <div className="f2"><Field label="E-mail"><input type="email" maxLength={254} {...text('email')} /></Field>
          <Field label="Activité"><select {...text('secteur')}><option value="">—</option>{Object.entries(SECTEURS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field></div>
        <div className="f2"><Field label="Formule"><select value={v.formule} onChange={(e) => set('formule', e.target.value as Formule)}>{Object.entries(FORMULES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
          <Field label="Adresse (slug)" hint="Vide = générée"><input pattern="[a-z0-9]+(-[a-z0-9]+)*" minLength={3} maxLength={60} placeholder="studio-awa" {...text('slug')} /></Field></div>
        <div className="f2"><Field label="Montant payé (F)" hint="Vide = prix de la formule"><input type="number" min={0} {...text('amountFcfa')} /></Field><Field label="Référence de paiement"><input maxLength={100} placeholder="WAVE-…" {...text('paymentRef')} /></Field></div>
        <label className="toggle"><input type="checkbox" checked={v.enLigneSeule} onChange={(e) => set('enLigneSeule', e.target.checked)} /><span />Badge « Créée gratuitement avec Support Connecté »</label>
        <div className="field"><span className="field-l">Propriétaire</span>
          <Seg value={mode} onChange={setMode} options={[['carte', 'Code de carte (le client rattache)'], ['client', 'Compte existant']]} />
          {mode === 'client' && (owner
            ? <p className="picked"><b>{owner.email}</b> <button type="button" className="link small" onClick={() => setOwner(null)}>changer</button></p>
            : <UserPicker onPick={setOwner} />)}
          {mode === 'carte' && <small className="muted">Un code est généré : à imprimer sur la carte, le client le saisit après son inscription.</small>}
        </div>
        <div className="form-a"><Btn onClick={onClose}>Annuler</Btn><button className="btn btn-red" type="submit" disabled={busy}>Créer la fiche</button></div>
      </form>
    </Modal>
  );
}
