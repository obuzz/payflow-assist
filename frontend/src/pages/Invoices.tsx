import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { invoiceApi, authApi } from '@/services/api'
import type { Invoice } from '@/types'

type SortField = 'client_name' | 'amount' | 'due_date' | 'days_overdue'
type SortOrder = 'asc' | 'desc'

export default function Invoices() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [sortField, setSortField] = useState<SortField>('days_overdue')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    client_name: '',
    client_email: '',
    amount: '',
    due_date: ''
  })

  const { data: invoices = [], isLoading } = useQuery('invoices', () =>
    invoiceApi.getAll().then(res => res.data)
  )

  const markPaidMutation = useMutation(
    (invoiceId: string) => invoiceApi.markPaid(invoiceId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('invoices')
        setSelectedInvoice(null)
      }
    }
  )

  const deleteMutation = useMutation(
    (invoiceId: string) => invoiceApi.delete(invoiceId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('invoices')
        setSelectedInvoice(null)
        setShowDeleteConfirm(false)
      }
    }
  )

  const updateMutation = useMutation(
    ({ invoiceId, data }: { invoiceId: string; data: any }) =>
      invoiceApi.update(invoiceId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('invoices')
        setIsEditing(false)
        setSelectedInvoice(null)
      }
    }
  )

  const handleLogout = async () => {
    await authApi.logout()
    navigate('/login')
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const handleEditClick = (invoice: Invoice) => {
    setIsEditing(true)
    setEditForm({
      client_name: invoice.client_name,
      client_email: invoice.client_email,
      amount: invoice.amount.toString(),
      due_date: invoice.due_date
    })
  }

  const handleSaveEdit = () => {
    if (!selectedInvoice) return
    updateMutation.mutate({
      invoiceId: selectedInvoice.id,
      data: editForm
    })
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditForm({
      client_name: '',
      client_email: '',
      amount: '',
      due_date: ''
    })
  }

  // Filter and sort invoices
  const filteredAndSortedInvoices = invoices
    .filter(inv => {
      // Status filter
      if (statusFilter !== 'all' && inv.status !== statusFilter) {
        return false
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesClientName = inv.client_name.toLowerCase().includes(query)
        const matchesClientEmail = inv.client_email.toLowerCase().includes(query)
        const matchesAmount = inv.amount.toString().includes(query)
        const matchesId = inv.id.toLowerCase().includes(query)

        return matchesClientName || matchesClientEmail || matchesAmount || matchesId
      }

      return true
    })
    .sort((a, b) => {
      let aVal: any = a[sortField]
      let bVal: any = b[sortField]

      // Handle string comparison
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }
    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
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
                <Link to="/app/invoices" className="px-3 py-2 rounded-lg text-sm font-medium bg-slate-50 text-slate-900">
                  Invoices
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Invoices</h2>
            <p className="mt-1 text-sm text-slate-600">
              {filteredAndSortedInvoices.length} invoice{filteredAndSortedInvoices.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Link to="/app/invoices/add" className="btn btn-primary">
            Add Invoice
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="card p-4 mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by client name, email, amount, or invoice ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="h-5 w-5 text-slate-400 hover:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-700">Status:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-brand-100 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('unpaid')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  statusFilter === 'unpaid'
                    ? 'bg-brand-100 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Unpaid
              </button>
              <button
                onClick={() => setStatusFilter('paid')}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  statusFilter === 'paid'
                    ? 'bg-brand-100 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Paid
              </button>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="mt-4 text-sm text-slate-600">Loading invoices...</p>
            </div>
          ) : filteredAndSortedInvoices.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-slate-600 mb-4">No invoices found</p>
              <Link to="/app/invoices/add" className="btn btn-primary text-sm">
                Add your first invoice
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('client_name')}
                        className="flex items-center gap-2 text-xs font-medium text-slate-700 uppercase tracking-wider hover:text-slate-900"
                      >
                        Client
                        <SortIcon field="client_name" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('amount')}
                        className="flex items-center gap-2 text-xs font-medium text-slate-700 uppercase tracking-wider hover:text-slate-900"
                      >
                        Amount
                        <SortIcon field="amount" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('due_date')}
                        className="flex items-center gap-2 text-xs font-medium text-slate-700 uppercase tracking-wider hover:text-slate-900"
                      >
                        Due Date
                        <SortIcon field="due_date" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('days_overdue')}
                        className="flex items-center gap-2 text-xs font-medium text-slate-700 uppercase tracking-wider hover:text-slate-900"
                      >
                        Days Overdue
                        <SortIcon field="days_overdue" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAndSortedInvoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedInvoice(invoice)}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{invoice.client_name}</p>
                          <p className="text-sm text-slate-500">{invoice.client_email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-900">£{Number(invoice.amount).toFixed(2)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-900">
                          {new Date(invoice.due_date).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {invoice.days_overdue > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {invoice.days_overdue} days
                          </span>
                        ) : (
                          <span className="text-sm text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          invoice.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {invoice.status === 'paid' ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedInvoice(invoice)
                          }}
                          className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedInvoice(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-soft-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
              <h3 className="text-xl font-bold text-slate-900">Invoice Details</h3>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {isEditing ? (
                /* Edit Mode */
                <>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Client Name</label>
                      <input
                        type="text"
                        value={editForm.client_name}
                        onChange={(e) => setEditForm({ ...editForm, client_name: e.target.value })}
                        className="input w-full"
                        placeholder="Client name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Client Email</label>
                      <input
                        type="email"
                        value={editForm.client_email}
                        onChange={(e) => setEditForm({ ...editForm, client_email: e.target.value })}
                        className="input w-full"
                        placeholder="client@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Amount (£)</label>
                      <input
                        type="text"
                        value={editForm.amount}
                        onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                        className="input w-full"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Due Date</label>
                      <input
                        type="date"
                        value={editForm.due_date}
                        onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                        className="input w-full"
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* View Mode */
                <>
                  {/* Client Info */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Client</h4>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-lg font-semibold text-slate-900">{selectedInvoice.client_name}</p>
                      <p className="text-sm text-slate-600 mt-1">{selectedInvoice.client_email}</p>
                    </div>
                  </div>

                  {/* Invoice Details Grid */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 rounded-xl p-4">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Amount</p>
                        <p className="text-2xl font-bold text-slate-900">£{Number(selectedInvoice.amount).toFixed(2)}</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Status</p>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${
                          selectedInvoice.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {selectedInvoice.status === 'paid' ? 'Paid' : 'Unpaid'}
                        </span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Due Date</p>
                        <p className="text-lg font-semibold text-slate-900">
                          {new Date(selectedInvoice.due_date).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Days Overdue</p>
                        {selectedInvoice.days_overdue > 0 ? (
                          <p className="text-lg font-semibold text-red-600">{selectedInvoice.days_overdue} days</p>
                        ) : (
                          <p className="text-lg font-semibold text-green-600">On time</p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Timeline - only show in view mode */}
              {!isEditing && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Timeline</h4>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">Created</p>
                        <p className="text-sm text-slate-600">
                          {new Date(selectedInvoice.created_at).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 flex justify-between gap-3">
              {!isEditing && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="btn btn-secondary text-red-600 hover:bg-red-50"
                  disabled={deleteMutation.isLoading}
                >
                  Delete Invoice
                </button>
              )}
              <div className="flex gap-3 ml-auto">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      className="btn btn-secondary"
                      disabled={updateMutation.isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="btn btn-primary"
                      disabled={updateMutation.isLoading}
                    >
                      {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEditClick(selectedInvoice)}
                      className="btn btn-secondary"
                    >
                      Edit
                    </button>
                    {selectedInvoice.status === 'unpaid' && (
                      <button
                        onClick={() => markPaidMutation.mutate(selectedInvoice.id)}
                        className="btn btn-primary"
                        disabled={markPaidMutation.isLoading}
                      >
                        {markPaidMutation.isLoading ? 'Marking as Paid...' : 'Mark as Paid'}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedInvoice(null)
                        setIsEditing(false)
                      }}
                      className="btn btn-secondary"
                    >
                      Close
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && selectedInvoice && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-soft-lg max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Delete Invoice</h3>
                  <p className="text-sm text-slate-600 mt-1">This action cannot be undone</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-sm text-slate-700">
                Are you sure you want to delete the invoice for <span className="font-semibold">{selectedInvoice.client_name}</span> (£{Number(selectedInvoice.amount).toFixed(2)})?
              </p>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-secondary"
                disabled={deleteMutation.isLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(selectedInvoice.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                disabled={deleteMutation.isLoading}
              >
                {deleteMutation.isLoading ? 'Deleting...' : 'Delete Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
