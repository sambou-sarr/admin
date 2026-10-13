# Support Connecté — Back-office (fiches client)

Front React + Vite branché sur l'API Express (`/api/admin/*`). Plus de Supabase, plus de mode démo.

## Lancer
1. Lancer l'API (`localhost:4000`).
2. `npm install` puis `npm run dev` → http://localhost:5173 (Vite redirige `/api` vers l'API : pas de CORS).
3. Se connecter avec un compte **ADMIN**.

## Production
Copier `.env.example` en `.env` et renseigner `VITE_API_URL` (+ CORS autorisé côté API), puis `npm run build`.

## Écrans
- **Tableau de bord** : `GET /admin/stats`, indicateurs cliquables.
- **Fiches** : liste filtrable/paginée, création, détail (coordonnées, propriétaire, code de carte, abonnements, slug, suspension, suppression).
- **Clients** : `GET /admin/users`, lien vers leurs fiches.
- **Paramètres** : prix, durée et activation des formules (`GET /admin/parametres`, `PATCH /admin/parametres/formules/:formule`).
- **Relances** : fiches à renouveler, expirées, à faire monter en gamme (`GET /admin/relances`), avec message WhatsApp prêt.
- **Tableau de bord – revenus** : encaissements par mois, fiches créées par semaine, estimation des renouvellements (`GET /admin/revenus`).
