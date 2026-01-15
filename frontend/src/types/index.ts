export interface User {
  id: string
  email: string
  business_id: string
  role: string
}

export interface Invoice {
  id: string
  client_id: string
  client_name: string
  client_email: string
  amount: number
  due_date: string
  status: 'unpaid' | 'paid'
  days_overdue: number
  created_at: string
}

export interface ReminderDraft {
  id: string
  invoice_id: string
  client_name: string
  client_email: string
  amount: number
  days_overdue: number
  tone: 'friendly' | 'neutral' | 'firm'
  body_text: string
  approved: boolean
  sent_at: string | null
  snoozed_until: string | null
  created_at: string
}

export interface DashboardStats {
  unpaid_invoices: number
  pending_drafts: number
  avg_days_overdue: number
  total_amount_outstanding: number
}
