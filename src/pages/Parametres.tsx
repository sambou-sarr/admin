import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Badge, ErrorBox, Loading, useAction, useData } from '../components/ui';
import { FORMULE_TONE, fcfa } from '../lib/format';
import type { FormuleReglage } from '../lib/types';

// '' → null ; sinon entier ≥ min ; undefined = saisie invalide
const parse = (t: string, min: number): number | null | undefined => {
  const v = t.trim().replace(/\s/g, '');
  if (v === '') return null;
  const n = Number(v);
  return Number.isInteger(n) && n >= min ? n : undefined;
};

export default function Parametres() {
  const [data, reload, err] = useData(() => api.getParametres());
  const [rows, setRows] = useState<FormuleReglage[]>([]);
  const run = useAction();
  useEffect(() => { if (data) setRows(data.formules); }, [data]);

  if (err) return <ErrorBox message={err} onRetry={reload} />;
  if (!data) return <Loading />;
  const patch = (f: FormuleReglage) => setRows((l) => l.map((x) => (x.formule === f.formule ? f : x)));

  return (
    <>
      <header className="ph"><p className="eyebrow">Réglages</p><h1>Paramètres</h1>
        <p className="lede">Prix et durée des formules. Ces valeurs sont proposées par défaut quand tu actives une formule sur une fiche ; les abonnements déjà créés ne changent pas.</p></header>

      <div className="table-wrap"><table className="tbl">
        <thead><tr><th>Formule</th><th>Prix (F)</th><th>Durée (mois)</th><th>Active</th></tr></thead>
        <tbody>{rows.map((f) => (
          <tr key={f.formule} className={f.actif ? '' : 'off'}>
            <td data-l="Formule"><Badge tone={FORMULE_TONE[f.formule]}>{f.nom}</Badge></td>
            <td data-l="Prix"><NumInput value={f.prixFcfa} min={0} placeholder="à définir" label={`Prix ${f.nom}`}
              onSave={async (n) => { const r = await run(() => api.updateFormule(f.formule, { prixFcfa: n }), n === null ? 'Prix retiré' : `Prix enregistré : ${fcfa(n)}`); if (r) patch(r.formule); return !!r; }} /></td>
            <td data-l="Durée"><NumInput value={f.dureeMois} min={1} placeholder="sans échéance" label={`Durée ${f.nom}`}
              onSave={async (n) => { const r = await run(() => api.updateFormule(f.formule, { dureeMois: n }), n === null ? 'Sans échéance' : `Durée enregistrée : ${n} mois`); if (r) patch(r.formule); return !!r; }} /></td>
            <td data-l="Active"><label className="toggle"><input type="checkbox" checked={f.actif} aria-label={`Activer ${f.nom}`}
              onChange={async (e) => { const r = await run(() => api.updateFormule(f.formule, { actif: e.target.checked }), e.target.checked ? 'Formule activée' : 'Formule désactivée'); if (r) patch(r.formule); }} /><span /></label></td>
          </tr>))}</tbody></table></div>
      <p className="muted small">Une formule désactivée ne peut plus être attribuée à une fiche ; les abonnements en cours continuent.</p>
    </>
  );
}

// Enregistre à la sortie du champ (ou touche Entrée) si la valeur a changé.
function NumInput({ value, min, placeholder, label, onSave }: { value: number | null; min: number; placeholder: string; label: string; onSave: (n: number | null) => Promise<boolean> }) {
  const initial = value === null ? '' : String(value);
  const [v, setV] = useState(initial);
  const run = useAction();
  useEffect(() => setV(initial), [initial]);
  const save = async () => {
    if (v.trim() === initial) return;
    const n = parse(v, min);
    if (n === undefined) { setV(initial); return void run(() => Promise.reject(new Error(`Valeur invalide : un nombre entier, ${min === 0 ? 'positif' : 'au moins ' + min}.`))); }
    if (!(await onSave(n))) setV(initial);
  };
  return <input className="prix-in" inputMode="numeric" aria-label={label} placeholder={placeholder} value={v} onChange={(e) => setV(e.target.value)} onBlur={save} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} />;
}
