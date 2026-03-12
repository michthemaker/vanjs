# create-van-app <a href="https://npmjs.com/package/create-van-app"><img src="https://img.shields.io/npm/v/create-van-app" alt="npm package"></a>

## Scaffolding Your First Van Project

> **Compatibility Note:**
> Create Van App requires [Node.js](https://nodejs.org/en/) version 20.19+, 22.12+. However, some templates require a higher Node.js version to work, please upgrade if your package manager warns about it.

With NPM:

```bash
npm create van-app@latest
```

With Yarn:

```bash
yarn create van-app
```

With PNPM:

```bash
pnpm create van-app
```

With Bun:

```bash
bun create van-app
```

With Deno:

```bash
deno init --npm van-app
```

Then follow the prompts!

You can also directly specify the project name and the template you want to use via additional command line options. For example, to scaffold a VanJS + Tailwind project, run:

```bash
# npm 7+, extra double-dash is needed:
npm create van-app@latest my-van-app -- --template vanjs-ts-tailwind

# yarn
yarn create van-app my-van-app --template vanjs-ts-tailwind

# pnpm
pnpm create van-app my-van-app --template vanjs-ts-tailwind

# Bun
bun create van-app my-van-app --template vanjs-ts-tailwind

# Deno
deno init --npm van-app my-van-app --template vanjs-ts-tailwind
```

Currently supported template presets include:

- `vanjs-ts` + `tailwind` ← default
- `vanjs-ts` + `css`
- `vanjs` + `tailwind`
- `vanjs` + `css`

You can use `.` for the project name to scaffold in the current directory.
