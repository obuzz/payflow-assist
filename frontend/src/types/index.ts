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
  tone: 'friendly' | 'professional' | 'firm' | 'formal'
  escalation_level: number // 1-4
  subject?: string
  body_text: string
  status: 'pending' | 'approved' | 'scheduled' | 'sent' | 'failed'
  approved: boolean
  auto_send_at?: string | null
  sent_at: string | null
  delivery_status?: string | null
  snoozed_until: string | null
  created_at: string
}

export interface ReminderSettings {
  id: string
  business_id: string
  auto_send_enabled: boolean
  auto_approve_stage_1: boolean
  stage_1_days: number
  stage_2_days: number
  stage_3_days: number
  stage_4_days: number
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  unpaid_invoices: number
  pending_drafts: number
  avg_days_overdue: number
  total_amount_outstanding: number
}
