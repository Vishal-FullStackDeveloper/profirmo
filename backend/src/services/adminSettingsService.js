// adminSettingsService — typed read/write over the AdminSetting key/value
// table. Each known setting has a default + a coercer so the rest of the
// code can call getNumber('bookingMarkupBps') without dealing with strings.

const { AdminSetting } = require('../models');
const env = require('../config/env');

// Registry of every setting we expose. Adding a new one only requires
// dropping an entry here — the admin UI reads off the same list.
const SETTINGS = {
  bookingMarkupBps: {
    label: 'Booking markup (basis points)',
    description:
      'Platform fee taken from each consultation payment, in basis points. 1000 = 10%. Editing this affects every NEW payment; existing payments keep the markup they were captured with.',
    defaultGetter: () => Number(env.platformFeeBps) || 1000,
    coerce: (raw) => {
      const n = Math.floor(Number(raw));
      if (!Number.isFinite(n) || n < 0 || n > 10000) {
        throw {
          statusCode: 422,
          message: 'bookingMarkupBps must be an integer between 0 and 10000.',
        };
      }
      return n;
    },
    format: (n) => String(Math.floor(Number(n) || 0)),
  },
};

const KNOWN_KEYS = Object.keys(SETTINGS);

/** Return every known setting with its current value. */
async function listAll() {
  const rows = await AdminSetting.findAll({ raw: true });
  const byKey = new Map(rows.map((r) => [r.key, r]));
  return KNOWN_KEYS.map((key) => {
    const spec = SETTINGS[key];
    const stored = byKey.get(key);
    const value = stored ? spec.coerce(stored.value) : spec.defaultGetter();
    return {
      key,
      value,
      label: spec.label,
      description: spec.description,
      defaultValue: spec.defaultGetter(),
      updatedAt: stored ? stored.updatedAt : null,
    };
  });
}

/** Typed getter — returns the coerced value or the default. */
async function getNumber(key) {
  const spec = SETTINGS[key];
  if (!spec) throw new Error(`Unknown admin setting: ${key}`);
  const row = await AdminSetting.findByPk(key);
  if (!row || row.value === null || row.value === undefined || row.value === '') {
    return spec.defaultGetter();
  }
  try {
    return spec.coerce(row.value);
  } catch {
    return spec.defaultGetter();
  }
}

/**
 * Set a setting. Validates the key + coerces the value. Returns the new
 * coerced value so the admin UI can echo it back.
 */
async function set(key, value, actorUserId) {
  const spec = SETTINGS[key];
  if (!spec) {
    throw { statusCode: 404, message: `Unknown setting: ${key}` };
  }
  const coerced = spec.coerce(value);
  const formatted = spec.format(coerced);
  const existing = await AdminSetting.findByPk(key);
  if (existing) {
    await existing.update({
      value: formatted,
      label: spec.label,
      description: spec.description,
      updatedByUserId: actorUserId || null,
    });
  } else {
    await AdminSetting.create({
      key,
      value: formatted,
      label: spec.label,
      description: spec.description,
      updatedByUserId: actorUserId || null,
    });
  }
  return coerced;
}

module.exports = {
  SETTINGS,
  KNOWN_KEYS,
  listAll,
  getNumber,
  set,
};
