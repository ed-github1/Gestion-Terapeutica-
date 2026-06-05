/**
 * shared/services/adminService.js
 * HTTP calls for the admin panel. All endpoints require the `admin` role server-side.
 */
import apiClient from '@shared/api/client'

export const adminService = {
  // Stats
  getStats: () => apiClient.get('/admin/stats'),

  // Users
  getUsers: (params = {}) => apiClient.get('/admin/users', { params }),
  getUserById: (id) => apiClient.get(`/admin/users/${id}`),
  setUserStatus: (id, status) =>
    apiClient.patch(`/admin/users/${id}/status`, { status }),
  setUserRole: (id, role) =>
    apiClient.patch(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => apiClient.delete(`/admin/users/${id}`),

  // Subscriptions
  getSubscriptions: (params = {}) =>
    apiClient.get('/admin/subscriptions', { params }),

  // Professionals
  getProfessionals: (params = {}) =>
    apiClient.get('/admin/professionals', { params }),
  getProfessionalById: (id) => apiClient.get(`/admin/professionals/${id}`),
  setKycStatus: (id, status) =>
    apiClient.patch(`/admin/professionals/${id}/kyc`, { status }),
  setProfessionalSuspend: (id, activo) =>
    apiClient.patch(`/admin/professionals/${id}/suspend`, { activo }),

  // Contracts
  getContracts: (params = {}) => apiClient.get('/admin/contracts', { params }),
}
