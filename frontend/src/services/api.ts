import axios from 'axios'
import type { Invoice, ReminderDraft } from '@/types'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

export const authApi = {
  register: (data: { email: string; password: string; business_name: string; industry_type: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  logout: () =>
    api.post('/auth/logout'),

  refresh: () =>
    api.post('/auth/refresh'),
}

export const invoiceApi = {
  getAll: () =>
    api.get<Invoice[]>('/invoices'),

  upload: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/invoices/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export const reminderApi = {
  getDrafts: () =>
    api.get<ReminderDraft[]>('/reminders/drafts'),

  approve: (draftId: string) =>
    api.post(`/reminders/${draftId}/approve`),

  edit: (draftId: string, body_text: string) =>
    api.post(`/reminders/${draftId}/edit`, { body_text }),

  snooze: (draftId: string, days: number) =>
    api.post(`/reminders/${draftId}/snooze`, { days }),

  send: (draftId: string) =>
    api.post(`/reminders/${draftId}/send`),

  delete: (draftId: string) =>
    api.delete(`/reminders/${draftId}`),
}

export default api
