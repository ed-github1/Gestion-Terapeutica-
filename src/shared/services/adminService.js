/**
 * shared/services/adminService.js
 * HTTP calls for the admin panel. All endpoints require the `admin` role server-side.
 */
import apiClient from '@shared/api/client'

export const adminService = {
  // ── Overview ──────────────────────────────────────────────────────────────
  /** GET /admin/stats — platform-wide counters & KPIs */
  getStats: () => apiClient.get('/admin/stats'),

  // ── Users ─────────────────────────────────────────────────────────────────
  /**
   * GET /admin/users
   * @param {{ page?, limit?, search?, role?, status? }} params
   */
  getUsers: (params = {}) => apiClient.get('/admin/users', { params }),

  /** GET /admin/users/:id */
  getUserById: (id) => apiClient.get(`/admin/users/${id}`),

  /**
   * PATCH /admin/users/:id/status
   * @param {string} id
   * @param {'active'|'inactive'} status
   */
  setUserStatus: (id, status) =>
    apiClient.patch(`/admin/users/${id}/status`, { status }),

  /**
   * PATCH /admin/users/:id/role
   * @param {string} id
   * @param {string} role
   */
  setUserRole: (id, role) =>
    apiClient.patch(`/admin/users/${id}/role`, { role }),

  /** DELETE /admin/users/:id — soft-delete */
  deleteUser: (id) => apiClient.delete(`/admin/users/${id}`),

  // ── Subscriptions ─────────────────────────────────────────────────────────
  /** GET /admin/subscriptions */
  getSubscriptions: (params = {}) =>
    apiClient.get('/admin/subscriptions', { params }),
}
