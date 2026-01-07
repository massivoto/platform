Overview
====

Note: we dropped Next.js
Using Vite + React + ReactRouter

Parfait — voilà un **plan de travail** ordonné, pragmatique, prêt à enchaîner dans Lovable (Next.js Page Router), en
gardant tes sections et en ajoutant juste ce qui manque pour que ça tienne tout seul. Chaque étape a : objectif, tâches,
livrables, critères d’acceptation.

---

# 0) FOUNDATIONS (avant BUILD)

**Objectif**: poser les bases code-style, tests, a11y (utile pour e2e), et Storybook.

* **Tâches**

    * Prettier + ESLint (React, hooks, jsx-a11y).
    * Vitest + React Testing Library (unitaire).
    * Playwright (e2e).
    * Storybook (docs visuelles TokenGetter/ScopePicker/ProviderCard).
    * `utils/testing/a11y.ts`: helper axe-core (ou jest-axe) pour tests a11y automatisables.

* **Livrables**

    * `package.json` scripts: `dev`, `build`, `test`, `test:e2e`, `lint`, `storybook`.
    * `.prettierrc`, `.eslintrc`, `vitest.config.ts`, `playwright.config.ts`, `.storybook/*`.

* **Acceptation**

    * `yarn test` passe, un composant Storybook visible, un test a11y vert.

---

# 1) BUILD

**Objectif**: squelette Next.js (pages router) + structure des dossiers.

* **Tâches**

    * App Next.js `apps/integrations`.
    * Arborescence clean :

      ```
      apps/integrations/
        pages/
          index.tsx
          providers/[id]/connect.tsx
          providers/[id]/settings.tsx
        components/
          ProviderCard.tsx
          TokenStateBadge.tsx
          ScopePicker.tsx         // visuel prêt pour OAuth plus tard
        lib/
          zod.ts
          errors.ts
          logger.ts
        styles/
      packages/
        integration-sdk/
        massivot o-client/
        ui-token-getter/
        providers/
          openai/
      ```

* **Livrables**

    * App qui démarre, routes vides fonctionnelles.

* **Acceptation**

    * `yarn dev` → pages `[id]` routent sans erreur.

---

# 2) REGISTRY

**Objectif**: définir le **contrat ProviderModule** + le **registry** (chargement statique au début, dynamique plus
tard).

* **Tâches**

    * SDK types minimal :

      ```ts
      // packages/integration-sdk/src/types.ts
      export type Token =
        | { type: 'apiKey'; key: string }
        | { type: 'oauth'; accessToken: string; refreshToken?: string; expiry?: number; scopes?: string[] };
  
      export type ProviderManifest = {
        id: string; name: string; logo: string; aboutMd: string;
        kind: 'oauth' | 'apiKey';
        oauth?: { defaultScopes: string[]; supportsScopePicker?: boolean };
        capabilities?: string[]; // e.g., ['read', 'write']
      };
  
      export type ProviderModule = {
        manifest: ProviderManifest;
        ConnectView: React.ComponentType;
        SettingsView: React.ComponentType;
        validateToken(token: Token): Promise<{ ok: true } | { ok: false; reason: string }>;
      };
      ```
    * Registry simple (import statique) :

      ```ts
      // apps/integrations/lib/registry.ts
      import openai from 'providers/openai';
      export const REGISTRY = [openai]; // plus tard: auto-discovery
      export const getProvider = (id:string) => REGISTRY.find(p => p.manifest.id === id);
      ```
    * Page `index.tsx` liste les providers via `ProviderCard`.

* **Livrables**

    * Types SDK + `registry.ts` + UI liste.

* **Acceptation**

    * La page d’accueil affiche OpenAI (logo, nom, about).

---

# 3) TOKEN

**Objectif**: composants **TokenGetter** (API key + placeholder OAuth), a11y-friendly pour tests.

* **Tâches**

    * `ui-token-getter` :

        * `ApiKeyTokenGetter`: input (type password), “Test & Save”, état (idle/loading/success/error).
        * `OAuthTokenGetter` (squelette visuel + ScopePicker, l’action sera branchée plus tard).
    * `ScopePicker` (switch list, “Reset to defaults”).

* **Livrables**

    * Composants réutilisables + stories Storybook.
    * Tests unitaires: rendu, validation, a11y.

* **Acceptation**

    * Cliquer “Test & Save” déclenche callbacks simulés, états visibles, tests verts.

---

# 4) OPEN_AI (première intégration)

**Objectif**: implémenter une intégration **simple** (API key seulement).

* **Tâches**

    * `packages/providers/openai/index.tsx` :

      ```ts
      import type { ProviderModule, Token } from '@massivoto/integration-sdk';
      import { ApiKeyTokenGetter } from '@massivoto/ui-token-getter';
  
      const manifest = {
        id: 'openai',
        name: 'OpenAI',
        kind: 'apiKey',
        logo: '/logos/openai.svg',
        aboutMd: 'Connect to OpenAI with your API key. Use it in workflows to generate text, embeddings, etc.',
        capabilities: ['read','write']
      } as const;
  
      async function validateToken(token: Token) {
        if (token.type !== 'apiKey') return { ok: false, reason: 'Invalid token type' };
        // Option: ping a trivial endpoint, sinon valider juste la forme
        return token.key.trim() ? { ok: true } : { ok: false, reason: 'Empty key' };
      }
  
      const ConnectView = () => <ApiKeyTokenGetter provider={manifest} /* storage injected via page */ />;
      const SettingsView = ConnectView;
  
      export default { manifest, validateToken, ConnectView, SettingsView } satisfies ProviderModule;
      ```
    * Pages `connect.tsx` / `settings.tsx`: chargent le module via `getProvider(id)` + fournissent `storage` (voir
      étapes SAVE_*).

* **Livrables**

    * OpenAI visible, connectable visuellement (sans persistance encore).

* **Acceptation**

    * Le flow “saisir clé → test ok/ko” marche en front.

---

# 5) CLIENT

**Objectif**: `/massivoto-client` — abstraction de **persistence** (adapter IndexedDB / adapter webservice) + crypto
front (optionnelle).

* **Tâches**

    * Interface commune :

      ```ts
      export type StorageAdapter = {
        getToken(providerId: string): Promise<Token | null>;
        setToken(providerId: string, token: Token | null): Promise<void>;
        loadConfig<T = unknown>(providerId: string): Promise<T | null>;
        saveConfig<T = unknown>(providerId: string, cfg: T): Promise<void>;
      };
  
      export function createClient(opts: {
        storage: 'indexeddb' | 'express';
        backend?: { baseUrl: string; authHeader?: () => Promise<string|undefined> };
        crypto?: { getPassphrase?: () => Promise<string> }; // pour chiffrer côté front
      }): StorageAdapter;
      ```
    * Impl adapter **IndexedDB** (Dexie ou IDB): tables `tokens`, `configs`.

        * Optionnel: chiffrer `Token` via WebCrypto AES-GCM si `crypto.getPassphrase` fourni (utile OSS local).
    * Impl adapter **Express** (appelle `POST/GET /api/storage/:providerId`).

* **Livrables**

    * `massivoto-client` exporte `createClient` + deux adapters.

* **Acceptation**

    * Tests unitaires: set/get Token + config (indexeddb) ; mock fetch pour express.

---

# 6) SAVE_INDEX (persistence locale IndexedDB)

**Objectif**: brancher OpenAI sur IndexedDB.

* **Tâches**

    * Dans `providers/[id]/connect.tsx`, créer le client :

      ```ts
      const storage = createClient({ storage: 'indexeddb', crypto: { getPassphrase: async () => 'dev-pass' }});
      ```
    * Passer `storage` au `ConnectView`.
    * Implémenter dans `ApiKeyTokenGetter` l’écriture via `storage.setToken`.

* **Livrables**

    * OpenAI: “Test & Save” → token persiste en IndexedDB ; `settings.tsx` relit l’état.

* **Acceptation**

    * Refresh page: l’état connecté s’affiche correctement (badge OK).
    * Test e2e Playwright: connect → reload → still connected.

---

# 7) SAVE_WS (persistence via webservice ExpressJS)

**Objectif**: même flow mais en appelant un backend (contrat simple, impl non demandée).

* **Tâches**

    * Définir **contrat backend** (côté front) :

        * `GET /api/storage/:providerId/token` → `{ token: Token|null }`
        * `PUT /api/storage/:providerId/token` → body `{ token }` → `{ ok: true }`
        * `GET /api/storage/:providerId/config` → `{ config: any|null }`
        * `PUT /api/storage/:providerId/config` → `{ ok: true }`
    * Adapter `createClient({ storage: 'express', backend: { baseUrl } })`.
    * Ajouter un switch UI (ou env var) pour choisir l’adapter.

* **Livrables**

    * Storage Express fonctionnel côté front (mocks si pas d’impl serveur).

* **Acceptation**

    * Tests unitaires (fetch mock) + un test e2e avec un mini mock-server (Playwright).

---

# 8) LOGS (observabilité locale utile tests)

**Objectif**: tracer les actions (connect, validate, save) pour la page “logs du projet”.

* **Tâches**

    * `lib/logger.ts`: event bus simple (in-memory) + `window.__MV_LOGS` fallback.
    * Hooks `useLogEvent()` pour émettre : `integration_connect_start/success/error`, `token_save`, etc.
    * Page `/logs` (ou section) lisant la pile d’évènements.

* **Livrables**

    * Journal visible (filtrable par provider).

* **Acceptation**

    * Connect OpenAI → 2–3 entrées apparaissent ; test e2e vérifie présence.

---

# 9) A11Y (orienté tests)

**Objectif**: patterns systématiques pour Playwright + axe.

* **Tâches**

    * Rôles ARIA et `aria-live="polite"` sur status de TokenGetter.
    * Labels explicites (`<label htmlFor>`) pour inputs.
    * Focus management après succès/erreur.
    * Helpers de test `findByRole`, `getByLabelText` partout.

* **Livrables**

    * Checklists a11y appliquées sur TokenGetter / ScopePicker / ProviderCard.

* **Acceptation**

    * `jest-axe` (ou équiv) sur composants → zéro violation majeure.

---

# 10) TESTS (résumé ciblé)

* **Unit (Vitest)**

    * `ApiKeyTokenGetter`: transitions (idle→loading→success/error), a11y.
    * `ScopePicker`: toggle/reset.
    * `massivoto-client` adapters: set/get token + config.
* **E2E (Playwright)**

    * Flow OpenAI IndexedDB: connect → reload → settings ok.
    * Flow Express (mock): connect → fetch calls ok.
    * Logs: évènements visibles après connexion.

---

# 11) FUTUR (après OpenAI)

* **Google Sheets / Mailgun / Apify / Gemini**

    * Ajout module par intégration (répertoire + manifest + views).
    * Pour OAuth: réutiliser `OAuthTokenGetter` + ScopePicker (brancher quand le backend OAuth sera prêt).
* **Registry dynamique**

    * Remplacer liste statique par auto-discovery (lazy import).

---

## Récap ordonnancement

1. **Foundations** → 2) **BUILD** → 3) **REGISTRY** → 4) **TOKEN** → 5) **OPEN_AI** → 6) **CLIENT** → 7) **SAVE_INDEX
   ** → 8) **SAVE_WS** → 9) **LOGS** → 10) **A11Y** → 11) **TESTS**.

Tu peux attaquer **OPEN_AI** juste après TOKEN pour garder la motivation (valeur visible), puis brancher la
persistence (CLIENT → SAVE_INDEX → SAVE_WS). Ensuite seulement, tu généralises aux autres intégrations.
