# Contributing to VanJS

Thanks for taking the time to contribute. VanJS is a small, focused project and every contribution matters.

## Code of Conduct

Be respectful. Constructive criticism is welcome, personal attacks are not. We're all here to build something good.

---

## Ways to Contribute

- **Bug reports** — found something broken? Open an issue with a minimal reproduction
- **Bug fixes** — check the [good first issues](https://github.com/michthemaker/vanjs/labels/good%20first%20issue) label to get started
- **Documentation** — typos, unclear explanations, missing examples — all fair game
- **Feature proposals** — open an issue first before writing code, so we can discuss the direction

---

## Repository Structure

This is a **pnpm monorepo**. The codebase is split into packages and apps:

```
vanjs/
├── apps/
│   └── examples/         # example app for testing & development
│
└── packages/
    ├── vanjs/            # core framework
    │   └── src/
    │       ├── van.ts             # type definitions & interfaces
    │       ├── index.ts           # core implementation
    │       ├── reactive-lists.ts  # list binding logic
    │       └── event-handlers.ts  # event handler types
    │
    ├── vite-plugin-vanjs/  # vite HMR plugin
    │    └── src/
    │        ├── index.ts    # plugin entry point
    │        └── plugin.ts   # HMR transformation logic
    └── create-van-app/  # project scaffolding cli tool
        └── src/
            ├── index.ts    # binary entry point
```

If you're fixing a core reactivity bug → `packages/vanjs/src/index.ts`

If you're fixing an HMR or transform bug → `packages/vite-plugin-vanjs/src/plugin.ts`

If you're fixing a Project Scaffolding bug → `packages/create-van-app/src/index.ts`

If you're adding an example → `apps/examples/<example-name>/`

---

## Development Setup

This repo uses **pnpm workspaces**. Make sure you have [pnpm](https://pnpm.io) installed before anything else.

```bash
# Install pnpm if you don't have it
npm install -g pnpm

# Clone the repo
git clone https://github.com/michthemaker/vanjs.git
cd vanjs

# Install all workspace dependencies in one shot
pnpm install
```

### Working on the core framework

```bash
cd packages/vanjs

# Build the package
pnpm build

# Run in watch mode while developing
pnpm dev
```

### Working on the Vite plugin

```bash
cd packages/vite-plugin-vanjs

pnpm build
pnpm dev
```

### Working on the Project Scaffolding

```bash
cd packages/create-van-app
```

### Running the example app

The example app is the best way to test changes end-to-end — it uses both `packages/vanjs` and `packages/vite-plugin-vanjs` locally via workspace linking.

```bash
cd apps/examples

pnpm dev
```

Any changes you make to `packages/vanjs` or `packages/vite-plugin-vanjs` will reflect immediately in the example app since pnpm workspace links them directly.

---

## Pull Request Guidelines

1. **Open an issue first** for non-trivial changes — saves everyone time
2. **Keep PRs focused** — one fix or feature per PR, not a bundle of unrelated changes
3. **Write clear commit messages** — describe what changed and why, not just what
4. **Don't break the example app** — run it and verify your changes work end-to-end

### Commit message format

```
type(scope): short description

Optional longer explanation if needed.
```

Scope should be the package name: `vanjs` or `vite-plugin-vanjs` or `create-van-app`

Types: `fix`, `feat`, `docs`, `refactor`, `test`, `chore`

Examples:

```
fix(vanjs): handle empty array in reactive list binding
feat(vanjs): add rawVal to state for non-tracking reads
fix(vite-plugin-vanjs): support async arrow function components
docs(vanjs): clarify van.derive vs useEffect comparison
feat(create-van-app): add vanjs-tailwind template
```

---

## Reporting Bugs

A good bug report includes:

- A **minimal reproduction** — the smallest possible code that shows the problem
- What you **expected** to happen
- What **actually** happened
- Which package is affected — `vanjs` or `vite-plugin-vanjs` or `create-van-app`
- Your environment — browser, Node version, pnpm version

---

## License

By contributing to VanJS, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
