/**
 * shared/services/homeworkService.js
 * Homework / therapeutic tasks assigned by professionals to patients.
 *
 * API surface assumed on the backend:
 *   POST   /patients/:id/homework             → create task
 *   GET    /patients/:id/homework             → list all tasks
 *   PUT    /patients/:id/homework/:hwId       → update (edit or mark done)
 *   DELETE /patients/:id/homework/:hwId       → remove task
 */
import apiClient from '@shared/api/client'

export const homeworkService = {
  /**
   * Assign a new homework task to a patient.
   * @param {string} patientId
   * @param {{ title: string, description?: string, dueDate?: string, type?: string }} data
   */
  assign: (patientId, data) =>
    apiClient.post(`/patients/${patientId}/homework`, data),

  /**
   * Fetch all homework tasks for a patient.
   * @param {string} patientId
   */
  getAll: (patientId) =>
    apiClient.get(`/patients/${patientId}/homework`),

  /**
   * Update a homework task (edit fields or toggle completion).
   * @param {string} patientId
   * @param {string} hwId
   * @param {object} data
   */
  update: (patientId, hwId, data) =>
    apiClient.put(`/patients/${patientId}/homework/${hwId}`, data),

  /**
   * Delete a homework task.
   * @param {string} patientId
   * @param {string} hwId
   */
  remove: (patientId, hwId) =>
    apiClient.delete(`/patients/${patientId}/homework/${hwId}`),
}
