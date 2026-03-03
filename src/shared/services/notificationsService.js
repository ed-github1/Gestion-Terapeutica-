/**
 * shared/services/notificationsService.js
 * In-app notifications — backed by the server-side Notification model.
 */
import apiClient from '@shared/api/client'

export const notificationsService = {
  /** GET /notifications — returns unread notifications for the logged-in user */
  getUnread: () =>
    apiClient.get('/notifications'),

  /** PATCH /notifications/:id/read — mark one notification as read */
  markRead: (id) =>
    apiClient.patch(`/notifications/${id}/read`),

  /** PATCH /notifications/read-all — mark all as read */
  markAllRead: () =>
    apiClient.patch('/notifications/read-all'),
}
