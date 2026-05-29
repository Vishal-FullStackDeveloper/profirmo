// adminSettingsService — typed wrapper over GET /api/admin/settings and
// PATCH /api/admin/settings/:key.

import { get, patch } from '@/services/api';

function unwrap(response) {
  if (response && Object.prototype.hasOwnProperty.call(response, 'data')) {
    return response.data;
  }
  return response;
}

export async function listSettings() {
  const res = await get('/api/admin/settings');
  const data = unwrap(res);
  return (data && data.items) || [];
}

export async function updateSetting(key, value) {
  const res = await patch(`/api/admin/settings/${key}`, { value });
  return unwrap(res);
}
