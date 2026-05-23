// Input-sanitization middleware for the Profirmo backend (Phase 5).
//
// Recursively walks req.body (and req.query when writable) and cleans every
// STRING value. This is defense-in-depth only: SQL injection is already
// prevented by Sequelize's parameterized queries, and React escapes output
// on render.
//
// The cleaning is deliberately CONSERVATIVE — it must NOT mangle ordinary
// text. Names, bios and addresses containing `&`, `'`, `"`, `<` etc. survive
// intact. Only the following transforms are applied to each string:
//   1. trim leading/trailing whitespace
//   2. strip null bytes and ASCII control characters (except \t \n \r)
//   3. remove obvious script-injection: <script>...</script> blocks and
//      `javascript:` URI prefixes

// Matches a full <script ...>...</script> block (case-insensitive, multi-line)
// and also a dangling, unclosed <script ...> tag.
const SCRIPT_BLOCK = /<script\b[^>]*>[\s\S]*?<\/script\s*>/gi;
const SCRIPT_OPEN = /<script\b[^>]*>/gi;

// Matches a leading `javascript:` URI scheme, tolerating whitespace.
const JS_URI = /^\s*javascript:/i;

// Strip null bytes and control characters but keep tab (\x09), newline
// (\x0A) and carriage return (\x0D) so multi-line text (bios, descriptions)
// is preserved. Built from a string literal so no raw control bytes are
// embedded in source.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = new RegExp('[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]', 'g');

/**
 * Clean a single string value conservatively.
 * @param {string} value
 * @returns {string}
 */
const cleanString = (value) => {
  let out = value;
  out = out.replace(CONTROL_CHARS, '');
  out = out.replace(SCRIPT_BLOCK, '');
  out = out.replace(SCRIPT_OPEN, '');
  // Neutralize a javascript: URI prefix without destroying the rest.
  out = out.replace(JS_URI, '');
  out = out.trim();
  return out;
};

/**
 * Recursively sanitize an object/array in place. Returns the (possibly
 * replaced) value so callers can reassign primitives.
 * @param {*} node
 * @returns {*}
 */
const sanitizeNode = (node) => {
  if (typeof node === 'string') {
    return cleanString(node);
  }
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i += 1) {
      node[i] = sanitizeNode(node[i]);
    }
    return node;
  }
  if (node && typeof node === 'object') {
    for (const key of Object.keys(node)) {
      node[key] = sanitizeNode(node[key]);
    }
    return node;
  }
  // Numbers, booleans, null, undefined — leave untouched.
  return node;
};

const sanitizeInput = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    sanitizeNode(req.body);
  }

  // req.query is a getter-backed object on some Express versions; only mutate
  // it when it is safely writable so we never throw into the request.
  if (req.query && typeof req.query === 'object') {
    try {
      sanitizeNode(req.query);
    } catch (err) {
      // Read-only query object — skip silently.
    }
  }

  return next();
};

module.exports = { sanitizeInput };
