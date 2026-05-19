import apiClient from '@shared/api/client'

export const todoService = {
  getAll: () =>
    apiClient.get('/professional/me/todos'),

  create: (data) =>
    apiClient.post('/professional/me/todos', data),

  update: (todoId, data) =>
    apiClient.patch(`/professional/me/todos/${todoId}`, data),

  remove: (todoId) =>
    apiClient.delete(`/professional/me/todos/${todoId}`),
}
