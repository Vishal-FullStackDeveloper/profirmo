// appSettingsService — wraps the public + admin App Settings endpoints
// (categories, sub-categories, cities). Every call returns the parsed `data`
// object from the API envelope.
//
// Public reads (listCategories, listCities) require no auth.
// Admin CRUD endpoints require a `platform_admin` token, attached by api.js.

import { get, post, patch, del } from '@/services/api';

function unwrap(response) {
  if (response && Object.prototype.hasOwnProperty.call(response, 'data')) {
    return response.data;
  }
  return response;
}

// --- Public reads ---------------------------------------------------------

/**
 * GET /api/app-settings/categories
 * @returns {Promise<Array<{id, name, slug, subCategories: Array}>>}
 */
export async function listCategories() {
  const res = await get('/api/app-settings/categories');
  return unwrap(res) || [];
}

/**
 * GET /api/app-settings/cities
 * @returns {Promise<Array<{id, name, slug}>>}
 */
export async function listCities() {
  const res = await get('/api/app-settings/cities');
  return unwrap(res) || [];
}

// --- Admin: categories ----------------------------------------------------

export async function adminListCategories(params = {}) {
  const res = await get('/api/admin/categories', { params });
  return unwrap(res) || [];
}

export async function adminCreateCategory(data) {
  const res = await post('/api/admin/categories', data);
  return unwrap(res);
}

export async function adminUpdateCategory(id, data) {
  const res = await patch(`/api/admin/categories/${id}`, data);
  return unwrap(res);
}

export async function adminDeleteCategory(id) {
  const res = await del(`/api/admin/categories/${id}`);
  return unwrap(res);
}

// --- Admin: sub-categories ------------------------------------------------

export async function adminCreateSubCategory(data) {
  const res = await post('/api/admin/sub-categories', data);
  return unwrap(res);
}

export async function adminUpdateSubCategory(id, data) {
  const res = await patch(`/api/admin/sub-categories/${id}`, data);
  return unwrap(res);
}

export async function adminDeleteSubCategory(id) {
  const res = await del(`/api/admin/sub-categories/${id}`);
  return unwrap(res);
}

// --- Admin: cities --------------------------------------------------------

export async function adminListCities(params = {}) {
  const res = await get('/api/admin/cities', { params });
  return unwrap(res) || [];
}

export async function adminCreateCity(data) {
  const res = await post('/api/admin/cities', data);
  return unwrap(res);
}

export async function adminUpdateCity(id, data) {
  const res = await patch(`/api/admin/cities/${id}`, data);
  return unwrap(res);
}

export async function adminDeleteCity(id) {
  const res = await del(`/api/admin/cities/${id}`);
  return unwrap(res);
}

export default {
  listCategories,
  listCities,
  adminListCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  adminCreateSubCategory,
  adminUpdateSubCategory,
  adminDeleteSubCategory,
  adminListCities,
  adminCreateCity,
  adminUpdateCity,
  adminDeleteCity,
};
