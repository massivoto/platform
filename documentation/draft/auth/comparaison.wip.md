  ---
Analyse comparative : Authentication dans les systèmes d'automatisation

1. Les deux problèmes distincts

Tout système d'automatisation doit résoudre deux problèmes d'auth distincts :

Problème: Platform Auth
Description: L'utilisateur se connecte à la plateforme elle-même
Exemple: Login sur n8n, Zapier, Massivoto
────────────────────────────────────────
Problème: Service Auth
Description: La plateforme accède à des services externes pour exécuter des commandes
Exemple: Gmail, GitHub API, OpenAI

Tous les systèmes analysés séparent strictement ces deux couches. C'est le pattern universel.

  ---
2. Comparaison industrie

Dimension: Architecture
n8n: SaaS/self-hosted
Windmill: SaaS/self-hosted
Activepieces: SaaS/self-hosted
OpenClaw: Local-first (daemon)
Massivoto: DSL runtime
────────────────────────────────────────
Dimension: Platform auth
n8n: JWT cookie, LDAP/SAML/OIDC
Windmill: JWT, OAuth SSO, SAML+SCIM
Activepieces: JWT, API keys
OpenClaw: Pas de login (single-user, token gateway)
Massivoto: user_id trusted string (pas de JWT)
────────────────────────────────────────
Dimension: Credential entity
n8n: Credential (blob chiffré, ref par ID)
Windmill: Resource (JSON typé) + Variable (KV secret)
Activepieces: Connection (par projet)
OpenClaw: AuthProfile (3 types: api_key, token, oauth)
Massivoto: IntegrationToken (via auth-backend)
────────────────────────────────────────
Dimension: Chiffrement au repos
n8n: AES-256-CBC, 1 clé/instance
Windmill: Symétrique, 1 clé/workspace, BYOK
Activepieces: AES-256, 1 clé/projet
OpenClaw: Aucun (permissions fichier 0o600)
Massivoto: Aucun (plaintext en PostgreSQL)
────────────────────────────────────────
Dimension: OAuth flow
n8n: Redirect URI sur l'instance
Windmill: Redirect URI sur l'instance
Activepieces: Redirect URI sur l'instance
OpenClaw: PKCE local + device flow (GitHub)
Massivoto: PKCE via auth-backend
────────────────────────────────────────
Dimension: Token refresh
n8n: Auto par worker
Windmill: Auto par resource layer
Activepieces: Auto, invisible pour les pieces
OpenClaw: Auto avec file lock + rotation round-robin
Massivoto: Non implémenté
────────────────────────────────────────
Dimension: Injection au runtime
n8n: Worker decrypte du DB, en mémoire
Windmill: $var:path substitué par worker
Activepieces: auth param injecté par step, puis révoqué
OpenClaw: Just-in-time via resolveApiKeyForProvider
Massivoto: Non implémenté (context.env toujours vide)
────────────────────────────────────────
Dimension: Vault externe
n8n: AWS SM, HashiCorp Vault
Windmill: Non
Activepieces: Non
OpenClaw: Non (keychain macOS pour certains)
Massivoto: Non

  ---
3. OpenClaw en détail

OpenClaw a une approche radicalement différente car c'est un assistant AI local, pas un SaaS :

Modèle de credentials :
- 3 types : api_key, token (bearer), oauth (access+refresh+expiry)
- Stockés en JSON plat dans ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
- Protégé par permissions fichier 0o600 uniquement, pas de chiffrement
- Sync automatique depuis les CLIs externes (Claude Code, Codex, Qwen, MiniMax)

Innovation intéressante - Rotation round-robin avec backoff :
- Plusieurs profils par provider (ex: 3 clés OpenAI)
- Rotation automatique (oauth > token > api_key, puis round-robin par lastUsed)
- Backoff exponentiel sur échec : 1min → 5min → 25min → 1h
- Cooldown spécial billing : 5h → 24h

OAuth flows implémentés :
- GitHub Copilot : Device Flow (RFC 8628)
- Chutes : Authorization Code + PKCE complet
- Qwen : Refresh-only (tokens seedés par CLI externe)
- Anthropic : "setup-token" (pas de vrai OAuth)

Pas de bibliothèque auth tierce - tout est hand-rolled avec crypto natif.

  ---
4. Massivoto - Etat actuel

┌───────────────────────────────────┬─────────────────────────────┐
│             Composant             │           Statut            │
├───────────────────────────────────┼─────────────────────────────┤
│ OAuth PKCE flow (auth-backend)    │ Fait                        │
├───────────────────────────────────┼─────────────────────────────┤
│ Token storage PostgreSQL          │ Fait (plaintext)            │
├───────────────────────────────────┼─────────────────────────────┤
│ Provider drivers (GitHub, Google) │ Fait                        │
├───────────────────────────────────┼─────────────────────────────┤
│ Frontend OAuth UI                 │ Fait                        │
├───────────────────────────────────┼─────────────────────────────┤
│ ExecutionContext.env field        │ Fait (mais toujours vide)   │
├───────────────────────────────────┼─────────────────────────────┤
│ ProviderRegistry (runtime)        │ Non implémenté              │
├───────────────────────────────────┼─────────────────────────────┤
│ CredentialVault interface         │ Non implémenté              │
├───────────────────────────────────┼─────────────────────────────┤
│ Injection secrets dans env        │ Non implémenté              │
├───────────────────────────────────┼─────────────────────────────┤
│ Token refresh                     │ Non implémenté              │
├───────────────────────────────────┼─────────────────────────────┤
│ Chiffrement tokens at rest        │ Non implémenté (prévu v1.0) │
└───────────────────────────────────┴─────────────────────────────┘

Le gap critique : le auth-backend sait stocker des tokens OAuth, mais le runtime ne sait pas les récupérer
pour les injecter dans ExecutionContext.env avant l'exécution d'une commande.

  ---
5. Patterns réutilisables de l'industrie

Pattern: Credential ID reference (workflow ne contient jamais le secret)
Source: n8n, Activepieces
Applicable à Massivoto ?: Oui - les .oto référencent un provider, pas un token
────────────────────────────────────────
Pattern: Per-workspace encryption key
Source: Windmill
Applicable à Massivoto ?: Oui pour v1.0 multi-tenant
────────────────────────────────────────
Pattern: Runtime variable substitution ($var:path résolu lazy par le worker)
Source: Windmill
Applicable à Massivoto ?: Oui - mapper sur env.X dans l'évaluateur OTO
────────────────────────────────────────
Pattern: Transient injection + revocation
Source: Activepieces
Applicable à Massivoto ?: Oui - injecter dans env, clear après handler.run()
────────────────────────────────────────
Pattern: OIDC short-lived tokens (pas de secrets stockés pour cloud providers)
Source: Windmill
Applicable à Massivoto ?: Plus tard (v1.0+)
────────────────────────────────────────
Pattern: Auth profile rotation avec backoff
Source: OpenClaw
Applicable à Massivoto ?: Intéressant pour le retry de commandes AI
────────────────────────────────────────
Pattern: External CLI sync
Source: OpenClaw
Applicable à Massivoto ?: Non pertinent (Massivoto est un runtime, pas un assistant)

  ---
6. Recommandation pour Massivoto

Le pont manquant entre auth-backend et runtime pourrait suivre ce flow :

OTO Program                    Runtime                         Auth-Backend
─────────────                  ───────                         ────────────
@email/send to="..."     →  interpreter détecte
provider="google-gmail"     →  GET /api/integrations/google-gmail
?user_id=context.user.id
← IntegrationToken              ← { accessToken, expiresAt }

                                if expired? → refresh           POST /oauth/google-gmail/refresh

                                context.env["google-gmail.
                                access_token"] = token

                                handler.run(args, context)  →  Uses env token to call Gmail API

                                clear env after execution

Les patterns les plus pertinents à emprunter :
1. Windmill pour le $var: lazy substitution (s'adapte bien au modèle env.X de OTO)
2. Activepieces pour l'injection transiente (injecter → exécuter → nettoyer)
3. n8n pour le credential ID separation (les .oto ne contiennent jamais de secrets)
4. OpenClaw pour la rotation/backoff (utile pour les commandes @ai/ avec rate limits)

  ---
Task: Comparer l'auth de Massivoto, OpenClaw et l'industrie (n8n, Windmill, Activepieces, Zapier, Temporal)

Result: Analyse complète des 6 systèmes. Le gap critique de Massivoto est le pont CredentialVault entre
auth-backend et runtime. Les meilleurs patterns à emprunter viennent de Windmill (lazy injection),
Activepieces (transient credentials), et OpenClaw (rotation/backoff).

Next steps:
- Concevoir l'interface CredentialVault avec /concept en s'inspirant de Windmill+Activepieces
- Implémenter le token refresh dans auth-backend
- Ajouter le chiffrement at-rest des tokens (AES-256, 1 clé/workspace) pour v1.0