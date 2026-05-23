const { Op } = require('sequelize');
const {
  Firm,
  Professional,
  Case,
  Client,
  LawFirm,
  FirmMember,
  ProfessionalDetail,
  User,
} = require('../models');
const reviewStats = require('./reviewStats');

/**
 * Resolve the professional listing-ids whose reviews make up a firm's
 * collective reviews. Works for a legacy firm id or a law-firm id — legacy
 * firms own `professionals` rows, new-model firms own `firm_members`.
 * @param {string} firmId
 * @returns {Promise<string[]>}
 */
const getFirmProfessionalIds = async (firmId) => {
  if (!firmId) return [];
  const [legacyPros, members] = await Promise.all([
    Professional.findAll({
      where: { firmId },
      attributes: ['id'],
      raw: true,
    }),
    FirmMember.findAll({
      where: { firmId },
      attributes: ['professionalId'],
      raw: true,
    }),
  ]);
  return [
    ...new Set([
      ...legacyPros.map((p) => p.id),
      ...members.map((m) => m.professionalId).filter(Boolean),
    ]),
  ];
};

/** Build a Map of firmId -> [professionalId, ...] for a set of firms. */
const buildFirmProfessionalMap = async (firms) => {
  const map = new Map();
  for (const f of firms) map.set(f.id, []);
  const ids = firms.map((f) => f.id);
  if (ids.length === 0) return map;

  const [legacyPros, members] = await Promise.all([
    Professional.findAll({
      where: { firmId: { [Op.in]: ids } },
      attributes: ['id', 'firmId'],
      raw: true,
    }),
    FirmMember.findAll({
      where: { firmId: { [Op.in]: ids } },
      attributes: ['firmId', 'professionalId'],
      raw: true,
    }),
  ]);
  for (const p of legacyPros) {
    const arr = map.get(p.firmId);
    if (arr && p.id) arr.push(p.id);
  }
  for (const m of members) {
    const arr = map.get(m.firmId);
    if (arr && m.professionalId) arr.push(m.professionalId);
  }
  // De-duplicate each firm's professional list.
  for (const [firmId, arr] of map) {
    map.set(firmId, [...new Set(arr)]);
  }
  return map;
};

/**
 * Overwrite each firm's `rating` / `reviewsCount` with the collective review
 * stats of every professional working under it (firms have no reviews of
 * their own), and `professionalCount` with the exact number of professionals.
 */
const applyReviewStats = async (firms) => {
  if (!Array.isArray(firms) || firms.length === 0) return firms;
  const groupMap = await buildFirmProfessionalMap(firms);
  const stats = await reviewStats.getFirmStatsForGroups(groupMap);
  for (const f of firms) {
    const s = stats.get(f.id);
    f.reviewsCount = s ? s.count : 0;
    f.rating = s ? s.average : 0;
    // Exact professional count — the firm's actual resolved members.
    f.professionalCount = (groupMap.get(f.id) || []).length;
  }
  return firms;
};

/** Apply collective review stats to a single firm detail object. */
const applyOneReviewStats = async (item) => {
  if (item && item.id) await applyReviewStats([item]);
  return item;
};

// Default pagination for the unified firm listing (page 1, 12 per page).
const LISTING_DEFAULT_LIMIT = 12;

const toArray = (v) => (Array.isArray(v) ? v : []);
const toNum = (v) => {
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
};

// Pick the live value when it is meaningfully present, else the legacy value.
const pickLive = (liveVal, legacyVal) =>
  liveVal !== undefined && liveVal !== null && liveVal !== ''
    ? liveVal
    : legacyVal;

/**
 * Map a legacy `firms` row into the unified firm listing shape.
 * When `overlay` ({ user, lawFirm }) is supplied — the live firm account
 * linked to this legacy row — its uploaded logo and edited fields take
 * precedence, so profile changes surface in listings immediately.
 */
const normalizeLegacyFirm = (f, overlay = null) => {
  const lawFirm = overlay && overlay.lawFirm;
  return {
    id: f.id,
    source: 'legacy',
    firmName: pickLive(lawFirm && lawFirm.firmName, f.name) || '',
    logo: (lawFirm && lawFirm.logo) || null,
    firmType: f.firmType || '',
    city: pickLive(lawFirm && lawFirm.headquarters, f.city) || '',
    about: pickLive(lawFirm && lawFirm.about, f.description) || '',
    practiceAreas:
      lawFirm && toArray(lawFirm.practiceAreas).length
        ? toArray(lawFirm.practiceAreas)
        : toArray(f.services),
    rating: toNum(f.rating),
    reviewsCount: toNum(f.reviewsCount),
    professionalCount: toNum(f.professionalCount),
  };
};

/**
 * Map a new-model `law_firms` row into the unified firm listing shape.
 * `professionalCount` is supplied by the caller (FirmMember row count).
 */
const normalizeLawFirm = (f, professionalCount = 0) => ({
  id: f.id,
  source: 'profile',
  firmName: f.firmName || '',
  logo: f.logo || null,
  firmType: f.firmType || '',
  city: f.headquarters || '',
  about: f.about || '',
  practiceAreas: toArray(f.practiceAreas),
  rating: toNum(f.rating),
  reviewsCount: toNum(f.reviewsCount),
  professionalCount: toNum(professionalCount),
});

/**
 * Load every ACTIVE new-model law firm, normalized into the unified listing
 * shape with professionalCount derived from FirmMember rows.
 * @returns {Promise<Array>}
 */
const loadLawFirms = async (legacyFirmIds = []) => {
  const firms = await LawFirm.findAll({
    where: { status: 'ACTIVE' },
    raw: true,
  });
  if (firms.length === 0) return [];

  // Drop law firms whose owner is linked to a legacy firm — they appear in
  // the listing as that legacy row with their live data overlaid.
  const legacyIdSet = new Set(legacyFirmIds);
  const ownerIds = [
    ...new Set(firms.map((f) => f.ownerUserId).filter(Boolean)),
  ];
  const owners = ownerIds.length
    ? await User.findAll({ where: { id: { [Op.in]: ownerIds } }, raw: true })
    : [];
  const ownerById = new Map(owners.map((u) => [u.id, u]));
  const visibleFirms = firms.filter((f) => {
    const owner = ownerById.get(f.ownerUserId);
    return !(owner && owner.linkedId && legacyIdSet.has(owner.linkedId));
  });
  if (visibleFirms.length === 0) return [];

  const members = await FirmMember.findAll({
    where: { firmId: { [Op.in]: visibleFirms.map((f) => f.id) } },
    attributes: ['firmId'],
    raw: true,
  });
  const countByFirmId = members.reduce((acc, m) => {
    acc[m.firmId] = (acc[m.firmId] || 0) + 1;
    return acc;
  }, {});

  return visibleFirms.map((f) =>
    normalizeLawFirm(f, countByFirmId[f.id] || 0)
  );
};

/**
 * Load the live firm account linked to each legacy `firms` row. A firm_admin
 * `User` whose `linkedId` equals a legacy firm id owns the live `law_firms`
 * record for that firm, so its uploaded logo and edits override the seed row.
 * @param {string[]} legacyFirmIds
 * @returns {Promise<Map<string,{user,lawFirm}>>}
 */
const loadFirmOverlays = async (legacyFirmIds = []) => {
  const map = new Map();
  if (legacyFirmIds.length === 0) return map;

  const users = await User.findAll({
    where: { linkedId: { [Op.in]: legacyFirmIds }, role: 'firm_admin' },
    raw: true,
  });
  if (users.length === 0) return map;

  const lawFirms = await LawFirm.findAll({
    where: { ownerUserId: { [Op.in]: users.map((u) => u.id) } },
    raw: true,
  });
  const lawFirmByOwner = new Map(lawFirms.map((lf) => [lf.ownerUserId, lf]));

  for (const user of users) {
    const lawFirm = lawFirmByOwner.get(user.id);
    if (lawFirm) map.set(user.linkedId, { user, lawFirm });
  }
  return map;
};

/**
 * Build the normalized member list for a law firm from its FirmMember rows.
 * @param {string} lawFirmId
 * @returns {Promise<Array<{name,role,professionalType}>>}
 */
const loadLawFirmMembers = async (lawFirmId) => {
  const memberRows = await FirmMember.findAll({
    where: { firmId: lawFirmId },
    raw: true,
  });
  if (memberRows.length === 0) return [];

  const detailIds = [
    ...new Set(memberRows.map((m) => m.professionalId).filter(Boolean)),
  ];
  const details = detailIds.length
    ? await ProfessionalDetail.findAll({
        where: { id: { [Op.in]: detailIds } },
        raw: true,
      })
    : [];
  const detailById = new Map(details.map((d) => [d.id, d]));
  const users = await User.findAll({
    where: { id: { [Op.in]: details.map((d) => d.userId).filter(Boolean) } },
    raw: true,
  });
  const userById = new Map(users.map((u) => [u.id, u]));

  return memberRows.map((m) => {
    const detail = detailById.get(m.professionalId);
    const user = detail ? userById.get(detail.userId) : null;
    const name =
      (user && user.fullName) ||
      [user && user.firstName, user && user.lastName]
        .filter(Boolean)
        .join(' ')
        .trim() ||
      (user && user.name) ||
      '';
    return {
      name,
      role: m.role || '',
      professionalType: (detail && detail.professionalType) || '',
    };
  });
};

// Read a numeric query param, returning undefined when absent/invalid.
const numParam = (v) => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
};

/**
 * Unified firm listing. Merges every legacy `firms` row with every ACTIVE
 * new-model `law_firms` row, normalizes them to one shape, then applies
 * filters / sort / pagination in memory.
 * Supported filters: search, city, firmType, minRating; sort: rating.
 * @returns {Promise<{ items, page, limit, total }>}
 */
const list = async ({ filters = {}, page, limit } = {}) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.max(Number(limit) || LISTING_DEFAULT_LIMIT, 1);

  const legacyRows = await Firm.findAll({ raw: true });
  const legacyIds = legacyRows.map((f) => f.id);

  const [overlays, lawFirmRows] = await Promise.all([
    loadFirmOverlays(legacyIds),
    loadLawFirms(legacyIds),
  ]);

  let rows = [
    ...legacyRows.map((f) =>
      normalizeLegacyFirm(f, overlays.get(f.id) || null)
    ),
    ...lawFirmRows,
  ];

  // Replace seed counters with the exact review stats from the database.
  await applyReviewStats(rows);

  const search = filters.search ? String(filters.search).toLowerCase() : '';
  if (search) {
    rows = rows.filter((f) =>
      [f.firmName, f.about]
        .map((s) => String(s || '').toLowerCase())
        .some((s) => s.includes(search))
    );
  }
  if (filters.city) {
    const q = String(filters.city).toLowerCase();
    rows = rows.filter((f) => String(f.city || '').toLowerCase() === q);
  }
  if (filters.firmType) {
    const q = String(filters.firmType).toLowerCase();
    rows = rows.filter((f) => String(f.firmType || '').toLowerCase() === q);
  }
  const minRating = numParam(filters.minRating);
  if (minRating !== undefined) {
    rows = rows.filter((f) => f.rating >= minRating);
  }
  if (filters.sort === 'rating') {
    rows.sort((a, b) => b.rating - a.rating);
  }

  const total = rows.length;
  const offset = (safePage - 1) * safeLimit;
  const items = rows.slice(offset, offset + safeLimit);

  return { items, page: safePage, limit: safeLimit, total };
};

/**
 * Resolve a firm by id from either source and return the full normalized
 * firm detail object. Tries the new-model `law_firms` table first, then
 * falls back to the legacy `firms` table. Returns null if not found.
 */
const getById = async (id) => {
  // 1. New-model: law_firms table.
  const lawFirm = await LawFirm.findByPk(id, { raw: true });
  if (lawFirm) {
    const memberRows = await FirmMember.findAll({
      where: { firmId: lawFirm.id },
      attributes: ['firmId'],
      raw: true,
    });
    const base = normalizeLawFirm(lawFirm, memberRows.length);
    const members = await loadLawFirmMembers(lawFirm.id);

    return applyOneReviewStats({
      ...base,
      website: lawFirm.website || '',
      contactEmail: lawFirm.contactEmail || '',
      contactNumber: lawFirm.contactNumber || '',
      establishedYear: lawFirm.establishedYear || null,
      socialLinks: lawFirm.socialLinks || {},
      members,
    });
  }

  // 2. Legacy: firms table — overlay the linked live firm account if any.
  const firm = await Firm.findByPk(id, { raw: true });
  if (firm) {
    const overlayMap = await loadFirmOverlays([firm.id]);
    const overlay = overlayMap.get(firm.id) || null;
    const overlayFirm = overlay && overlay.lawFirm;
    const base = normalizeLegacyFirm(firm, overlay);
    const members = overlayFirm
      ? await loadLawFirmMembers(overlayFirm.id)
      : [];

    return applyOneReviewStats({
      ...base,
      website: (overlayFirm && overlayFirm.website) || '',
      contactEmail: (overlayFirm && overlayFirm.contactEmail) || firm.email || '',
      contactNumber:
        (overlayFirm && overlayFirm.contactNumber) || firm.phone || '',
      establishedYear: (overlayFirm && overlayFirm.establishedYear) || null,
      socialLinks: (overlayFirm && overlayFirm.socialLinks) || {},
      members,
    });
  }

  return null;
};

/** Get all professionals belonging to a firm. Returns null if firm missing. */
const getProfessionals = async (firmId) => {
  const firm = await Firm.findByPk(firmId);
  if (!firm) return null;
  return Professional.findAll({ where: { firmId }, raw: true });
};

/**
 * Add a new professional under a firm. Creates the Professional record,
 * links it to the firm and updates the firm's professional list/count.
 * Returns null if the firm does not exist.
 */
const addProfessional = async (firmId, data = {}) => {
  const firm = await Firm.findByPk(firmId);
  if (!firm) return null;

  const professional = await Professional.create({
    name: data.name,
    email: (data.email || '').toLowerCase(),
    phone: data.phone,
    professionType: data.professionType,
    specialization: data.specialization,
    city: data.city || firm.city,
    experience: Number(data.experience) || 0,
    languages: Array.isArray(data.languages) ? data.languages : [],
    perMinuteRate: Number(data.perMinuteRate) || 0,
    bio: data.bio,
    registrationNumber: data.registrationNumber,
    firmId: firm.id,
    servicesOffered: Array.isArray(data.servicesOffered)
      ? data.servicesOffered
      : [],
    verified: true,
    status: 'approved',
  });

  const professionalIds = Array.isArray(firm.professionalIds)
    ? [...firm.professionalIds, professional.id]
    : [professional.id];
  await firm.update({
    professionalIds,
    professionalCount: professionalIds.length,
  });

  return professional.get({ plain: true });
};

/**
 * Get clients linked to a firm through cases handled by that firm or by
 * its professionals. Returns null if the firm does not exist.
 */
const getClients = async (firmId) => {
  const firm = await Firm.findByPk(firmId);
  if (!firm) return null;

  const firmProfessionals = await Professional.findAll({
    where: { firmId },
    attributes: ['id'],
    raw: true,
  });
  const firmProfessionalIds = firmProfessionals.map((p) => p.id);

  const relatedCases = await Case.findAll({
    where: {
      [Op.or]: [
        { firmId },
        { professionalId: { [Op.in]: firmProfessionalIds } },
      ],
    },
    attributes: ['clientId'],
    raw: true,
  });
  const clientIds = [
    ...new Set(relatedCases.map((c) => c.clientId).filter(Boolean)),
  ];

  if (clientIds.length === 0) return [];
  return Client.findAll({ where: { id: { [Op.in]: clientIds } }, raw: true });
};

/**
 * Get all cases handled by a firm or its professionals.
 * Returns null if the firm does not exist.
 */
const getCases = async (firmId) => {
  const firm = await Firm.findByPk(firmId);
  if (!firm) return null;

  const firmProfessionals = await Professional.findAll({
    where: { firmId },
    attributes: ['id'],
    raw: true,
  });
  const firmProfessionalIds = firmProfessionals.map((p) => p.id);

  return Case.findAll({
    where: {
      [Op.or]: [
        { firmId },
        { professionalId: { [Op.in]: firmProfessionalIds } },
      ],
    },
    raw: true,
  });
};

module.exports = {
  list,
  getById,
  getProfessionals,
  getFirmProfessionalIds,
  addProfessional,
  getClients,
  getCases,
};
