# AI Workspace — Entorno de OpenCode

Un ecosistema OpenCode completamente versionado: agentes, skills, plugins, comandos y
memoria persistente, todo definido como texto plano para que el entorno completo sea
reproducible en cualquier máquina clonando este repo a `~/.config/opencode/`.

Este repositorio **es** el directorio de configuración. No hay paso de build — los
archivos que están acá son lo que OpenCode carga al iniciar.

---

## Qué es esto

Un stack de asistente de programación con IA construido sobre
[OpenCode](https://opencode.ai), diseñado alrededor de tres ideas:

1. **Especialistas antes que generalistas** — expertos por dominio (frontend, backend,
   base de datos, infra) que son dueños de las reglas de calidad de su stack.
2. **Un router, no un dios** — un ORCHESTRATOR que clasifica el trabajo y delega, y que
   se usa únicamente cuando aporta valor.
3. **Memoria persistente** — cada sesión, decisión y bug resuelto se guarda en Engram
   (SQLite + MCP), para que el contexto sobreviva reinicios, compactaciones y máquinas.

## Estructura del repositorio

```
~/.config/opencode/
├── opencode.json            # Config central: modelo, servidores MCP, agentes registrados
├── AGENTS.md                # Contrato de comportamiento global + protocolo de memoria Engram
├── agents/                  # 16 definiciones de agentes (dos formatos, ver abajo)
├── skills/                  # 69 directorios de skills (74 archivos SKILL.md)
├── plugins/                 # 6 plugins: memoria, skill registry, SDD, estado TUI
├── commands/                # 12 comandos slash (ciclo de vida SDD, tooling de skills)
├── profiles/                # Perfiles de OpenCode (actualmente vacío)
├── tui.json                 # Carga de plugins de la TUI
├── tui-plugins/             # Componentes locales de la TUI (gentle-logo.tsx)
├── docs/                    # Guías (por ejemplo, guía de uso del gateway OmniRoute)
├── package.json             # Dependencias npm de los plugins (trackeado a propósito)
├── package-lock.json        # Lockfile (trackeado a propósito)
└── .atl/                    # Caché del skill registry de gentle-ai
```

## Componentes

### Config central — `opencode.json`

- Modelo por defecto: `anthropic/claude-sonnet-4-6`
- `experimental.enableAgents` — activa el sistema de agentes
- Dos servidores MCP:
  - **engram** — memoria persistente respaldada por un binario Go local + SQLite
  - **context7** — documentación actualizada de librerías/frameworks
- Cinco agentes registrados, cada uno apuntando a un archivo de instrucciones con una
  **ruta absoluta** (`~/.config/opencode/agents/*.md`) — por eso clonar en la misma
  ruta exacta hace que todo funcione en una máquina nueva.

### Agentes — dos formatos, un mismo sistema

| Formato | Cómo se carga | Ejemplos |
|---|---|---|
| **Agentes registrados** | Markdown plano, cableados en `opencode.json` | Siempre disponibles en la lista de agentes: ORCHESTRATOR, FRONTEND, BACKEND, DATABASE, INFRA |
| **Especialistas (subagentes)** | Frontmatter (`name`, `description`, `license`) | Bajo demanda, vía la herramienta `Task` (`subagent_type`): react-specialist, nextjs-specialist, express-specialist, django-specialist, angular-specialist, accessibility-specialist, ux-ui-specialist, bruno-specialist, frontend-specialist, backend-specialist |

También está `BEST-PRACTICES-SYSTEM.md` — no es un agente ejecutable, sino el documento
de *protocolo* que define cómo los agentes especialistas guardan y recuperan buenas
prácticas por tecnología en Engram (topic keys como `react/best-practices`,
`angular/best-practices`).

### Skills — 69 directorios, 74 archivos SKILL.md

Cada skill tiene frontmatter (`name`, `description`, palabras de disparo) más un cuerpo
de instrucciones. OpenCode inyecta la `description` de cada skill disponible en el
system prompt; un agente carga el `SKILL.md` completo solo cuando la tarea coincide.
Las skills están agrupadas por dominio — planas (por ejemplo `react-19/`, `vitest/`) y
anidadas (`frontend/react-best-practices/`, `database/prisma-cli/`,
`infra/cicd-patterns/`, `angular/architecture/`).

### Plugins — 6

| Plugin | Rol |
|---|---|
| `engram.ts` | Adaptador de memoria: seguimiento de sesiones, captura de prompts, inyección del protocolo de memoria en el system prompt, persistencia en compactación, recordatorios de guardado |
| `skill-registry.ts` | Refresca el skill registry de gentle-ai al iniciar |
| `model-variants.ts` | Cachea las variantes de esfuerzo por modelo para gentle-ai |
| `herdr-agent-state.js` | Reporte de estado de agentes para herdr — **gestionado por máquina, no editar** |
| `opencode-review-transport.ts` | Relay de transporte entre los agentes de review de gentle-ai |
| `sdd-task-result-artifacts.ts` | Valida los envelopes `<task_result>` de las fases SDD |

### Comandos — 12

El ciclo de vida de SDD (`sdd-new`, `sdd-explore`, `sdd-propose`, `sdd-status`,
`sdd-verify`, `…`) más tooling de skills (`skill-creator`, `skill-registry`). Estos
hacen del desarrollo guiado por specs (propuesta de feature → spec → tareas → apply →
verify → archive) un flujo de trabajo repetible.

### Memoria — Engram

Engram es el cerebro persistente: cada sesión, prompt, llamada a herramienta, bug
resuelto y decisión queda registrado. El protocolo (en `AGENTS.md` e inyectado por
`plugins/engram.ts`) hace que el guardado sea **obligatorio y proactivo**: las
decisiones, correcciones y descubrimientos se escriben en memoria sin que se los pidan.

---

## Por qué existe un ORCHESTRATOR pero no siempre se usa

El ORCHESTRATOR es el **router** del sistema: lee el pedido, detecta el/los dominio(s),
delega en el especialista correcto, pasa el contexto de memoria de Engram y sintetiza la
respuesta final cuando hay varios dominios involucrados.

Deliberadamente **no** es la única forma de trabajar. La tabla de routing en
`agents/ORCHESTRATOR.md` mapea palabras clave a subagentes, y `opencode.json` registra
los agentes de dominio para que se puedan invocar directamente. La decisión de *quién
ejecuta una tarea* se reduce a tres casos:

| Situación | Quién la ejecuta | Por qué |
|---|---|---|
| **Tarea de un solo dominio, bien acotada** (por ejemplo, "arreglá esta query de Prisma", "construí este componente de botón") | El agente de dominio directamente (FRONTEND / BACKEND / DATABASE / INFRA) | El especialista es dueño de las reglas de calidad de su stack, tiene todo el contexto y no hay overhead de routing. Meter al orquestador acá solo agrega un salto y diluye el contexto. |
| **Tarea ambigua, cross-domain o fullstack** (por ejemplo, "agregale auth a la app", "construí una feature de punta a punta") | ORCHESTRATOR delega y sintetiza | El orquestador clasifica el pedido, lo divide en dominios, pasa contexto de Engram a cada especialista y fusiona los resultados. Acá es donde la orquestación paga su costo. |
| **Se necesita especialización profunda en medio de la tarea** (por ejemplo, una feature de React que además requiere auditoría de accesibilidad) | Herramienta `Task` con un especialista con frontmatter (`subagent_type`) | Los especialistas con frontmatter son expertos bajo demanda; el agente activo les delega una porción enfocada y sigue con el resto del flujo. |

La filosofía: **"routing is a cost, not a ceremony"** (el enrutamiento es un costo, no
una ceremonia). Pagás el salto del orquestador solo cuando el problema es genuinamente
multi-dominio o la intención no está clara. Cuando el dominio es obvio, el especialista
va directo al trabajo.

## Instalación en una máquina nueva

```bash
# 1. Instalar OpenCode
curl -fsSL https://opencode.ai/install | bash

# 2. Clonar en la ruta EXACTA (hacer backup de un ~/.config/opencode existente primero)
git clone git@github.com:GianBaeza/IA-Workspace.git ~/.config/opencode

# 3. Instalar dependencias npm (plugins)
cd ~/.config/opencode && npm install

# 4. Binarios externos referenciados por plugins/MCP:
#    - engram        (servidor de memoria persistente — `go install` o binario release)
#    - gentle-ai     (skill registry + review transport)
#    - context7      (servidor MCP, descargado bajo demanda vía npx)
```

Las rutas absolutas en `opencode.json` y en los archivos de agentes apuntan a
`~/.config/opencode/`, así que clonar en esa ubicación hace que todos los agentes,
skills y plugins resuelvan correctamente.

## Convenciones de versionado

- `.gitignore` excluye `node_modules`, `.env*` (con `!.env.example`), lockfiles de otros
  package managers (`bun.lock`, `pnpm-lock.yaml`, `yarn.lock`) y ruido de SO.
- `package.json` y `package-lock.json` están **trackeados** — las dependencias se
  reinstalan con `npm install` en cada máquina, y el lockfile mantiene las versiones
  reproducibles.
- Solo conventional commits (sin atribución de IA).
- Sin secretos en el repositorio — escanear antes de commitear.

## Contribuir

- **Nueva skill**: correr `/skill-creator` y después `/skill-registry` para refrescar
  el índice.
- **Nuevo agente**: formato frontmatter para especialistas bajo demanda, o registrarlo
  en `opencode.json` para agentes siempre disponibles.
- **Nuevo comando**: los comandos del ciclo SDD viven en `commands/`.
- Pushear después de los cambios para que el repo siga siendo la fuente de verdad; las
  otras máquinas hacen `git pull`.

## Política de idioma

- **Interacción (chat)**: el agente responde siempre en el idioma en que le escribís —
  español, inglés, etc. Esto lo define la regla de idioma en `AGENTS.md`. No hay nada
  que configurar: si le hablás en español, te responde en español.
- **Artefactos de este repo** (README, docs, guías): en español, porque es el idioma del
  equipo que lo consume.
- **Artefactos de código** (identificadores, comentarios en código, copy de UI, strings):
  en inglés, por convención técnica estándar (lo define `AGENTS.md` en su sección de
  alcance de persona).
- **Cómo pedir un cambio de idioma**: si querés un README, doc o guía en otro idioma,
  decíselo al agente explícitamente (por ejemplo, "traducí esta guía al inglés"). El
  agente lo hace al momento, sin pasos extra.