# CI/CD Flow

## Branches

```
main ─────────────────────────────────────────► (stable, protected)
  └── release ───────────────────────────────► (publish trigger)
```

---

## Pull Request Flow (main)

```
your feature branch <feat/whatsworkedon>
       │
       │  git push origin <feat/whatsworkedon>
       ▼
   open PR → main
       │
       ├── ✅ Typecheck (tsgo -b --noEmit)
       │
       ├── pass → PR can be merged
       └── fail → PR is blocked, fix and push again
```

> Only admins can merge PRs. No force pushing to main.

---

## Release Flow

```
main (up to date)
  │
  │  git checkout release
  │  git merge main
  │  git push origin release
  ▼
release branch
  │
  ├── pnpm install (packages/ only)
  ├── pnpm build (packages/ only)
  │
  └── changesets/action
        │
        ├── finds .changeset/*.md files?
        │     │
        │     ├── YES → opens "Version Packages" PR
        │     │            bumps versions
        │     │            generates CHANGELOG.md per package
        │     │            deletes consumed .changeset files
        │     │
        │     └── NO  → nothing to publish, workflow exits
        │
        └── "Version Packages" PR merged?
              │
              └── YES → publishes to npm
                         creates GitHub release
```

---

## Changeset Workflow (per PR)

```
finish your work
       │
       │  pnpm changeset
       ▼
CLI asks:
  ├── which packages changed?     (@michthemaker/vanjs, @michthemaker/vite-plugin-vanjs)
  ├── how significant?            (patch / minor / major)
  └── describe what changed?      (write while context is fresh)
       │
       ▼
.changeset/random-name.md created
       │
       │  git add .changeset/
       │  git commit -m "chore: add changeset"
       ▼
committed alongside your code changes in the same PR
```

---

## Bump Types

| Type    | When to use                       | Example           |
| ------- | --------------------------------- | ----------------- |
| `patch` | Bug fix, no API change            | `0.1.0` → `0.1.1` |
| `minor` | New feature, backwards compatible | `0.1.0` → `0.2.0` |
| `major` | Breaking change                   | `0.1.0` → `1.0.0` |

---

## Per-package versioning

Packages version and publish **independently** — if only `vanjs` has changesets, only `vanjs` gets a new npm version.

```
.changeset/
  ├── fuzzy-lion.md  → affects @michthemaker/vanjs (minor)
  └── odd-bikes.md   → affects @michthemaker/vite-plugin-vanjs (patch)
          │
          ▼
  @michthemaker/vanjs     0.1.0 → 0.2.0  ✅ published
  @michthemaker/vite-plugin-vanjs       0.1.0 → 0.1.1  ✅ published
```

---

## Full Picture

```
feature branch
    │
    ▼
PR → main ──── typecheck CI
    │
    ▼
merge main → release ──── build + publish CI
                               │
                               ▼
                         npm registry 📦
                         GitHub release 🚀
```
