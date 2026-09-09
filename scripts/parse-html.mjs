/**
 * parse-html.mjs
 * Script de parsing determinístico de mockups HTML.
 * Parte del sistema MOCKUP-ORCHESTRATOR.
 *
 * Uso: node parse-html.mjs ./mockups/mi-mockup.html
 * Output: JSON a stdout
 *
 * Deploy: copiar a .opencode/scripts/parse-html.mjs en cada proyecto.
 * Dependencia: npm install jsdom --save-dev
 */

import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';

// ─── Validación de argumentos ───────────────────────────────────────────────

const htmlPath = process.argv[2];

if (!htmlPath) {
  console.error(JSON.stringify({
    error: 'NO_PATH',
    message: 'Uso: node parse-html.mjs <path-al-html>',
  }));
  process.exit(1);
}

let html;
try {
  html = readFileSync(htmlPath, 'utf-8');
} catch (e) {
  console.error(JSON.stringify({
    error: 'FILE_NOT_FOUND',
    message: `No se pudo leer el archivo: ${htmlPath}`,
    detail: e.message,
  }));
  process.exit(1);
}

// ─── Setup DOM ──────────────────────────────────────────────────────────────

const dom = new JSDOM(html);
const doc = dom.window.document;

if (!doc.body) {
  console.error(JSON.stringify({
    error: 'NO_BODY',
    message: 'El HTML no tiene tag <body>. El parser requiere HTML con estructura completa.',
  }));
  process.exit(1);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const RELEVANT_ATTRS = ['id', 'class', 'role', 'aria-label', 'data-testid', 'href', 'type', 'name', 'placeholder', 'data-bind', 'data-dynamic', 'data-action'];
const INTERACTIVE_TAGS = new Set(['button', 'input', 'select', 'textarea', 'form', 'a']);
const INTERACTIVE_ATTRS = ['onclick', 'onchange', 'onsubmit', 'onkeydown', 'onkeyup', 'data-action'];
const SEMANTIC_TAGS = ['header', 'nav', 'main', 'aside', 'footer', 'section', 'article', 'dialog'];

function getRelevantAttrs(el) {
  const attrs = {};
  for (const attr of el.attributes) {
    if (RELEVANT_ATTRS.includes(attr.name)) {
      attrs[attr.name] = attr.value;
    }
  }
  return Object.keys(attrs).length > 0 ? attrs : null;
}

function isInteractive(el) {
  const tag = el.tagName?.toLowerCase();
  return (
    INTERACTIVE_TAGS.has(tag) ||
    INTERACTIVE_ATTRS.some(a => el.hasAttribute(a))
  );
}

function isDynamic(el) {
  const text = el.textContent?.trim() || '';
  return (
    /\{[\w.[\]]+\}/.test(text) ||           // {variable} o {obj.prop}
    /\[\[[\w.]+\]\]/.test(text) ||          // [[variable]]
    /lorem ipsum/i.test(text) ||             // placeholder text
    /^\d{4}-\d{2}-\d{2}/.test(text) ||      // fecha placeholder
    el.hasAttribute('data-bind') ||
    el.hasAttribute('data-dynamic') ||
    (el.tagName?.toLowerCase() === 'img' && !el.getAttribute('src'))  // img sin src
  );
}

function getNodeSignature(el) {
  // Firma estructural para detectar repeticiones: tag + clases ordenadas
  const classes = [...el.classList].sort().join('.');
  return `${el.tagName?.toLowerCase()}${classes ? '.' + classes : ''}`;
}

// ─── Builder del árbol ───────────────────────────────────────────────────────

function buildTree(node, depth = 0) {
  if (depth > 6) return null;
  if (node.nodeType !== 1) return null; // solo Element nodes

  const tag = node.tagName?.toLowerCase();
  if (!tag) return null;

  // Ignorar nodos no relevantes para análisis de UI
  const SKIP_TAGS = new Set(['script', 'style', 'meta', 'link', 'title', 'head', 'noscript']);
  if (SKIP_TAGS.has(tag)) return null;

  const children = [...node.children]
    .map(c => buildTree(c, depth + 1))
    .filter(Boolean);

  const nodeData = {
    tag,
    depth,
    signature: getNodeSignature(node),
    isInteractive: isInteractive(node),
    isDynamic: isDynamic(node),
    isSemanticRegion: SEMANTIC_TAGS.includes(tag),
    hasText: node.children.length === 0 && !!node.textContent?.trim(),
    childCount: node.children.length,
  };

  const attrs = getRelevantAttrs(node);
  if (attrs) nodeData.attrs = attrs;

  if (children.length > 0) nodeData.children = children;

  return nodeData;
}

// ─── Detección de patrones repetidos ────────────────────────────────────────

function detectRepeatingPatterns(doc) {
  const signatureMap = new Map();

  doc.querySelectorAll('*').forEach(el => {
    const tag = el.tagName?.toLowerCase();
    if (!tag || ['script', 'style', 'meta', 'link'].includes(tag)) return;

    const sig = getNodeSignature(el);
    if (!signatureMap.has(sig)) signatureMap.set(sig, 0);
    signatureMap.set(sig, signatureMap.get(sig) + 1);
  });

  return [...signatureMap.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20) // top 20 patrones
    .map(([signature, count]) => ({ signature, count }));
}

// ─── Detección de regiones semánticas ───────────────────────────────────────

function detectSemanticRegions(doc) {
  return SEMANTIC_TAGS
    .map(tag => {
      const el = doc.querySelector(tag);
      if (!el) return null;
      return {
        tag,
        id: el.id || null,
        classes: [...el.classList].slice(0, 5),
        childCount: el.children.length,
      };
    })
    .filter(Boolean);
}

// ─── Detección de profundidad máxima real ───────────────────────────────────

function getMaxDepth(node, depth = 0) {
  if (!node.children || node.children.length === 0) return depth;
  return Math.max(...[...node.children].map(c => getMaxDepth(c, depth + 1)));
}

// ─── Análisis de elementos interactivos ─────────────────────────────────────

function analyzeInteractiveElements(doc) {
  const result = {
    forms: doc.querySelectorAll('form').length,
    buttons: doc.querySelectorAll('button').length,
    inputs: doc.querySelectorAll('input').length,
    selects: doc.querySelectorAll('select').length,
    links: doc.querySelectorAll('a[href]').length,
  };
  result.total = result.forms + result.buttons + result.inputs + result.selects;
  result.hasClientInteractivity = result.total > 0;
  return result;
}

// ─── Construcción del análisis completo ─────────────────────────────────────

const analysis = {
  meta: {
    sourcePath: htmlPath,
    analyzedAt: new Date().toISOString(),
    parserVersion: '1.0',
  },
  summary: {
    totalElements: doc.querySelectorAll('*').length,
    maxDOMDepth: getMaxDepth(doc.body),
    semanticRegionsFound: SEMANTIC_TAGS.filter(t => !!doc.querySelector(t)).length,
    repeatingPatternsFound: 0, // se actualiza abajo
    hasClientInteractivity: false, // se actualiza abajo
  },
  tree: buildTree(doc.body),
  semanticRegions: detectSemanticRegions(doc),
  repeatingPatterns: detectRepeatingPatterns(doc),
  interactiveElements: analyzeInteractiveElements(doc),
};

// Actualizar summary con datos reales
analysis.summary.repeatingPatternsFound = analysis.repeatingPatterns.length;
analysis.summary.hasClientInteractivity = analysis.interactiveElements.hasClientInteractivity;

// ─── Output ──────────────────────────────────────────────────────────────────

console.log(JSON.stringify(analysis, null, 2));