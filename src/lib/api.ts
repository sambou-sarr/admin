// Client de l'API Express : un seul endroit parle au réseau.
import type {
  Abonnement, CreateFicheInput, FicheDetail, FichesPage, FormuleReglage, ListFichesParams, Parametres, RelanceType, RelancesPage, Revenus, Stats, SubscriptionInput, UsersPage,
} from './types';

const BASE = import.meta.env.VITE_API_URL ?? '/api';
const TOKEN_KEY = 'sc_admin_token';
const USER_KEY = 'sc_admin_user';

export interface SessionUser { email?: string; nom?: string | null }

import { ApiError } from './errors';
export { ApiError, errMsg } from './errors';

// localStorage peut être indisponible (navigation privée stricte) : on ne plante pas.
const store = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignoré */ } },
  del: (k: string) => { try { localStorage.removeItem(k); } catch { /* ignoré */ } },
};
export const getToken = () => store.get(TOKEN_KEY);
export const getUser = (): SessionUser | null => { try { return JSON.parse(store.get(USER_KEY) ?? 'null') as SessionUser | null; } catch { return null; } };
const clearSession = () => { store.del(TOKEN_KEY); store.del(USER_KEY); };

// L'interface s'abonne pour revenir à l'écran de connexion quand le jeton est refusé (401).
const lostListeners = new Set<() => void>();
export const onSessionLost = (cb: () => void) => { lostListeners.add(cb); return () => { lostListeners.delete(cb); }; };

type Query = Record<string, string | number | undefined | null>;
const qs = (q: Query = {}) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : '';
};

const FALLBACK: Record<number, string> = {
  400: 'Données invalides.', 401: 'Session expirée, reconnecte-toi.', 403: 'Accès refusé.', 404: 'Introuvable.',
  409: 'Conflit : cette valeur existe déjà.', 422: 'Opération impossible.', 429: 'Trop de tentatives, réessaie plus tard.',
};

function readError(data: unknown, status: number): ApiError {
  const d = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
  const e = (d.error && typeof d.error === 'object' ? d.error : d) as Record<string, unknown>;
  const message = typeof e.message === 'string' ? e.message : typeof d.error === 'string' ? d.error : undefined;
  const code = typeof e.code === 'string' ? e.code : undefined;
  return new ApiError(status, code, message ?? FALLBACK[status] ?? (status >= 500 ? 'Erreur du serveur.' : `Erreur ${status}.`));
}

async function request<T>(method: string, path: string, opts: { query?: Query; body?: unknown; auth?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = getToken();
  if (opts.auth !== false && token) headers.Authorization = `Bearer ${token}`;
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}${qs(opts.query)}`, { method, headers, body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined });
  } catch {
    throw new ApiError(0, 'RESEAU', 'Impossible de joindre l’API. Le serveur est-il lancé ?');
  }
  const text = await res.text();
  let data: unknown = null;
  if (text) { try { data = JSON.parse(text); } catch { data = null; } }
  if (!res.ok) {
    if (res.status === 401 && opts.auth !== false) { clearSession(); lostListeners.forEach((cb) => cb()); }
    throw readError(data, res.status);
  }
  return data as T;
}

const real = {
  // ───── Session ─────
  // Vérifie le jeton (GET /auth/me) et que le compte est ADMIN. Mémorise le nom affiché.
  async checkSession(): Promise<void> {
    const r = await request<Record<string, unknown>>('GET', '/auth/me');
    const u = (r.user && typeof r.user === 'object' ? r.user : r) as Record<string, unknown>;
    const role = typeof u.role === 'string' ? u.role.toLowerCase() : undefined;
    const refuse = () => { clearSession(); return new ApiError(403, 'INTERDIT', 'Ce compte n’est pas administrateur.'); };
    if (role && role !== 'admin') throw refuse();
    if (!role) { // /auth/me ne donne pas le rôle : seule une route admin tranche
      try { await request<Stats>('GET', '/admin/stats'); } catch (e) { if (e instanceof ApiError && e.status === 403) throw refuse(); throw e; }
    }
    store.set(USER_KEY, JSON.stringify({ email: typeof u.email === 'string' ? u.email : undefined, nom: typeof u.nom === 'string' ? u.nom : null }));
  },
  async login(email: string, password: string): Promise<void> {
    const r = await request<{ token?: string }>('POST', '/auth/login', { body: { email, password }, auth: false });
    if (!r.token) throw new ApiError(500, undefined, 'Réponse de connexion inattendue (pas de jeton).');
    store.set(TOKEN_KEY, r.token);
    await real.checkSession();
  },
  logout() { clearSession(); },

  // ───── Tableau de bord ─────
  stats: () => request<Stats>('GET', '/admin/stats'),

  getRevenus: () => request<Revenus>('GET', '/admin/revenus'),

  // ───── Fiches ─────
  listFiches: (p: ListFichesParams) => request<FichesPage>('GET', '/admin/fiches', { query: { ...p } }),
  getFiche: (id: number) => request<FicheDetail>('GET', `/admin/fiches/${id}`),
  createFiche: (b: CreateFicheInput) => request<{ fiche: { id: number; slug: string }; claimCode: string | null }>('POST', '/admin/fiches', { body: b }),
  // statut / slug / propriétaire (userId: null = retirer le propriétaire)
  updateFiche: (id: number, b: { slug?: string; statut?: 'active' | 'suspendue'; userId?: number | null }) => request<{ fiche: unknown }>('PATCH', `/admin/fiches/${id}`, { body: b }),
  deleteFiche: (id: number, slug: string) => request<{ ok: true }>('DELETE', `/admin/fiches/${id}`, { query: { confirmer: slug } }),
  generateClaimCode: (id: number) => request<{ claimCode: string }>('POST', `/admin/fiches/${id}/claim-code`),

  // ───── Abonnements ─────
  activateSubscription: (id: number, b: SubscriptionInput) => request<{ subscription: Abonnement }>('POST', `/admin/fiches/${id}/subscription`, { body: b }),
  cancelSubscription: (id: number, subId: number) => request<{ subscription: unknown }>('POST', `/admin/fiches/${id}/subscriptions/${subId}/cancel`),

  // ───── Paramètres (prix et durée des formules) ─────
  getParametres: () => request<Parametres>('GET', '/admin/parametres'),
  updateFormule: (formule: string, b: { prixFcfa?: number | null; dureeMois?: number | null; actif?: boolean }) => request<{ formule: FormuleReglage }>('PATCH', `/admin/parametres/formules/${formule}`, { body: b }),

  // ───── Relances (renouvellements, expirées, montée en gamme) ─────
  getRelances: (type: RelanceType, p: { jours?: number; scansMin?: number } = {}) => request<RelancesPage>('GET', '/admin/relances', { query: { type, ...p } }),

  // ───── Clients ─────
  listUsers: (p: { search?: string; role?: 'client' | 'admin'; page?: number; limit?: number }) => request<UsersPage>('GET', '/admin/users', { query: { ...p } }),
};

export const api = real;
