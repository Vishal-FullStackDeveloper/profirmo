// reviewStats — aggregate the real review count + average rating straight
// from the `reviews` table, so listings and profiles always reflect the
// exact reviews stored in the database (never stale seed counters).
//
// Only PUBLISHED reviews count: a review hidden while under appeal does not
// affect any public rating until an admin resolves the appeal.

const { fn, col, Op } = require('sequelize');
const { Review } = require('../models');

const PUBLISHED = 'PUBLISHED';
const round1 = (n) => Math.round(n * 10) / 10;

/**
 * Aggregate review count + average rating per professional id.
 * @param {string[]} ids
 * @returns {Promise<Map<string,{count:number,average:number}>>}
 */
const getProfessionalStats = async (ids) => {
  const map = new Map();
  const unique = [...new Set((ids || []).filter(Boolean))];
  if (unique.length === 0) return map;

  const rows = await Review.findAll({
    where: { professionalId: { [Op.in]: unique }, status: PUBLISHED },
    attributes: [
      'professionalId',
      [fn('COUNT', col('id')), 'count'],
      [fn('AVG', col('rating')), 'average'],
    ],
    group: ['professionalId'],
    raw: true,
  });

  for (const r of rows) {
    const id = r.professionalId;
    if (!id) continue;
    const count = Number(r.count) || 0;
    map.set(id, {
      count,
      average: count > 0 ? round1(Number(r.average) || 0) : 0,
    });
  }
  return map;
};

/**
 * Aggregate review stats for firms. A firm has no reviews of its own — its
 * rating is the collective rating of all professionals working under it.
 * @param {Map<string,string[]>} groupMap - firmId -> [professionalId, ...]
 * @returns {Promise<Map<string,{count:number,average:number}>>}
 */
const getFirmStatsForGroups = async (groupMap) => {
  const result = new Map();
  for (const id of groupMap.keys()) result.set(id, { count: 0, average: 0 });

  const allProfIds = [
    ...new Set([].concat(...[...groupMap.values()]).filter(Boolean)),
  ];
  if (allProfIds.length === 0) return result;

  const rows = await Review.findAll({
    where: { professionalId: { [Op.in]: allProfIds }, status: PUBLISHED },
    attributes: ['professionalId', 'rating'],
    raw: true,
  });

  const byProf = new Map();
  for (const r of rows) {
    const arr = byProf.get(r.professionalId) || [];
    arr.push(Number(r.rating) || 0);
    byProf.set(r.professionalId, arr);
  }

  for (const [firmId, profIds] of groupMap) {
    let sum = 0;
    let count = 0;
    for (const pid of profIds) {
      for (const rating of byProf.get(pid) || []) {
        sum += rating;
        count += 1;
      }
    }
    result.set(firmId, {
      count,
      average: count > 0 ? round1(sum / count) : 0,
    });
  }
  return result;
};

module.exports = { getProfessionalStats, getFirmStatsForGroups };
