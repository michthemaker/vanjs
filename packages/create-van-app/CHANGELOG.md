# create-van-app

## 0.2.1

### Patch Changes

- dfbe3a0: Added correct dependencies for inclusion in registry downloads

## 0.2.0

### Minor Changes

- fc2d487: Bumped vite-plugin-vanjs version in templates for scaffolder

## 0.1.0

### Minor Changes

- 60f27ba: Project scaffolder for VanJS apps with support for JavaScript, TypeScript, and Tailwind CSS.

  ## Features

  - Interactive CLI — prompts for project name, framework variant, and styling approach
  - Non-interactive mode — fully scriptable via flags for CI and AI agent environments
  - Detects AI agent environments and suggests one-shot usage automatically
  - Auto-detects package manager (npm, pnpm, yarn, bun, deno) from the environment
  - Optional immediate install and dev server start with `--immediate`
  - Handles existing directories — offers to overwrite, ignore, or cancel

  ## Templates

  | Template      | Language   | Styling         |
  | ------------- | ---------- | --------------- |
  | `ts-tailwind` | TypeScript | Tailwind CSS v3 |
  | `ts-css`      | TypeScript | Plain CSS       |
  | `js-tailwind` | JavaScript | Tailwind CSS v3 |
  | `js-css`      | JavaScript | Plain CSS       |

  ## TypeScript + Tailwind template includes

  - `@michthemaker/vanjs` + `@michthemaker/vite-plugin-vanjs` with HMR
  - Tailwind CSS v3 with PostCSS and Autoprefixer
  - `clsx` + `tailwind-merge` via a `cn()` utility
  - `darkMode: "media"` — dark mode via `prefers-color-scheme`
  - `experimental.classRegex` configured for Tailwind IntelliSense in plain `.ts` files (works in VS Code and Zed)
  - `@src` path alias preconfigured in Vite and TypeScript
  - Starter `App.ts` with a working counter example

  ## Usage

  ```bash
  # npm
  npm create van-app@latest

  # pnpm
  pnpm create van-app

  # yarn
  yarn create van-app

  # bun
  bun create van-app

  # non-interactive
  pnpm create van-app my-app --template ts-tailwind --no-interactive
  ```

### Patch Changes

- 28b734b: Added necessary files to `files` field in package `package.json`
