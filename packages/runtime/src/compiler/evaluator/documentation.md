# @massivoto/runtime evaluator

Massivoto Evaluator is the **safe expression runtime** used by the Massivoto platform.  
It resolves **paths**, executes **pipe chains**, and evaluates **boolean guards** for `if` / `while`.

This package is intentionally **not a general-purpose language**:

- **No arbitrary function calls**
- **No JS eval**
- Only **whitelisted pipes/ops** and **predictable path resolution**

---

## Scope

### Supported expression families

1) **Value Expressions (Path + Pipes)**  
   Used for command arguments and data shaping.

Examples:

- `{users:orderBy:'followers':tail:10}`
- `{tweets->id}`
- `{data.profile.email}`
- `{store.cache:keys}`

2) **Boolean Guard Expressions (tiny grammar)**  
   Used only in `if` / `while`:

- literals, paths
- `== != < <= > >=`
- `&& || !`
- parentheses

Examples:

- `{i < 2 && foundUser}`
- `{!isDryRun}`
- `{attempts >= 3}`

## Terminology

* **Path**: `users`, `data.users`, `user.id`, `store.session.token`
* **Pipe**: `tail`, `first`, `orderBy`, `keys`
* **Pipe chain**: `{users:orderBy:'followers'}
