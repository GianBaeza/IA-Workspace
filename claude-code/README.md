# Claude Code environment

> Este repo también tiene un entorno para OpenCode, en [`../opencode/`](../opencode/README.md).
> Ver [`../README.md`](../README.md) para la vista general de ambos.

Equivalente, para [Claude Code](https://code.claude.com), del ecosistema OpenCode que
vive en [`../opencode/`](../opencode/README.md). Vive en su propia carpeta a propósito:
**no reemplaza ni toca** nada de esa carpeta — es un segundo entorno, para el mismo
repo, para el otro CLI.

## Instalación

```bash
git clone git@github.com:GianBaeza/IA-Workspace.git
cp -r IA-Workspace/claude-code/agents   ~/.claude/agents
cp -r IA-Workspace/claude-code/commands ~/.claude/commands
cp -r IA-Workspace/claude-code/skills/*  ~/.claude/skills/
```

O symlink en vez de copiar, para que `git pull` en el repo se refleje sin repetir el
paso — igual que la convención de OpenCode de clonar directo en `~/.config/opencode`:

```bash
ln -s "$(pwd)/IA-Workspace/claude-code/agents"   ~/.claude/agents
ln -s "$(pwd)/IA-Workspace/claude-code/commands" ~/.claude/commands
for d in IA-Workspace/claude-code/skills/*/; do
  ln -s "$(pwd)/$d" "$HOME/.claude/skills/$(basename "$d")"
done
```

Se instaló a nivel **global** (`~/.claude/`), no por proyecto: los tres especialistas y
las skills quedan disponibles en cualquier proyecto que abras con Claude Code, igual
que los agentes registrados de OpenCode en `~/.config/opencode`.

## Qué hay acá

```
claude-code/
├── agents/                      # 3 subagentes especializados
│   ├── infra-specialist.md      # Docker, CI/CD, Nginx
│   ├── frontend-specialist.md   # Next.js 16 / React 19
│   └── backend-specialist.md    # Express.js 5
├── commands/                    # Atajos de invocación explícita
│   ├── infra.md                 # /infra <tarea>
│   ├── frontend.md               # /frontend <tarea>
│   └── backend.md                 # /backend <tarea>
└── skills/                       # 11 skills commiteadas (+ 3 de Vercel solo referenciadas, ver abajo)
    ├── nextjs/ react/ tailwind/                # frontend — propias
    ├── express/ nodejs-backend/                  # backend — propias
    ├── typescript/ zod/ vitest-playwright/         # compartidas — propias
    ├── docker-pro/                                   # infra — de terceros (Bret Fisher, MIT)
    ├── github-actions-workflow-pro/                    # infra — de terceros (Bret Fisher, MIT)
    └── gha-audit/                                        # infra — de terceros (Bret Fisher, MIT)
```

## Cómo se decide qué especialista trabaja

Claude Code **no tiene** un atajo de teclado (tipo el `Tab` de OpenCode) para alternar
entre subagentes registrados — se verificó contra la documentación oficial antes de
diseñar esto, así que no hay ningún mecanismo equivalente que emular con archivos.
Existen tres formas reales de elegir el especialista:

1. **Delegación automática** — Claude Code lee el campo `description` de cada agente
   en `agents/*.md` y decide solo a cuál delegar según la tarea. Las descripciones acá
   están escritas con las palabras clave y la frase `Use PROACTIVELY` / `MUST BE USED`
   que la documentación recomienda para que el matching sea confiable.
2. **Mención explícita** — escribir `@` en el prompt abre un autocompletado con los
   agentes disponibles (`@frontend-specialist`, `@backend-specialist`,
   `@infra-specialist`).
3. **Comando corto** — los archivos en `commands/` dan un atajo de una palabra que
   fuerza la delegación sin tipear el nombre completo del agente:
   `/frontend arreglá este layout`, `/backend agregá el endpoint de auth`,
   `/infra dockerizá esto`.

Las **skills** (`skills/*/SKILL.md`) se cargan solas cuando la tarea coincide con su
`description` — no hace falta invocarlas a mano, pero también se puede con
`/nextjs`, `/express`, etc. si querés forzar que se lean.

## Skills de terceros — el ecosistema abierto de Agent Skills

Seis skills no se escribieron a mano: se instalaron con [`npx skills`](https://skills.sh)
(`vercel-labs/skills`), la CLI abierta que instala/actualiza skills de Claude Code (y
18+ agentes más) desde cualquier repo de GitHub. Se usó en vez de escribir todo a mano
porque para reglas de performance y seguridad que cambian seguido, una fuente mantenida
activamente por quien más sabe del tema (el equipo de React/Next.js de Vercel, un
Docker Captain) envejece mejor que notas propias congeladas en una fecha.

**Tres se commitean acá** (`bretfisher/skills`, licencia MIT — sin problema para un
repo público):

| Skill | Reemplazó a |
|---|---|
| `docker-pro` | la skill `docker-cicd` escrita a mano |
| `github-actions-workflow-pro` | parte de `docker-cicd` |
| `gha-audit` | parte de `docker-cicd` |

**Tres NO se commitean acá** (`vercel-labs/agent-skills`, repo sin archivo `LICENSE` —
este repo es público, así que en vez de redistribuir contenido sin licencia clara,
quedan solo referenciadas; instalalas vos en tu propia máquina):

```bash
npx skills add vercel-labs/agent-skills \
  --skill vercel-react-best-practices vercel-composition-patterns web-design-guidelines \
  -a claude-code -g --copy -y
```

| Skill | Qué agrega |
|---|---|
| `vercel-react-best-practices` | 60+ reglas de performance React/Next.js — server-side data fetching, `after()`, caching, auth en Server Actions, rendering, bundle |
| `vercel-composition-patterns` | Arquitectura de componentes — compound components, evitar boolean-prop proliferation, refs React 19 |
| `web-design-guidelines` | Revisión de UI/UX contra Web Interface Guidelines — accesibilidad, performance, interacción |

`frontend-specialist.md` las referencia en su tabla de skills asumiendo que están
instaladas — si cloná este repo y no corriste el comando de arriba, esas tres
simplemente no van a estar disponibles hasta que lo hagas.

Se instalaron con `--copy` (no symlink), para que las tres de Bret Fisher queden como
archivos reales versionados en este repo en vez de depender de una caché local
(`~/.agents/skills/`) que no viaja con el repo. Son MIT — la licencia completa está
reproducida en [`skills/THIRD_PARTY_NOTICES.md`](skills/THIRD_PARTY_NOTICES.md), como
pide esa licencia.

Antes de instalar cualquiera, se revisó el reporte de riesgo que imprime la CLI (Gen /
Socket / Snyk) y, para la única con "Med Risk" (`github-actions-workflow-pro`, por sus
scripts que manejan tokens de `gh auth`), se leyó el código de los tres scripts
(`scan.sh`, `validate.sh`, `run-stats.py`) — no exponen tokens en logs/trazas y tratan
el texto de PRs/commits como dato no confiable, no como instrucciones. Mismo criterio
(licencia + revisión de riesgo + lectura de scripts) aplicá antes de instalar cualquier
skill de terceros nueva.

**Para agregar más:**

```bash
npx skills find <palabra-clave>                 # buscar en skills.sh
npx skills find react --owner vercel            # buscar dentro de un owner
npx skills add <owner/repo> --list              # ver qué trae un repo antes de instalar
npx skills add <owner/repo> --skill <nombre> -a claude-code -g --copy -y
```

**Para actualizar las ya instaladas:** `npx skills update -g`.

## Por qué no hay Engram / memoria persistente acá

El repo de OpenCode usa Engram (SQLite + MCP) porque OpenCode no tiene memoria propia
entre sesiones. Claude Code sí tiene memoria persistente nativa entre sesiones (no
requiere MCP, plugin, ni configuración de repo) — así que replicar Engram acá sería
una capa redundante encima de algo que el CLI ya resuelve solo. Por eso esta carpeta
no tiene un equivalente a `plugins/engram.ts` ni a `agents/BEST-PRACTICES-SYSTEM.md`.

## Versiones de referencia (última revisión: sept. 2026)

Las skills fijan la versión que documentan en su frontmatter (`metadata.version` /
`last_reviewed`) para que quede claro cuándo hay que revisarlas de nuevo:

| Tecnología | Versión al momento de escribir esto |
|---|---|
| Next.js | 16.3 (App Router, Turbopack default, `proxy.ts`, Cache Components) |
| React | 19.3 (React Compiler estable, 1.0) |
| TypeScript | 7.0 (compilador nativo en Go, "tsgo") |
| Tailwind CSS | 4.3 (config CSS-first) |
| Express.js | 5.2 (manejo de errores async sin wrapper manual) |
| Node.js | 24 LTS activo (26 es release actual, LTS desde oct. 2026) |
| Zod | v4 (validadores de string top-level, `z.email()`) |
| Vitest / Playwright | 4.0 / actual — Playwright es el default de E2E sobre Cypress |

Estas versiones envejecen. Cuando alguna quede vieja, actualizá el `SKILL.md`
correspondiente (contenido + `metadata.version`) en vez de dejar que el agente
recomiende una versión desactualizada de memoria.

## Scope deliberado

Esto cubre exactamente los tres dominios pedidos: infra, frontend (Next.js/React) y
backend (Express.js). El repo de OpenCode tiene más especialistas (Angular, Django,
DATABASE, accessibility, UX/UI, bruno, un MOCKUP-ORCHESTRATOR) y todo el ciclo SDD
(`sdd-*`) — nada de eso se migró acá. Si hace falta un cuarto especialista (por
ejemplo, base de datos), se suma con el mismo patrón: un `.md` en `agents/` con
`description` orientada a delegación automática, más las skills que le correspondan.
