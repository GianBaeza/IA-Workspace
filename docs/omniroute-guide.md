# OmniRoute — Guía Completa

## Qué es OmniRoute

Un **AI Gateway** que se queda entre tu IDE (OpenCode, Cursor, Claude Code, etc.) y los proveedores de LLM (OpenAI, Anthropic, Groq, etc.). Un solo endpoint, 268+ providers, auto-fallback automático.

```
Tu IDE → OmniRoute (localhost:20128/v1) → 268 providers
```

---

## Secciones principales

### 1. Providers

**Qué son:** Conexiones a proveedores de modelos de IA. Cada provider tiene una API key o OAuth que le da acceso a los modelos de ese proveedor.

**Ejemplos de providers configurados actualmente:**

| Provider | Qué es | Modelos destacados |
|---|---|---|
| `opencode` | Red de OpenCode (70+ modelos) | `oc/claude-sonnet-5`, `oc/gpt-5.5-pro`, `oc/deepseek-v4-flash-free` |
| `kiro` | Servicio de Kiro AI (22 modelos) | `kr/claude-sonnet-5`, `kr/claude-sonnet-4.5` |
| `auggie` | Proxy Auggie (15 modelos) | `aug/claude-sonnet-4.6`, `aug/claude-opus-4.6` |
| `theoldllm` | Agregador TheOldLLM (26 modelos) | `tllm/CLAUDE_4_6_OPUS`, `tllm/GPT_5_4` |
| `freemodel-dev` | FreeModel Dev (6 modelos) | `fmd/gpt-5.6-luna`, `fmd/gpt-5.6-sol` |
| `duckduckgo-web` | DuckDuckGo Web (6 modelos) | `ddgw/gpt-4o-mini`, `ddgw/gpt-5-mini` |

**Desde el dashboard** (`localhost:20128/dashboard` → pestaña Providers):
- Ver conexiones activas y su estado (salud, cuota, latencia)
- Agregar nuevos providers con API keys
- Probar conexiones
- Ver métricas de uso

**Desde CLI:**
```bash
omniroute providers list      # Listar providers configurados
omniroute providers status    # Estado de salud de cada key
omniroute providers metrics   # Métricas de rendimiento
omniroute providers test-all  # Probar todas las conexiones
```

---

### 2. Combos (Routing Combos)

**Qué son:** Cadenas de modelos configuradas para auto-fallback. Cuando un modelo se queda sin cuota o falla, el combo salta al siguiente automáticamente.

**Analogía:** Un combo es como una lista de reproducción musical — si una canción falla, pasa a la siguiente sin que vos hagas nada.

**Estrategias de routing disponibles:**

| Estrategia | Qué hace |
|---|---|
| `priority` | Intenta el primero, si falla pasa al siguiente (drain) |
| `auto` | Scoring de 12 factores, elige el mejor en tiempo real |
| `cost-optimized` | Siempre el más barato por token |
| `round-robin` | Alterna entre modelos en orden |
| `fill-first` | Llena la cuota de uno antes de pasar al siguiente |
| `lkgp` | Se queda pegado al último modelo que funcionó |

**Combo creado — `gentle-coding`:**

| Prioridad | Modelo | Provider |
|---|---|---|
| 1 | `oc/claude-sonnet-5` | OpenCode |
| 2 | `oc/claude-opus-4-8` | OpenCode |
| 3 | `aug/claude-sonnet-4.6` | Auggie |
| 4 | `kr/claude-sonnet-5` | Kiro |
| 5 | `oc/gpt-5.5-pro` | OpenCode |
| 6 | `tllm/CLAUDE_4_6_SONNET` | TheOldLLM |
| 7 | `oc/deepseek-v4-flash-free` | OpenCode (gratis) |
| 8 | `oc/qwen3.6-plus-free` | OpenCode (gratis) |
| 9 | `oc/minimax-m3-free` | OpenCode (gratis) |

**Desde el dashboard** (pestaña Combos):
- Crear nuevos combos con drag-and-drop
- Editar el orden de prioridad
- Ver cuál modelo se está usando en tiempo real
- Activar/desactivar combos

**Desde CLI:**
```bash
omniroute combo list                    # Listar combos
omniroute combo create <nombre> --strategy priority  # Crear combo
omniroute combo switch <nombre>         # Activar un combo
```

**Combos `auto/*` predefinidos (ya incluidos):**

| Combo | Optimizado para |
|---|---|
| `auto/coding` | Calidad de código |
| `auto/fast` | Velocidad |
| `auto/cheap` | Costo mínimo |
| `auto/best-coding` | Mejor modelo de código disponible |
| `auto/best-free` | Solo modelos gratuitos |
| `auto/smart` | Scoring inteligente + exploración |

---

### 3. Modelos

**Qué son:** Representaciones de los modelos de IA disponibles a través de los providers. Cada modelo tiene un ID compuesto: `provider/modelo`.

**Formato:** `provider/model-name`
- `oc/claude-sonnet-5` → OpenCode, modelo Claude Sonnet 5
- `aug/claude-opus-4.6` → Auggie, modelo Claude Opus 4.6
- `auto/coding` → Combo automático optimizado para código

**Modelos gratuitos disponibles:**

| Modelo | Provider | Cuota |
|---|---|---|
| `oc/deepseek-v4-flash-free` | OpenCode | Gratis |
| `oc/minimax-m3-free` | OpenCode | Gratis |
| `oc/qwen3.6-plus-free` | OpenCode | Gratis |
| `fmd/gpt-5.6-luna` | FreeModel Dev | Gratis |
| `af/gemma3-270m:free` | API AirForce | Gratis |

**Desde CLI:**
```bash
curl -s -H "Authorization: Bearer <api-key>" http://localhost:20128/v1/models
```

---

### 4. Resilience (Capas de protección)

**Qué son:** 3 capas independientes que evitan que una falla mate todo el sistema.

```
Provider circuit breaker  →  Si el provider entero falla, lo salta
  └── Connection cooldown →  Si una key falla, la enfría pero otras siguen
       └── Model lockout  →  Si un modelo falla, lo bloquea pero otros modelos siguen
```

| Capa | Qué protege | Ejemplo |
|---|---|---|
| **Circuit Breaker** | Provider entero | OpenAI cae → salta a Anthropic |
| **Cooldown** | Una key/account | Key rate-limited → usa otra key del mismo provider |
| **Lockout** | Un modelo | Claude saturado → usa GPT en su lugar |

**Desde el dashboard** (pestaña Health):
- Ver circuit breakers abiertos/cerrados
- Ver keys en cooldown
- Ver modelos lockeados

---

### 5. Compresión de tokens

**Qué hace:** Reduce el tamaño de los prompts y respuestas antes de enviarlos al modelo, ahorrando tokens (y dinero).

**Motores disponibles:**

| Motor | Qué hace | Ahorro |
|---|---|---|
| **RTK** | Filtrado inteligente de tool results | 60-90% |
| **Caveman** | Compresión de prosa por reglas | hasta 75% |
| **Session-Dedup** | Elimina contenido repetido entre turnos | Variable |
| **Headroom** | Compactación lossless de JSON/tablas | Variable |

**Configuración:**
```bash
omniroute compression --help    # Ver opciones
```

---

### 6. Memory (Memoria conversacional)

**Qué es:** Memoria persistente que sobrevive entre sesiones. Usa FTS5 (búsqueda por palabras clave) + Qdrant (búsqueda vectorial semántica).

**Útil para:** Recordar contexto de conversaciones anteriores sin tener que repetirlo.

---

### 7. MCP Server

**Qué es:** OmniRoute expone su propio gateway como herramientas MCP (Model Context Protocol). 104 herramientas, 31 scopes.

**Para qué sirve:** Un agente MCP puede usar OmniRoute como herramienta — puede consultar cuota, cambiar de modelo, etc.

**Configurar en Claude Code:**
```bash
claude mcp add omniroute --type http --url http://localhost:20128/api/mcp/stream
```

---

### 8. A2A Server (Agent-to-Agent)

**Qué es:** Protocolo JSON-RPC que permite que agentes se comuniquen entre sí. OmniRoute expone 6 skills: smart routing, quota, discovery, cost analysis, health reporting.

---

### 9. Dashboard

**URL:** `http://localhost:20128/dashboard`

**Secciones:**

| Pestaña | Qué muestra |
|---|---|
| **Providers** | Conexiones activas, estado, API keys |
| **Combos** | Combos creados, activación, drag-and-drop |
| **Analytics** | Uso por modelo, costo, latencia, tokens |
| **Health** | Circuit breakers, cooldowns, lockouts |
| **Costs** | Desglose de gasto por provider/modelo |

---

### 10. API Key

**Qué es:** La credencial que usás para conectarte a OmniRoute desde tu IDE.

**Tu API key actual:** `sk-76271c13fa948d38-dd5a27-0207b254`

**Scopes:**
- `self:usage` → Solo puede hacer peticiones de chat (no gestión)

**Para gestión** (crear combos, etc.) necesitás un **management token** que se crea desde el dashboard o CLI con permisos admin.

---

## Flujo completo de una petición

```
1. Tu IDE envía: POST http://localhost:20128/v1/chat/completions
   Body: { "model": "auto/coding", "messages": [...] }

2. OmniRoute recibe la petición

3. Busca el combo activo (o usa el modelo directo)

4. El motor de routing selecciona el mejor modelo:
   - ¿auto/coding? → scoring de 12 factores
   - ¿gentle-coding? → priority (primero Claude Sonnet 5, luego fallback)

5. Envía al provider seleccionado

6. Si falla (quota, rate limit, error):
   - Capa 1: Circuit breaker del provider
   - Capa 2: Cooldown de la key
   - Capa 3: Lockout del modelo
   - Salta al siguiente en el combo

7. La respuesta llega a tu IDE como si fuera un modelo normal
```

---

## Resumen rápido

| Sección | Qué es | Para qué sirve |
|---|---|---|
| **Providers** | Conexiones a proveedores de IA | Acceder a 268+ modelos |
| **Combos** | Cadenas de fallback automático | Nunca quedarse sin modelo |
| **Modelos** | IDs de los modelos disponibles | Seleccionar qué modelo usar |
| **Resilience** | 3 capas de protección | Evitar que una falla mate todo |
| **Compresión** | Reducir tokens | Ahorrar dinero |
| **Memory** | Memoria persistente | Recordar contexto entre sesiones |
| **MCP/A2A** | Protocolos de agentes | Integrar con otros agentes |
| **Dashboard** | Panel de control visual | Administrar todo gráficamente |
| **API Key** | Credencial de acceso | Conectar tu IDE a OmniRoute |
