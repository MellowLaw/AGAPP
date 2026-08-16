# AGAPP — Shared Types & Utilities

> **Workspace**: `packages/shared`  
> **Tech Stack**: TypeScript, Zod

Shared types, schema validators, constants, and utilities consumed across all AGAPP workspaces (`apps/mobile`, `apps/citizen-web`, `apps/admin`, `apps/api`).

---

## 📦 Contents

- **`src/types/`**: Common data transfer objects and database entity types (`Lgu`, `Report`, `ServiceRequest`, `VerificationRequest`, `User`).
- **`src/constants/`**: Philippine administrative divisions, standard service category mappings, and report category labels.
- **`src/utils/`**: Shared formatters, date helpers, and status badge helpers.

---

## 🛠️ Build

```bash
# From agapp-system/
npm run build:shared
```
