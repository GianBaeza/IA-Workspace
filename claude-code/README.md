# Claude Code environment

Equivalente, para [Claude Code](https://code.claude.com), del ecosistema OpenCode que
vive en la raíz de este repo. Vive en su propia carpeta a propósito: **no reemplaza ni
toca** `agents/`, `skills/`, `plugins/`, `opencode.json`, etc. — ese config sigue siendo
el de OpenCode. Esto es un segundo entorno, para el mismo repo, para el otro CLI.

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
└── skills/                       # 9 skills, una por tecnología
    ├── nextjs/ react/ tailwind/   # frontend
    ├── express/ nodejs-backend/    # backend
    ├── typescript/ zod/ vitest-playwright/   # compartidas
    └── docker-cicd/                 # infra
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
