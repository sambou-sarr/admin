// Formes des réponses de l'API (voir admin.service.ts). L'API parle en minuscules : "pro", "active".
export type Formule = 'essentielle' | 'pro' | 'signature';
export type Statut = 'active' | 'suspendue';

export interface Proprietaire { id: number; email: string; nom: string | null }
export interface Pagination { page: number; limit: number; total: number; totalPages: number }

export interface FicheRow {
  id: number; slug: string; nom: string; entreprise: string; statut: Statut;
  formule: Formule; expiree: boolean; dateEcheance: string | null; scansTotal: number;
  createdAt: string; proprietaire: Proprietaire | null; carteALier: boolean;
}
export interface FichesPage { fiches: FicheRow[]; pagination: Pagination }

export interface Stats {
  fiches: { total: number; suspendues: number; expirees: number; expirentBientot: number; sansProprietaire: number; cartesALier: number; nouvellesSur30Jours: number };
  formules: Record<Formule, number>;
  scansTotal: number;
  clients: number;
}

export interface Abonnement {
  id: number; formule: Formule; statut: string; debut: string; fin: string | null;
  montantFcfa: number | null; referencePaiement: string | null; annuleLe: string | null;
}
// Le détail d'une fiche vient de toFicheDto (module fiches) : on ne lit que quelques champs, sans supposer le reste.
export type FicheDto = { id: number; slug: string } & Record<string, unknown>;
export interface FicheDetail { fiche: FicheDto; proprietaire: Proprietaire | null; claimCode: string | null; abonnements: Abonnement[] }

export interface UserRow { id: number; email: string; nom: string | null; role: 'client' | 'admin'; emailVerifie: boolean; createdAt: string; nbFiches: number }
export interface UsersPage { users: UserRow[]; pagination: Pagination }

export interface ListFichesParams {
  search?: string; statut?: string; formule?: string; expiration?: string; userId?: string;
  carteALier?: string; tri?: string; page?: number; limit?: number;
}

export interface CreateFicheInput {
  prenom: string; nom?: string; fonction?: string; entreprise?: string; telephone?: string; whatsapp?: string;
  email?: string; secteur?: string; slug?: string; userId?: number; formule: Formule;
  amountFcfa?: number; paymentRef?: string; enLigneSeule: boolean;
}
export interface SubscriptionInput { plan: Formule; endsAt?: string | null; amountFcfa?: number; paymentRef?: string }

export interface FormuleReglage { formule: Formule; nom: string; prixFcfa: number | null; dureeMois: number | null; actif: boolean }
export interface Parametres { formules: FormuleReglage[] }

export type RelanceType = 'bientot' | 'expirees' | 'montee';
export interface RelanceItem {
  id: number; slug: string; nom: string; prenom: string; entreprise: string; formule: Formule;
  dateEcheance: string | null; joursRestants: number | null; scansTotal: number;
  telephone: string | null; whatsapp: string | null; email: string | null; proprietaire: Proprietaire | null;
}
export interface RelancesPage { total: number; items: RelanceItem[] }

export interface Revenus {
  encaisse: { ceMois: number; moisPrecedent: number; evolutionPct: number | null };
  mois: { mois: string; montantFcfa: number; nbPaiements: number }[];
  parFormule: Record<Formule, { montantFcfa: number; nbPaiements: number }>;
  aRenouveler: { nb: number; montantEstimeFcfa: number };
  fichesParSemaine: { semaine: string; nb: number }[];
}
