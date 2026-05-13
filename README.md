# SKU Origin Appender

A simple web tool that appends country-of-origin text to Amazon 50 mm × 30 mm FNSKU PDF labels. All processing happens in the browser — no file ever leaves your machine.

## Features

- Drag-and-drop or click to select one or many PDFs at once
- Adds `Made In China` centered along the bottom edge of every page
- Real-time progress bar while batches are processed
- Fully client-side — files never reach a server
- Deploys as a single Cloudflare Worker (static assets only)

## Tech stack

- [SvelteKit 2](https://svelte.dev/docs/kit) + [Svelte 5](https://svelte.dev/) (runes)
- [Tailwind CSS v4](https://tailwindcss.com)
- [shadcn-svelte](https://shadcn-svelte.com/) (Bits UI primitives)
- [`@lucide/svelte`](https://lucide.dev/) for icons
- [`pdf-lib`](https://pdf-lib.js.org/) for in-browser PDF mutation
- [Bun](https://bun.sh/) as the runtime / package manager
- [Cloudflare Workers](https://workers.cloudflare.com/) with Static Assets binding for hosting
- [Vitest](https://vitest.dev/) for unit tests

## Getting started

```sh
bun install
bun run dev
```

Open <http://localhost:5173>.

## Scripts

| Command          | Purpose                                                        |
| ---------------- | -------------------------------------------------------------- |
| `bun run dev`    | Start the Vite dev server                                      |
| `bun run check`  | Regenerate Cloudflare types and run `svelte-check`             |
| `bun run test`   | Run the Vitest suite once                                      |
| `bun run lint`   | Prettier + ESLint                                              |
| `bun run format` | Prettier write                                                 |
| `bun run build`  | Build the worker bundle into `.svelte-kit/cloudflare/`         |
| `bun run preview` | Serve the built worker locally via `wrangler dev`             |
| `bun run deploy` | Build and `wrangler deploy` to Cloudflare                      |

## Deployment

The project ships with `@sveltejs/adapter-cloudflare` and a ready-to-use `wrangler.jsonc`. To deploy:

```sh
bunx wrangler login   # one-time
bun run deploy
```

This uploads a Worker that serves the prerendered SvelteKit app via the `ASSETS` static-assets binding. No KV/D1/R2 bindings are required.

## Privacy

PDF processing runs entirely in your browser via WebAssembly-free JS (`pdf-lib`). No file bytes are sent to the Worker or any other origin.

## License

[MIT](./LICENSE)

## Contributing

Issues and pull requests welcome. Please run `bun run check`, `bun run lint`, and `bun run test` before opening a PR.
