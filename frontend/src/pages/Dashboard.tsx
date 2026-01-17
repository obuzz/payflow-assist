import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { invoiceApi, reminderApi, authApi } from '@/services/api'
import type { Invoice, ReminderDraft } from '@/types'

export default function Dashboard() {
  const navigate = useNavigate()

  const { data: invoices } = useQuery<Invoice[]>('invoices', async () => {
    const res = await invoiceApi.getAll()
    return res.data
  })

  const { data: drafts } = useQuery<ReminderDraft[]>('drafts', async () => {
    const res = await reminderApi.getDrafts()
    return res.data
  })

  const unpaidInvoices = invoices?.filter(inv => inv.status === 'unpaid') || []
  const overdueInvoices = unpaidInvoices.filter(inv => inv.days_overdue > 0)
  const avgDaysOverdue = overdueInvoices.length > 0
    ? Math.round(overdueInvoices.reduce((sum, inv) => sum + inv.days_overdue, 0) / overdueInvoices.length)
    : 0
  const totalOutstanding = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0)

  const handleLogout = async () => {
    await authApi.logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-lg font-bold">PayFlow</h1>
              </div>

              <div className="hidden md:flex items-center space-x-1">
                <Link to="/app/dashboard" className="px-3 py-2 rounded-lg text-sm font-medium bg-slate-50 text-slate-900">
                  Dashboard
                </Link>
                <Link to="/app/drafts" className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                  Draft Inbox
                </Link>
                <Link to="/app/upload" className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                  Upload
                </Link>
                <Link to="/app/settings" className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                  Settings
                </Link>
              </div>
            </div>

            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Overview</h2>
          <p className="mt-1 text-sm text-slate-600">Track your invoices and payment reminders</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <dt className="text-sm font-medium text-slate-600 mb-1">Unpaid Invoices</dt>
            <dd className="text-3xl font-bold text-slate-900">{unpaidInvoices.length}</dd>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <dt className="text-sm font-medium text-slate-600 mb-1">Avg Days Overdue</dt>
            <dd className="text-3xl font-bold text-slate-900">{avgDaysOverdue}</dd>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <dt className="text-sm font-medium text-slate-600 mb-1">Pending Drafts</dt>
            <dd className="text-3xl font-bold text-slate-900">{drafts?.length || 0}</dd>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <dt className="text-sm font-medium text-slate-600 mb-1">Outstanding</dt>
            <dd className="text-3xl font-bold text-slate-900">£{totalOutstanding.toFixed(0)}</dd>
          </div>
        </div>

        {/* Action Banner */}
        {drafts && drafts.length > 0 && (
          <div className="card p-6 border-l-4 border-brand-500 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-900 mb-1">
                  {drafts.length} reminder{drafts.length > 1 ? 's' : ''} ready for review
                </h3>
                <p className="text-sm text-slate-600 mb-3">
                  AI has generated payment reminders for overdue invoices. Review and approve them before sending.
                </p>
                <Link to="/drafts" className="btn btn-primary text-sm">
                  Review drafts
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="card">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Recent Invoices</h3>
            <div className="flex items-center gap-3">
              <Link to="/app/invoices" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                View all
              </Link>
              <Link to="/app/invoices/add" className="btn btn-primary text-sm">
                Add Invoice
              </Link>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {unpaidInvoices.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-slate-600 mb-4">No unpaid invoices</p>
                <Link to="/upload" className="btn btn-primary text-sm">
                  Upload invoices
                </Link>
              </div>
            ) : (
              unpaidInvoices.slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{invoice.client_name}</p>
                      <p className="text-sm text-slate-500 truncate">{invoice.client_email}</p>
                    </div>
                    <div className="ml-4 flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">£{Number(invoice.amount).toFixed(2)}</p>
                        {invoice.days_overdue > 0 && (
                          <p className="text-xs text-amber-600">{invoice.days_overdue} days overdue</p>
                        )}
                      </div>
                      {invoice.days_overdue > 0 ? (
                        <span className="badge badge-warning">Overdue</span>
                      ) : (
                        <span className="badge badge-info">Due</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
