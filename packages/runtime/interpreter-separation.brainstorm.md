# Product Brainstorm: Interpreter Separation

**Date:** 2026-01-28
**Participants:** Product session with Claude

---

## 1. Product Role

**Ce que c'est:**
- Extraction du répertoire `interpreter/` (sauf `parser/`) vers un nouveau repo `@massivoto/interpreter` sous licence BSL 1.1
- Le package `@massivoto/runtime` reste Apache 2.0 avec parser, AST, domain types, interfaces
- Séparation nette dès le départ dans un repo Git séparé

**Ce que ce n'est PAS:**
- Pas un fork — c'est une séparation architecturale propre
- Pas de rétrocompatibilité à maintenir — on peut tout casser, il n'y a pas d'utilisateurs externes
- Pas un package dans le monorepo — repo Git séparé à `C:\code\nik\massivoto`

**Décision:** Repo séparé dès le départ plutôt que package dans le monorepo.

**Rationale:** On a discuté l'option de garder le BSL dans le même monorepo pour simplifier le dev (un seul `yarn install`, tests intégrés). Mais la séparation en repo distinct donne une clarté légale plus nette et évite le risque de mélanger les imports. Vu qu'il n'y a pas d'utilisateurs externes et qu'on peut tout casser, autant faire propre dès le départ.

---

## 2. Target Audience

**Audience primaire:** Développement interne (Massivoto SaaS)

**Ce que ça implique:**
- Pas de documentation externe requise pour l'instant
- API instable acceptée — on peut changer sans warning
- On peut hardcoder des trucs qu'on refactorera plus tard
- Optimisation pour la vélocité de développement, pas pour l'adoption externe

**Décision:** On optimise pour le dev interne, pas pour l'adoption externe.

**Rationale:** L'audience primaire du package BSL c'est nous-même (le SaaS). Les entreprises qui self-host sont une audience secondaire qui viendra avec v1.0. Pour v0.5, on veut juste que ça marche. Pas besoin de polish.

---

## 3. Core Problem

**Problème:** Le code stratégique (interpreter, evaluator, handlers, pipes) est actuellement mélangé avec le code commodity (parser, AST, types) sous la même licence Apache 2.0.

**Conséquences si on ne fait rien:**
- Un concurrent peut forker le runtime complet et faire "Massivoto-as-a-Service"
- Pas de protection légale du "secret sauce"
- Confusion sur ce qui est vraiment open source vs protégé

**Ce que la séparation résout:**
- Protection légale claire: BSL bloque la commoditisation
- Boundary technique: imports explicites, dépendances claires
- Contribution simplifiée: Apache 2.0 sans CLA, BSL avec CLA (plus tard)

**Décision:** Extraire tout `/interpreter` (sauf `/parser`) vers un repo BSL séparé.

**Rationale:** La granularité a été discutée. Le répertoire `interpreter/` a déjà été designé pour être self-contained. Le `parser/` reste dans runtime car c'est du code commodity — n'importe qui peut parser du OTO, c'est l'exécution qui a de la valeur.

---

## 4. Unique Value Proposition

**Pourquoi cette architecture vs alternatives?**

| Alternative | Problème |
|-------------|----------|
| Tout Apache 2.0 | Pas de protection contre commoditisation |
| Tout BSL | Le parser/AST est commodity, freine l'adoption inutilement |
| Tout propriétaire | Pas de communauté, pas de confiance |
| Licence custom | Complexité légale, pas de précédent |

**Value prop de la séparation:**
- Parser/AST open source = tooling community possible (linters, IDE, formatters)
- Interpreter BSL = protection du business model
- Pattern prouvé (Grafana, CockroachDB, HashiCorp)

**Décision:** Split parser/interpreter avec licences différentes.

**Rationale:** C'est exactement la frontière produit naturelle. Le parser dit "quoi" (syntax), l'interpreter dit "comment" (execution). Le "comment" c'est la valeur stratégique. Garder le parser open source encourage l'écosystème sans risquer le business.

---

## 5. Acquisition Strategy

**N/A** — C'est un refactoring interne, pas un produit à acquérir des users.

---

## 6. Functional Scope

### In Scope

| Élément | Description |
|---------|-------------|
| Nouveau repo | `C:\code\nik\massivoto\massivoto-interpreter` |
| Package npm | `@massivoto/interpreter` |
| Move code | Tout `interpreter/` sauf `parser/` |
| Interfaces dans runtime | `Interpreter`, `Evaluator`, `CommandRegistry`, `PipeRegistry` |
| Pattern d'injection | `createRunner(interpreter: Interpreter): Runner` |
| Licence | BSL 1.1 avec LICENSE file |

### Out of Scope

| Élément | Pourquoi |
|---------|----------|
| Parser | Reste dans runtime, c'est commodity (Apache 2.0) |
| CI/CD pour le nouveau repo | Plus tard, pas bloquant |
| Documentation externe | Pas d'audience externe pour l'instant |
| CLA bot | Pas de contributeurs externes pour l'instant |
| Publication npm publique | Attendre que ça marche d'abord |

**Décision:** Le `parser/` reste à `packages/runtime/src/interpreter/parser/` — on ne le remonte pas.

**Rationale:** Moins de changements = moins de risques. Le parser fonctionne là où il est, pas besoin de le bouger.

---

## 7. Core Features

### Feature: Interface Extraction

**Capability:** Créer les interfaces dans runtime (Apache 2.0) pour que le code BSL les implémente.

**Interfaces à créer:**
- `Interpreter` — exécute des instructions
- `Evaluator` — évalue des expressions
- `CommandRegistry` — résout les commandes
- `PipeRegistry` — résout les pipes

**Acceptance Criteria:**
- Given le package runtime compilé, When j'importe `Interpreter`, Then l'interface est disponible sans dépendance BSL
- Given une classe `class MyInterpreter implements Interpreter`, When je compile, Then ça passe sans erreur
- Given le package runtime, When je check ses dependencies, Then `@massivoto/interpreter` n'apparaît PAS

**Test Approach:** Compilation TypeScript — si ça compile, c'est bon

---

### Feature: Interpreter Package Creation

**Capability:** Créer le package `@massivoto/interpreter` avec tout le code d'exécution.

**Implementations à créer:**
- `CoreInterpreter implements Interpreter`
- `ExpressionEvaluator implements Evaluator`
- `CoreCommandRegistry implements CommandRegistry`
- `CorePipeRegistry implements PipeRegistry`

**Acceptance Criteria:**
- Given le nouveau repo, When je run `yarn build`, Then ça compile sans erreur
- Given le repo, When je check LICENSE, Then c'est BSL 1.1
- Given le package.json, When je check dependencies, Then `@massivoto/runtime` est listé en peer dependency

**Test Approach:** `yarn build` + vérification manuelle du LICENSE

---

### Feature: Factory Injection

**Capability:** Le runtime peut utiliser l'interpreter via injection (pas de hard import).

**API:** `createRunner(interpreter: Interpreter): Runner`

**Acceptance Criteria:**
- Given runtime + interpreter installés, When j'appelle `createRunner(new CoreInterpreter())`, Then l'exécution fonctionne
- Given un programme OTO valide, When je l'exécute avec l'interpreter injecté, Then le résultat est correct
- Given les tests existants, When je les run après refactoring, Then ils passent tous

**Test Approach:** Tests d'intégration existants doivent passer après refactoring

---

### Feature: NPM Publish

**Capability:** Publier `@massivoto/interpreter` sur npm pour que le monorepo platform puisse le consommer.

**Acceptance Criteria:**
- Given le package buildé, When je run `npm publish`, Then le package est disponible sur npmjs.com
- Given le monorepo platform, When je run `yarn add @massivoto/interpreter`, Then ça s'installe correctement

**Test Approach:** `npm pack` d'abord pour tester, puis `npm publish`

---

## 8. Differentiating Features

**N/A** — C'est un refactoring technique interne, pas un produit avec différenciation marché.

---

## 9. Version Assignment

**Décision:** Pas de POC/MVP — une seule version V1. Ça marche ou ça marche pas.

| Feature | Version | Rationale |
|---------|---------|-----------|
| Interface Extraction | V1 | Requis pour que ça compile |
| Interpreter Package Creation | V1 | C'est le coeur du travail |
| Factory Injection | V1 | Requis pour que runtime utilise interpreter |
| NPM Publish | V1 | Requis pour que platform consomme interpreter |
| Supprimer dépendances vers kit | V2 | Cleanup, pas bloquant |

**Rationale:** C'est un refactoring atomique. Soit tout marche end-to-end (tests passent, build passe, on peut exécuter un programme), soit c'est pas fini. Pas de sens de livrer un "POC" qui compile mais n'exécute pas.

**V2 scope:** Supprimer les dépendances vers `@massivoto/kit` pour que interpreter soit 100% self-contained (sauf runtime pour les interfaces). C'est du cleanup, acceptable de le faire après.

---

## 10. Critical Edge Cases

| Edge Case | Risque | Mitigation |
|-----------|--------|------------|
| **interpreter pas self-contained** | Blocker | Vérifier AVANT de commencer que `interpreter/` n'importe rien hors de lui-même (sauf `parser/`) |
| Import circulaire | runtime → interpreter → runtime | Impossible si le pré-requis est respecté. Interfaces dans runtime, impls dans interpreter |
| Types manquants | Un type utilisé par interpreter n'est pas exporté | Exporter tous les types domain depuis runtime |
| Tests cassés | Tests d'interpreter importent des helpers de runtime | Copier ou exporter les helpers nécessaires |
| Build order | interpreter doit build après runtime | npm dependency gère ça automatiquement |

**Pré-requis critique:** Le répertoire `interpreter/` doit être self-contained. S'il importe des choses en dehors de lui-même (sauf `parser/`), c'est un blocker à résoudre AVANT de commencer la séparation.

**Décision:** Vérifier les imports comme première étape. Approche pragmatique: exclure le répertoire de tsconfig et voir ce qui casse à la compilation.

---

## 11. Non-Functional Constraints

| Contrainte | Valeur | Rationale |
|------------|--------|-----------|
| Licence | BSL 1.1 | Décidé dans license.prd.md |
| Compilation | TypeScript strict | Cohérent avec le monorepo |
| Target | ESM | Cohérent avec le monorepo |
| Node version | >=18 | Cohérent avec le monorepo |
| Registry npm | npmjs.com public | `@massivoto/interpreter` |

Pas de contraintes spéciales — on reprend les mêmes que le monorepo actuel, plus la licence BSL.

---

## 12. External Dependencies

| Dépendance | Type | V1 | V2 |
|------------|------|----|----|
| `@massivoto/runtime` | peer dependency | Requis (pour les interfaces) | Requis |
| `@massivoto/kit` | À vérifier | Acceptable si utilisé | Supprimer |
| npm registry | Infrastructure | Requis pour publish | Requis |

**Décision:** Si `interpreter/` utilise `@massivoto/kit`, c'est acceptable en V1. On listera les dépendances et on les supprimera en V2.

**Rationale:** Le but de V1 c'est que ça marche. Le cleanup des dépendances c'est du nice-to-have. Mieux vaut livrer quelque chose qui fonctionne avec une dépendance de trop que de bloquer sur du perfectionnisme.

---

## 13. Major Risks

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| interpreter pas self-contained | Blocker — refactoring requis avant | Moyenne | Vérifier les imports en premier |
| Tests cassés après move | Délai — travail de fix | Haute | Accepter qu'il y aura du travail de fix |
| Oubli de fichier | Bug runtime | Faible | Compiler + tests révèlent les oublis |
| npm publish fail | Délai | Faible | Tester avec `npm pack` d'abord |

**Risque principal:** Découvrir que `interpreter/` a des dépendances cachées vers d'autres parties du monorepo. C'est pour ça qu'on vérifie les imports en premier.

---

## 14. Priority

**Top priorité, bloquante.**

- Branche `separation` déjà créée et en cours
- Doit être terminé avant les autres items du roadmap (grid applet, etc.)
- Bloque la mise en place de la structure de licences définitive

---

## Naming Decisions

### Problème: Préfixe `I` sur les interfaces

On a discuté le naming des interfaces. Le style `IInterpreter` (préfixe `I`) est une convention C#/Java ancienne qui pollue le nom. L'interface est l'élément principal que le code consommateur voit — elle mérite le nom "pur".

**Décision:** Pas de préfixe `I`. L'interface porte le nom pur, l'implémentation porte un qualificateur.

| Location | Interface | Implementation |
|----------|-----------|----------------|
| runtime (Apache 2.0) | `Interpreter` | — |
| runtime (Apache 2.0) | `Evaluator` | — |
| runtime (Apache 2.0) | `CommandRegistry` | — |
| runtime (Apache 2.0) | `PipeRegistry` | — |
| interpreter (BSL) | — | `CoreInterpreter` |
| interpreter (BSL) | — | `ExpressionEvaluator` |
| interpreter (BSL) | — | `CoreCommandRegistry` |
| interpreter (BSL) | — | `CorePipeRegistry` |

**Rationale:** Le consommateur écrit `interpreter: Interpreter` partout — c'est plus propre que `interpreter: IInterpreter`. L'implémentation `CoreInterpreter` indique clairement que c'est l'implémentation standard/officielle.

### Pattern d'injection

On a discuté comment runtime (Apache 2.0) utilise interpreter (BSL) sans en dépendre directement.

**Options considérées:**
- **Option A: Factory injection** — `createRunner(interpreter: Interpreter)` — le consommateur injecte
- **Option B: Global registration** — `Runtime.configure({ interpreter })` — state global

**Décision:** Option A — Factory injection.

```typescript
import { createRunner } from '@massivoto/runtime'
import { CoreInterpreter } from '@massivoto/interpreter'

const runner = createRunner(new CoreInterpreter())
await runner.run(program)
```

**Rationale:** Pas de state global, explicite, testable (mock interpreter facile), dépendance visible. Le global state c'est pratique mais ça complique les tests et le raisonnement. Vu qu'on optimise pour le dev interne, autant faire propre.

---

## Gaps / Open Questions

- [ ] **Vérifier self-containment:** Est-ce que `interpreter/` importe quelque chose hors de lui-même (sauf `parser/`)?
- [ ] **Lister dépendances kit:** Est-ce que `interpreter/` utilise `@massivoto/kit`? Si oui, quels modules?
- [ ] **Structure du nouveau repo:** tsconfig.json, package.json, structure de dossiers exacte
- [ ] **Credentials npm:** A-t-on accès pour publier sous `@massivoto/`?

---

## Next Steps

1. **Analyser les imports** de `interpreter/` pour vérifier le self-containment
2. **Lister les dépendances** vers `@massivoto/kit` si présentes
3. Créer le PRD détaillé avec requirements techniques
4. Implémenter
