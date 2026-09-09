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
├── scripts/                 # Plantilla global parse-html.mjs (se copia a cada proyecto)
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

- Modelo por defecto: `opencode/big-pickle` (OpenCode Zen, free)
- `experimental.enableAgents` — activa el sistema de agentes
- Dos servidores MCP:
  - **engram** — memoria persistente respaldada por un binario Go local + SQLite
  - **context7** — documentación actualizada de librerías/frameworks
- Seis agentes registrados (ORCHESTRATOR, FRONTEND, BACKEND, DATABASE, INFRA, MOCKUP-ORCHESTRATOR), cada uno apuntando a un archivo de instrucciones con una
  **ruta absoluta** (`~/.config/opencode/agents/*.md`) — por eso clonar en la misma
  ruta exacta hace que todo funcione en una máquina nueva.

### Agentes — dos formatos, un mismo sistema

| Formato | Cómo se carga | Ejemplos |
|---|---|---|
| **Agentes registrados** | Markdown plano, cableados en `opencode.json` | Siempre disponibles en la lista de agentes: ORCHESTRATOR, FRONTEND, BACKEND, DATABASE, INFRA, MOCKUP-ORCHESTRATOR |
| **Especialistas (subagentes)** | Frontmatter (`name`, `description`, `license`) | Bajo demanda, vía la herramienta `Task` (`subagent_type`): REACT-SPECIALIST, NEXTJS-SPECIALIST, EXPRESS-SPECIALIST, DJANGO-SPECIALIST, ANGULAR-SPECIALIST, ACCESSIBILITY-SPECIALIST, UX-UI-SPECIALIST, BRUNO-SPECIALIST, BACKEND-SPECIALIST |

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

### El costo real de delegar vía ORCHESTRATOR

Los agentes especializados se registran en `opencode.json` (y se invocan directo, sin
pasar por el orquestador) porque orquestar una tarea de dominio claro es una doble pasada
de LLM innecesaria:

1. **Hop extra**: el orquestador lee el pedido completo, lo clasifica, arma el prompt de
   delegación y lo envía al subagente vía `Task`. Eso es una pasada completa de LLM
   (tokens de entrada + salida + latencia) que no aporta nada si ya se sabe qué agente
   tiene que trabajar.
2. **Contexto filtrado**: el subagente no recibe el pedido original tal cual, sino la
   interpretación que el orquestador decidió pasarle. Eso puede perder matices del prompt
   original y del historial de la conversación.
3. **Overhead marginal de instrucciones**: las instrucciones de routing del orquestador
   (`agents/ORCHESTRATOR.md`) se suman al system prompt cuando se lo usa. No es el costo
   dominante — el contexto fijo (AGENTS.md, skill descriptions, MCP) se paga igual con
   cualquier agente — pero es parte del paquete.

Cuando el dominio es obvio, invocar al especialista directamente elimina los tres costos
y el contexto llega íntegro; el orquestador queda reservado para los casos donde su
clasificación y síntesis realmente agregan valor.

## Cambios recientes (sesiones 2026-09)

Tres decisiones modifican el estado descrito arriba; todas quedan versionadas en este repo.

### 1. Nuevo orquestador de dominio: MOCKUP-ORCHESTRATOR

Es un **orquestador de segundo nivel, dominio-específico**: no clasifica dominios generales
(eso es del ORCHESTRATOR root), solo se activa para "analizar un mockup HTML → preparar su
conversión a componentes React/Next.js". Registrado en `opencode.json` como
`mockup-orchestrator`, con su lógica en `agents/MOCKUP-ORCHESTRATOR.md`.

Pipeline (el detalle operativo completo vive en el archivo del agente):

| Fase | Qué hace | Quién | Dónde persiste |
|---|---|---|---|
| **F0 — Indexación** | Construye el `codegraph.json`: arquitectura real del proyecto, convenciones, shared components, design tokens, defaults de rendering | El orquestador (find/grep/read + sampleo de 3-5 componentes) | `.opencode/architecture/codegraph.json` — una sola vez por proyecto |
| **F1 — Parsing** | Analiza el DOM del mockup de forma **determinística** | Script `parse-html.mjs` (Node + jsdom vía Bash) | `/tmp/dom-analysis.json` — sin pasar HTML por el LLM |
| **F2 — Plan** | Mapea DOM + codegraph a un `ComponentPlan`: boundaries server/client, Server Actions, hooks, estrategia de rendering (SSR/SSG/ISR/CSR) | El orquestador en rol NEXT-ARCHITECT | `.opencode/architecture/<MODULO>.plan.json` |
| **F3 — Reporte** | Produce el análisis legible con decisiones y próximos pasos | El orquestador | `mockups/<archivo>.analysis.md` |

Roles internos: HTML-PARSER y NEXT-ARCHITECT son **fases** que el orquestador asume, no
agentes registrados por separado — se evita overhead de configuración y de hop. El orquestador
**nunca escribe código**: la implementación la ejecuta FRONTEND en una sesión aparte leyendo
el plan (que se commitea).

### 2. Convención de carpetas de proyecto: `.opencode/` (adiós a `.claude/`)

Todo lo que el pipeline genera vive en la raíz del proyecto bajo la convención nativa de
opencode, no la de Claude Code:

```
mockups/                     ← mockups HTML (convención obligatoria)
.opencode/architecture/      ← codegraph + planes (se commitean)
.opencode/scripts/           ← parse-html.mjs (se commitea; plantilla global en scripts/)
```

Razón: el entorno es 100% opencode — no convive con Claude Code — y `.opencode/` es el
directorio de configuración de proyecto de opencode. Los artefactos del pipeline se commitean
para que codegraph y planes sean compartidos por el equipo y reaprovechados por futuras
sesiones sin re-generarlos.

### 3. Modelos: OpenCode Zen (`big-pickle`) como default, sin Anthropic directo

Se eliminó `anthropic/claude-sonnet-4-6` del default y de todos los agentes:

- **Default y todos los agentes registrados**: `opencode/big-pickle` (red Zen).
- **Plan pagado a mano**: OpenCode Go (suscripción flat, modelos open code: GLM, Kimi, Qwen,
  DeepSeek V4) — se asigna por agente cuando se necesita, con ids `opencode-go/<modelo>`.

Beneficio: un solo proveedor, sin API keys de terceros; Zen ya está autenticado con login
propio. Advertencia documentada: big-pickle es free "por tiempo limitado" y durante ese
período los datos pueden usarse para mejorar el modelo (excepción a la política zero-retention
de Zen) — ver trade-offs más abajo.

---

## Análisis de costos: orquestación vs especialista directo (con números)

### Qué se paga siempre (contexto fijo)

Cualquier request, con cualquier agente, paga el contexto base del system prompt: `AGENTS.md`,
el índice de descripciones de las skills, las definiciones de las herramientas, los tools de
MCP (engram, context7) y el protocolo inyectado por plugins. Estimado: **~20-35K tokens de
entrada por request**. Este costo es idéntico usando orquestador o agente directo, así que
**no entra en el delta** de la comparación — pero explica por qué el overhead de orquestar es
marginal frente a la parte fija.

### El hop del ORCHESTRATOR root

Delegar una tarea de dominio claro vía el root siempre agrega una pasada extra de LLM:

- el orquestador relee el pedido (0.5-2K in) y emite el prompt de delegación (0.3-1K out);
- sus instrucciones de routing entran al system prompt (~600 tokens);
- el subagente arranca contexto nuevo desde cero.

**Costo del hop: ≈ 2-4K tokens.** Confirma lo que ya dice la tabla de arriba: *siempre* pasar
por el root es derroche cuando el dominio es obvio. Pero es un derroche **pequeño** comparado
con equivocar el routing: una tarea mal derivada puede gastar 50-200K tokens en trabajo
descartado. Por eso el root se reserva para ambigüedad y cross-domain.

### Caso aplicado: MOCKUP-ORCHESTRATOR vs FRONTEND directo

Supuestos: mockup típico de 100-300KB de HTML, proyecto Next.js mediano, ~4 caracteres por
token en HTML crudo. Son estimaciones de orden de magnitud, no mediciones.

| Paso | FRONTEND directo (sin pipeline) | Pipeline MOCKUP-ORCHESTRATOR |
|---|---|---|
| Entender el mockup | LLM lee el HTML crudo: **25-75K tokens**, con riesgo de "leerlo mal" (anidamiento, tablas) → rework | `parse-html.mjs` lo analiza en Node: **~0 tokens** de LLM; solo entra el JSON estructurado: **2-8K** |
| Conocer la arquitectura | Re-escanear el repo en cada sesión: **20-40K** | Leer el codegraph persistido: **3-8K** (generarlo cuesta 30-50K, amortizado una vez por proyecto) |
| Decidir componentes y rendering | Razonamiento libre, posible duplicación de componentes existentes, 1-2 correcciones: **30-100K** | Reglas determinísticas (boundaries, repetición, reutilización): **3-10K** |
| Persistencia | Nada: hay que rehacerlo en cada sesión | `plan.json` + `analysis.md` commiteados: **0** |
| **Total por mockup** | **~100-200K tokens** | **~10-30K tokens** |

**Escenario: 3 mockups del mismo proyecto.**

- Directo: 3 × 150K ≈ **450K tokens**.
- Pipeline: 40K (codegraph, una sola vez) + 3 × 20K = **100K tokens**.
- **Ahorro ≈ 78% del input** — y crece con cada mockup adicional, porque la fuente de verdad
  (codegraph) nunca se re-genera.

**Break-even:** el codegraph cuesta lo mismo que un escaneo directo; desde el **2º mockup** el
pipeline es netamente más barato.

### Beneficios más allá de los tokens

1. **Determinismo en el parsing** — el LLM nunca "lee" el HTML; el script lo estructura. Se
   elimina la alucinación estructural y sus loops de rework.
2. **Persistencia compartida** — codegraph y planes se commitean: otras sesiones y otros devs
   no repagan el análisis.
3. **Reutilización asistida** — el codegraph conoce `sharedComponents`; el pipeline evita
   proponer duplicados (menos trabajo para FRONTEND en la implementación).
4. **Menos contexto por turno → menos compactaciones** — reducir input disminuye el riesgo de
   perder matices por auto-compaction agresiva.
5. **Separación análisis/implementación** — el orquestador nunca escribe código; FRONTEND
   ejecuta con un plan cerrado. Menos ida y vuelta, menos decisiones improvisadas.
6. **Metricable** — el pipeline deja artefactos JSON que sirven como registro de decisión y
   para medir (por ejemplo, `reuseCount`, `clientComponentCount`).

### No-beneficios y cuando NO conviene (trade-offs aplicados)

| Limitación | Impacto |
|---|---|
| Setup fijo por proyecto | `mkdir mockups .opencode/...`, `npm i -D jsdom`, commitear artefactos — costo chico pero real |
| Un solo mockup chico, aislado | El pipeline es overkill; FRONTEND directo es más rápido |
| Parser acotado (profundidad 6, top-20 patrones) | DOMs muy anidados o sin tags semánticos degradan el plan |
| Solo HTML estático | No Figma, no imágenes; la limitación se reporta, no se "inventa" |
| Mantenimiento del codegraph | Si la arquitectura cambia hay que re-indexar a pedido; el orquestador NO lo re-indexa solo (regla explícita) |
| Dependencia nueva | `jsdom` en devDependencies de cada proyecto |
| Modelo gratuito transitorio | big-pickle es free "por tiempo limitado"; durante el free period los datos pueden usarse para mejorar el modelo |

### Regla de decisión resultante

| Caso | Qué usar |
|---|---|
| 2+ mockups por proyecto, mockup HTML | **MOCKUP-ORCHESTRATOR** (ahorro ~78% de input + determinismo) |
| 1 mockup trivial aislado | FRONTEND directo |
| Feature multi-dominio o pedido ambiguo | ORCHESTRATOR root |
| Tarea de dominio claro y acotado | Agente especialista directo |
| Especialización puntual en medio de una tarea | `Task` + subagente con frontmatter |

**Conclusión.** La pregunta no es "orquestador o directo" en abstracto, sino **dónde vive el
determinismo**. Cuando el trabajo puede ejecutarse con scripts y estructura (parsear, indexar,
decisión por reglas), el LLM no debe pagarlas por token: un orquestador de dominio que
orquesta herramientas y deja al LLM solo la decisión arquitectónica sale más barato que el
especialista directo que hace todo en contexto. Cuando no hay pipeline que automatizar, el
costo del hop (2-4K tokens) no justifica el viaje y el especialista directo gana. Esta es la
razón por la que el ecosistema tiene ambos, deliberadamente.

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