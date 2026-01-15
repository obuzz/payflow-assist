import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from 'react-query'
import { invoiceApi, authApi } from '@/services/api'

export default function AddInvoice() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    amount: '',
    due_date: '',
    invoice_number: ''
  })

  const addMutation = useMutation(
    (data: any) => invoiceApi.addManual(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('invoices')
        navigate('/app/dashboard')
      }
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addMutation.mutate(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

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
                <Link to="/app/dashboard" className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                  Dashboard
                </Link>
                <Link to="/app/drafts" className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                  Draft Inbox
                </Link>
                <Link to="/app/upload" className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                  Upload
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Add Invoice</h2>
          <p className="mt-1 text-sm text-slate-600">Manually enter invoice details</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card p-6">
          <div className="space-y-6">
            {/* Client Name */}
            <div>
              <label htmlFor="client_name" className="block text-sm font-medium text-slate-700 mb-2">
                Client Name *
              </label>
              <input
                type="text"
                id="client_name"
                name="client_name"
                required
                value={formData.client_name}
                onChange={handleChange}
                className="input w-full"
                placeholder="e.g., ABC Company Ltd"
              />
            </div>

            {/* Client Email */}
            <div>
              <label htmlFor="client_email" className="block text-sm font-medium text-slate-700 mb-2">
                Client Email *
              </label>
              <input
                type="email"
                id="client_email"
                name="client_email"
                required
                value={formData.client_email}
                onChange={handleChange}
                className="input w-full"
                placeholder="e.g., billing@abccompany.com"
              />
            </div>

            {/* Amount and Due Date Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Amount */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-2">
                  Amount (£) *
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  required
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={handleChange}
                  className="input w-full"
                  placeholder="e.g., 850.00"
                />
              </div>

              {/* Due Date */}
              <div>
                <label htmlFor="due_date" className="block text-sm font-medium text-slate-700 mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  id="due_date"
                  name="due_date"
                  required
                  value={formData.due_date}
                  onChange={handleChange}
                  className="input w-full"
                />
              </div>
            </div>

            {/* Invoice Number (Optional) */}
            <div>
              <label htmlFor="invoice_number" className="block text-sm font-medium text-slate-700 mb-2">
                Invoice Number (optional)
              </label>
              <input
                type="text"
                id="invoice_number"
                name="invoice_number"
                value={formData.invoice_number}
                onChange={handleChange}
                className="input w-full"
                placeholder="e.g., INV-2024-001"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex items-center justify-between gap-4">
            <Link
              to="/app/dashboard"
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={addMutation.isLoading}
              className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addMutation.isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Adding...
                </span>
              ) : (
                'Add Invoice'
              )}
            </button>
          </div>

          {/* Error Message */}
          {addMutation.isError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">
                Failed to add invoice. Please check your details and try again.
              </p>
            </div>
          )}
        </form>

        {/* Alternative Methods */}
        <div className="mt-8 card p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Other ways to add invoices</h3>
          <div className="space-y-3">
            <Link
              to="/app/upload"
              className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Upload CSV</p>
                  <p className="text-xs text-slate-600">Bulk import from spreadsheet</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50 opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">QuickBooks</p>
                  <p className="text-xs text-slate-500">Coming soon</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50 opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Xero</p>
                  <p className="text-xs text-slate-500">Coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
