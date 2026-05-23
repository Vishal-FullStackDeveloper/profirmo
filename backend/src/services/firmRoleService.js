// Firm-role / permission helpers for the Profirmo backend (Phase 8).
//
// Standardized firm_members.role values: 'owner' | 'co-owner' | 'member'.
// resolveFirmContext() answers "which firm does this user belong to and what
// is their role" given a user id, looking at firm ownership first and then
// firm membership. Permission helpers turn that role into yes/no answers.

const { LawFirm, FirmMember, ProfessionalDetail } = require('../models');

// Convert a Sequelize instance (or null) to a plain object (or null).
const plain = (record) =>
  record && typeof record.get === 'function'
    ? record.get({ plain: true })
    : record || null;

/**
 * Resolve the firm a user belongs to and their role within it.
 *
 * A user is associated with a firm in one of two ways:
 *   1. They own the firm (law_firms.ownerUserId) -> role 'owner'.
 *   2. They are a firm member (firm_members via their ProfessionalDetail) ->
 *      role from the firm_members row ('owner' | 'co-owner' | 'member').
 *
 * @param {string} userId
 * @returns {Promise<{
 *   lawFirm: object|null,
 *   member: object|null,
 *   role: string|null,
 *   isOwner: boolean,
 *   professionalDetail: object|null,
 * }>}
 */
async function resolveFirmContext(userId) {
  const empty = {
    lawFirm: null,
    member: null,
    role: null,
    isOwner: false,
    professionalDetail: null,
  };
  if (!userId) return empty;

  const professionalDetail = await ProfessionalDetail.findOne({
    where: { userId },
  });

  // 1. Firm ownership takes precedence.
  const ownedFirm = await LawFirm.findOne({ where: { ownerUserId: userId } });
  if (ownedFirm) {
    let member = null;
    if (professionalDetail) {
      member = await FirmMember.findOne({
        where: { firmId: ownedFirm.id, professionalId: professionalDetail.id },
      });
    }
    return {
      lawFirm: plain(ownedFirm),
      member: plain(member),
      role: 'owner',
      isOwner: true,
      professionalDetail: plain(professionalDetail),
    };
  }

  // 2. Otherwise look for a firm membership.
  if (professionalDetail) {
    const member = await FirmMember.findOne({
      where: { professionalId: professionalDetail.id, status: 'active' },
    });
    if (member) {
      const lawFirm = await LawFirm.findByPk(member.firmId);
      return {
        lawFirm: plain(lawFirm),
        member: plain(member),
        role: member.role || 'member',
        isOwner: false,
        professionalDetail: plain(professionalDetail),
      };
    }
  }

  return { ...empty, professionalDetail: plain(professionalDetail) };
}

// --- Permission predicates (role -> capability) ----------------------------
// owner    : full control.
// co-owner : invite, cancel invitations, remove members.
// member   : read-only.

const canManageFirm = (role) => role === 'owner';
const canEditFirm = (role) => role === 'owner';
const canDeleteFirm = (role) => role === 'owner';
const canInvite = (role) => role === 'owner' || role === 'co-owner';
const canCancelInvitations = (role) => role === 'owner' || role === 'co-owner';
const canRemoveMembers = (role) => role === 'owner' || role === 'co-owner';
const canChangeRoles = (role) => role === 'owner';

module.exports = {
  resolveFirmContext,
  canManageFirm,
  canEditFirm,
  canDeleteFirm,
  canInvite,
  canCancelInvitations,
  canRemoveMembers,
  canChangeRoles,
};
