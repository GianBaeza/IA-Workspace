# IA Workspace

Entornos de asistente de programación con IA, versionados como texto plano. Este repo
contiene **dos entornos independientes**, uno por CLI — no comparten agentes, skills ni
convenciones entre sí, cada uno vive en su propia carpeta y tiene su propio README:

| Entorno | CLI | Carpeta | Instrucciones |
|---|---|---|---|
| **OpenCode** | [opencode.ai](https://opencode.ai) | [`opencode/`](opencode/README.md) | [`opencode/README.md`](opencode/README.md) |
| **Claude Code** | [code.claude.com](https://code.claude.com) | [`claude-code/`](claude-code/README.md) | [`claude-code/README.md`](claude-code/README.md) |

## Por qué dos entornos separados y no uno compartido

Cada CLI tiene su propio modelo de agentes/skills/memoria — no son intercambiables:

- **OpenCode** enruta con un ORCHESTRATOR explícito por keywords, registra agentes en
  `opencode.json` con rutas absolutas, y necesita Engram (MCP + SQLite) porque no tiene
  memoria propia entre sesiones.
- **Claude Code** no tiene ese router explícito ni ese registro — decide qué subagente
  usar por el campo `description` de cada uno (o por mención explícita `@agente`), y ya
  trae memoria persistente entre sesiones nativa, sin necesidad de un MCP de memoria.

Copiar la estructura de uno al otro produciría convenciones muertas (rutas que no
resuelven, protocolos de memoria redundantes). Por eso `claude-code/` es un entorno
diseñado desde cero para cómo funciona Claude Code realmente, no una traducción
mecánica de `opencode/`. El análisis completo de esas diferencias está en
[`claude-code/README.md`](claude-code/README.md).

## Qué NO comparten

- Ningún archivo se referencia entre carpetas — cada una se instala y funciona sola.
- `opencode/` sigue trackeando `package.json`/`package-lock.json` porque sus plugins
  son código Node que corre dentro de OpenCode. `claude-code/` no tiene plugins ni
  dependencias — son solo `.md`.
- `opencode/` tiene memoria persistente vía Engram; `claude-code/` se apoya en la
  memoria nativa de Claude Code y no define nada equivalente.
