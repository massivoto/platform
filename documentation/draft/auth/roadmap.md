Ce qui existe déjà

- docker-compose.yml avec PostgreSQL 16 (port 5432, user/pass massivoto/massivoto_dev)
- PostgresTokenRepository avec migrations, mais schema OAuth-only (pas de colonne kind, api_key, secret)
- IntegrationToken dans auth-domain supporte déjà apiKey?: TokenSecret et kind: API_KEY
- ExecutionContext.env: Record<string, string> existe mais toujours vide
- LocalRunner accepte un Partial<ExecutionContext> mais personne n'injecte les credentials

Les gaps pour ton use case "Gemini API key dans Postgres → context.env"

5 étapes, du plus bas au plus haut :

1. Schema DB + Repository (auth-backend)

- Migration 002 : ajouter colonnes kind VARCHAR(50), api_key TEXT, secret TEXT
- Adapter PostgresTokenRepository : rowToStoredToken() lit kind depuis la DB
- Ajouter saveApiKey(userId, providerId, apiKey) au TokenRepository interface
- Tests : IT avec testcontainers-postgres ou directement le docker-compose existant

2. Seed CLI (auth-backend)

- Un script minimal (pas de UI) pour insérer une API key : yarn seed:apikey --provider=gemini --key=xxx
  --user=local
- Réutilise TokenRepository.saveApiKey()
- Testable en UT avec InMemoryTokenRepository

3. CredentialVault interface (packages/kit)

- Interface dans kit (pas dans runtime, pour que ce soit partageable) :
  interface CredentialVault {
  getCredential(userId: string, providerId: string): Promise<Credential | null>
  }
  type Credential = { kind: ProviderKind; token?: string; apiKey?: string }
- Deux implémentations : InMemoryCredentialVault (tests) et HttpCredentialVault (appelle auth-backend)

4. Endpoint GET token dans auth-backend

- Le endpoint GET /api/integrations/:providerId?user_id=xxx existe déjà mais retourne un IntegrationSummary
  (pas le token brut)
- Ajouter GET /api/credentials/:providerId?user_id=xxx qui retourne le token/apiKey déchiffré (pour appels
  internes runtime → backend uniquement)
- Sécuriser plus tard (v1.0) avec un token interne service-to-service

5. Injection dans le Runner (packages/runtime)

- Le LocalRunner reçoit un CredentialVault en DI
- Avant d'exécuter, il query le vault pour les providers déclarés par les commandes
- Injecte dans context.env : env["gemini.api_key"] = credential.apiKey
- Alternative plus simple pour v0.6 : le runner query le vault pour tous les credentials du user et les
  injecte d'un coup (comme le "auth bundle" de Zapier)

  ---
Pro/cons des deux approches d'injection

Approche: Par commande (Windmill-style) : injecter lazy quand le handler en a besoin
Pro: Minimal exposure, clean
Con: Complexe : le handler doit déclarer ses providers, l'interpreter doit orchestrer
────────────────────────────────────────
Approche: Auth bundle (Zapier-style) : tout injecter au démarrage du programme
Pro: Simple, rapide à implémenter
Con: Tous les tokens en mémoire pendant toute l'exécution

Ma recommandation pour v0.6 : Auth bundle. C'est 10x plus simple, le programme tourne en local, et on
resserrera en v1.0 avec l'injection lazy. Le pattern Windmill est meilleur pour le SaaS multi-tenant, pas pour
un runner local.

  ---
Ordre d'implémentation suggéré

1. Migration DB + saveApiKey()          ← pérenne, ne bougera plus
2. Seed CLI                             ← utile immédiatement pour tester
3. GET /api/credentials endpoint        ← pérenne, le runtime en aura toujours besoin
4. CredentialVault interface + impls    ← pérenne, contract stable
5. Injection auth-bundle dans Runner    ← simple pour v0.6, évoluera en v1.0

Chaque step est testable indépendamment. Le code est pérenne sauf le step 5 qui évoluera vers du lazy
injection.