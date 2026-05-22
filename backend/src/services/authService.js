const { User, Client, Professional, Firm } = require('../models');
const { signToken } = require('../utils/tokenHelper');

// Build the public view of a user (never expose the password).
const sanitizeUser = (user) => {
  if (!user) return null;
  const plain = typeof user.get === 'function' ? user.get({ plain: true }) : user;
  const { password, ...rest } = plain;
  return rest;
};

// Build a JWT for a given user record.
const issueToken = (user) =>
  signToken({ id: user.id, role: user.role, linkedId: user.linkedId });

/**
 * Authenticate a user with email + plain password (mock comparison).
 * @returns {Promise<{ token: string, user: object }>}
 */
const login = async (email, password) => {
  const normalized = (email || '').toLowerCase();
  const user = await User.findOne({ where: { email: normalized } });
  if (!user || user.password !== password) {
    throw { statusCode: 401, message: 'Invalid email or password' };
  }
  return { token: issueToken(user), user: sanitizeUser(user) };
};

/**
 * Register a new client: creates a Client record and a linked User.
 */
const registerClient = async (data = {}) => {
  const normalized = (data.email || '').toLowerCase();
  const existing = await User.findOne({ where: { email: normalized } });
  if (existing) {
    throw { statusCode: 409, message: 'Email already registered' };
  }

  const client = await Client.create({
    name: data.name,
    email: normalized,
    phone: data.phone,
    city: data.city,
    userType: data.userType || 'individual',
  });

  const user = await User.create({
    name: data.name,
    email: normalized,
    password: data.password,
    role: 'client',
    linkedId: client.id,
  });

  return { token: issueToken(user), user: sanitizeUser(user) };
};

/**
 * Register a new independent professional: creates a Professional record
 * (status 'pending' for admin approval) and a linked User.
 */
const registerProfessional = async (data = {}) => {
  const normalized = (data.email || '').toLowerCase();
  const existing = await User.findOne({ where: { email: normalized } });
  if (existing) {
    throw { statusCode: 409, message: 'Email already registered' };
  }

  const professional = await Professional.create({
    name: data.name,
    email: normalized,
    phone: data.phone,
    professionType: data.professionType,
    specialization: data.specialization,
    city: data.city,
    experience: Number(data.experience) || 0,
    languages: Array.isArray(data.languages) ? data.languages : [],
    perMinuteRate: Number(data.perMinuteRate) || 0,
    bio: data.bio,
    registrationNumber: data.registrationNumber,
    servicesOffered: Array.isArray(data.servicesOffered)
      ? data.servicesOffered
      : [],
    verified: false,
    status: 'pending',
  });

  const user = await User.create({
    name: data.name,
    email: normalized,
    password: data.password,
    role: 'professional',
    linkedId: professional.id,
  });

  return { token: issueToken(user), user: sanitizeUser(user) };
};

/**
 * Register a new firm: creates a Firm record and a linked firm_admin User.
 */
const registerFirm = async (data = {}) => {
  const normalized = (data.email || '').toLowerCase();
  const existing = await User.findOne({ where: { email: normalized } });
  if (existing) {
    throw { statusCode: 409, message: 'Email already registered' };
  }

  const firm = await Firm.create({
    name: data.name,
    firmType: data.firmType || 'Legal Firm',
    city: data.city,
    address: data.address,
    email: normalized,
    phone: data.phone,
    services: Array.isArray(data.services) ? data.services : [],
    description: data.description,
    adminName: data.adminName || data.name,
  });

  const user = await User.create({
    name: data.adminName || data.name,
    email: normalized,
    password: data.password,
    role: 'firm_admin',
    linkedId: firm.id,
    firmId: firm.id,
  });

  return { token: issueToken(user), user: sanitizeUser(user) };
};

/**
 * Fetch the current user (sanitized) by id.
 */
const getCurrentUser = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw { statusCode: 404, message: 'User not found' };
  }
  return sanitizeUser(user);
};

module.exports = {
  login,
  registerClient,
  registerProfessional,
  registerFirm,
  getCurrentUser,
};
