# Installed Library Ledger

Last updated: 2026-09-15

This file tracks libraries installed through npm for the Spatiotemporal Epidemic Tracking and Early Warning System. Keep it synchronized with `package.json` whenever dependencies are added, upgraded, or removed.

## Production Dependencies

| Package | Version | Purpose | Planned usage |
|---|---:|---|---|
| `next` | `16.3.4` | Full-stack React framework | App Router pages, server components, route handlers, and server-side application logic |
| `react` | `19.2.8` | UI library | Dashboard components and client interactions |
| `react-dom` | `19.2.8` | React browser renderer | Rendering the Next.js application |
| `@supabase/supabase-js` | `^2` | Supabase JavaScript client | Server-side database access for ingestion and read APIs |
| `zod` | `^4` | Runtime schema validation | Environment, GDELT, and API payload validation |
| `recharts` | `^3.10.1` | React charting library | Responsive signal-volume and anomaly charts |
| `leaflet` | `^1.9.4` | Interactive map engine | Future geographic hotspot map layers |
| `react-leaflet` | `^5.0.0` | React bindings for Leaflet | Future coordinate-driven Mumbai map |
| `@types/leaflet` | `^1.9.22` | Leaflet type declarations | Type-safe map data integration |

## Development Dependencies

| Package | Version | Purpose | Planned usage |
|---|---:|---|---|
| `@tailwindcss/postcss` | `^4` | Tailwind CSS PostCSS integration | Build-time utility CSS processing |
| `@types/node` | `^20` | Node.js type declarations | TypeScript support for server-side Next.js code and scripts |
| `@types/react` | `^19` | React type declarations | TypeScript support for React components |
| `@types/react-dom` | `^19` | React DOM type declarations | TypeScript support for browser rendering APIs |
| `eslint` | `^9` | JavaScript and TypeScript linter | Static checks during development and CI |
| `eslint-config-next` | `16.3.4` | Next.js ESLint rules | Framework-specific linting rules |
| `tailwindcss` | `^4` | Utility-first CSS framework | Responsive dashboard styling |
| `typescript` | `^5` | TypeScript compiler | Type-safe application and API code |

## Planned npm Installations

These packages are planned but have not been installed yet. Move each package to an installed section only after it appears in `package.json` and the lockfile.

| Package | Intended purpose | Planned milestone |
|---|---|---|
| `@supabase/ssr` | Supabase server/browser session helpers | Database integration |

## Installation Rules

- Use npm for dependency changes and commit the resulting `package-lock.json`.
- Record the package, version, purpose, and installation date or milestone here.
- Prefer production dependencies only for packages imported by the deployed application.
- Keep data-science Python packages in `python/requirements.txt`, not this file.
- Run `npm run lint` and `npm run build` after dependency changes when the project is runnable.

## Audit History

| Date | Action | Result |
|---|---|---|
| 2026-09-08 | Initial Next.js scaffold | 364 packages installed; npm reported 0 vulnerabilities |
| 2026-09-15 | Backend foundation dependencies | `@supabase/supabase-js` and `zod` installed; npm reported 0 vulnerabilities |
| 2026-09-15 | Dashboard visualization dependencies | Recharts, Leaflet, React-Leaflet, and Leaflet types installed; npm reported 0 vulnerabilities |