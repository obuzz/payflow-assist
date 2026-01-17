import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { reminderApi, authApi } from '@/services/api'
import type { ReminderDraft } from '@/types'

export default function DraftInbox() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [sendingDraft, setSendingDraft] = useState<ReminderDraft | null>(null)
  const [copiedDraftId, setCopiedDraftId] = useState<string | null>(null)
  const [markedAsSentId, setMarkedAsSentId] = useState<string | null>(null)

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('all') // all, pending, approved, scheduled
  const [filterEscalation, setFilterEscalation] = useState<string>('all') // all, 1, 2, 3, 4

  const { data: drafts, isLoading } = useQuery<ReminderDraft[]>('drafts', async () => {
    const res = await reminderApi.getDrafts()
    return res.data
  })

  // Apply filters
  const filteredDrafts = drafts?.filter((draft) => {
    // Filter by status (case-insensitive comparison)
    if (filterStatus !== 'all') {
      const draftStatus = draft.status?.toLowerCase()
      if (filterStatus === 'pending' && draftStatus !== 'pending') return false
      if (filterStatus === 'approved' && draftStatus !== 'approved') return false
      if (filterStatus === 'scheduled' && draftStatus !== 'scheduled') return false
      if (filterStatus === 'sent' && draftStatus !== 'sent') return false
    }

    // Filter by escalation level
    if (filterEscalation !== 'all') {
      if (draft.escalation_level !== parseInt(filterEscalation)) return false
    }

    return true
  })

  const approveMutation = useMutation(
    (draftId: string) => reminderApi.approve(draftId),
    {
      onSuccess: () => queryClient.invalidateQueries('drafts'),
    }
  )

  const sendMutation = useMutation(
    (draftId: string) => reminderApi.send(draftId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('drafts')
        setSendingDraft(null)
      },
    }
  )

  const deleteMutation = useMutation(
    (draftId: string) => reminderApi.delete(draftId),
    {
      onSuccess: () => queryClient.invalidateQueries('drafts'),
    }
  )

  const generateDraftsMutation = useMutation(
    async () => {
      const res = await fetch('/api/reminders/generate-drafts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (!res.ok) throw new Error('Failed to generate drafts')
      return res.json()
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('drafts')
      }
    }
  )

  const handleCopyEmail = async (draft: ReminderDraft) => {
    const emailText = `Subject: ${draft.subject}\n\nTo: ${draft.client_email}\n\n${draft.body_text}`

    try {
      await navigator.clipboard.writeText(emailText)
      setCopiedDraftId(draft.id)
      setTimeout(() => setCopiedDraftId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const markAsSentMutation = useMutation(
    (draftId: string) => reminderApi.markAsSent(draftId),
    {
      onSuccess: (_, draftId) => {
        setMarkedAsSentId(draftId)
        setTimeout(() => setMarkedAsSentId(null), 2000)
        queryClient.invalidateQueries('drafts')
      },
    }
  )

  const handleSendClick = (draft: ReminderDraft) => {
    if (!draft.approved) {
      return
    }
    setSendingDraft(draft)
  }

  const confirmSend = () => {
    if (sendingDraft) {
      sendMutation.mutate(sendingDraft.id)
    }
  }

  const handleLogout = async () => {
    await authApi.logout()
    navigate('/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading drafts...</p>
        </div>
      </div>
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
                <Link to="/app/drafts" className="px-3 py-2 rounded-lg text-sm font-medium bg-slate-50 text-slate-900">
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Draft Inbox</h2>
            <p className="mt-1 text-sm text-slate-600">Review and approve AI-generated payment reminders</p>
          </div>

          {/* Always show Generate Drafts button */}
          <button
            onClick={() => generateDraftsMutation.mutate()}
            disabled={generateDraftsMutation.isLoading}
            className="btn btn-primary"
          >
            {generateDraftsMutation.isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Generate Drafts
              </>
            )}
          </button>
        </div>

        {/* Filters & Stats */}
        {drafts && drafts.length > 0 && (
          <div className="mb-6">
            <div className="card p-4">
              <div className="flex flex-wrap items-center gap-4">
                {/* Stats */}
                <div className="flex items-center gap-6 pr-6 border-r border-slate-200">
                  <div>
                    <div className="text-2xl font-bold text-slate-900">{drafts.length}</div>
                    <div className="text-xs text-slate-500">Total Drafts</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-600">
                      {drafts.filter(d => d.status === 'approved' || d.status === 'scheduled').length}
                    </div>
                    <div className="text-xs text-slate-500">Approved</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-600">
                      {drafts.filter(d => d.status === 'pending').length}
                    </div>
                    <div className="text-xs text-slate-500">Pending</div>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-700">Status:</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    >
                      <option value="all">All</option>
                      <option value="pending">Pending</option>
                      <option value="sent">Sent</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-700">Stage:</label>
                    <select
                      value={filterEscalation}
                      onChange={(e) => setFilterEscalation(e.target.value)}
                      className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    >
                      <option value="all">All Stages</option>
                      <option value="1">Stage 1 (Friendly)</option>
                      <option value="2">Stage 2 (Professional)</option>
                      <option value="3">Stage 3 (Firm)</option>
                      <option value="4">Stage 4 (Final)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!filteredDrafts || filteredDrafts.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {drafts && drafts.length > 0 ? 'No drafts match filters' : 'All caught up'}
            </h3>
            <p className="text-slate-600 mb-6">
              {drafts && drafts.length > 0 ? 'Try adjusting your filters' : 'No pending drafts to review'}
            </p>
            <Link to="/app/dashboard" className="btn btn-primary text-sm">
              Back to Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDrafts.map((draft) => {
              // Get escalation color
              const escalationColor =
                draft.escalation_level === 1 ? 'border-l-4 border-l-blue-400' :
                draft.escalation_level === 2 ? 'border-l-4 border-l-blue-600' :
                draft.escalation_level === 3 ? 'border-l-4 border-l-amber-500' :
                draft.escalation_level === 4 ? 'border-l-4 border-l-red-600' :
                'border-l-4 border-l-slate-300'

              return (
              <div key={draft.id} className={`card overflow-hidden ${escalationColor}`}>
                <div className="p-6">
                  {/* Draft Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">{draft.client_name}</h3>

                        {/* Status Badge */}
                        {draft.status === 'sent' && (
                          <span className="badge badge-success">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Sent
                          </span>
                        )}
                        {draft.status === 'approved' && (
                          <span className="badge badge-success">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Approved
                          </span>
                        )}
                        {draft.status === 'scheduled' && (
                          <span className="badge badge-info">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            Scheduled
                          </span>
                        )}

                        {/* Escalation Level Badge */}
                        {draft.escalation_level && (
                          <span className={`badge ${
                            draft.escalation_level === 1 ? 'badge-info' :
                            draft.escalation_level === 2 ? 'bg-blue-100 text-blue-700' :
                            draft.escalation_level === 3 ? 'badge-warning' :
                            'bg-red-100 text-red-700'
                          }`}>
                            Stage {draft.escalation_level}
                          </span>
                        )}

                        <span className={`badge ${draft.days_overdue > 30 ? 'badge-warning' : 'badge-info'}`}>
                          {draft.days_overdue} days overdue
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">{draft.client_email}</p>
                      {draft.subject && (
                        <p className="text-sm font-medium text-slate-700 mt-1">Subject: {draft.subject}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-900">£{Number(draft.amount).toFixed(2)}</div>
                      <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">{draft.tone} tone</div>
                    </div>
                  </div>

                  {/* Draft Body */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{draft.body_text}</p>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex gap-2">
                        <button
                          onClick={() => deleteMutation.mutate(draft.id)}
                          disabled={deleteMutation.isLoading}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-900 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCopyEmail(draft)}
                          className="btn btn-secondary"
                        >
                          {copiedDraftId === draft.id ? (
                            <>
                              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Copied!
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Copy Email
                            </>
                          )}
                        </button>
                        {draft.status !== 'sent' ? (
                          <button
                            onClick={() => markAsSentMutation.mutate(draft.id)}
                            disabled={markAsSentMutation.isLoading}
                            className="btn btn-primary"
                          >
                            {markAsSentMutation.isLoading ? (
                              <>
                                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Marking as Sent...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Mark as Sent
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Sent
                          </span>
                        )}
                      </div>
                    </div>
                </div>
              </div>
              )
            })}
          </div>
        )}

        {/* Send Confirmation Modal */}
        {sendingDraft && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="card max-w-md w-full p-6 shadow-soft-lg">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">Send payment reminder?</h3>
                  <p className="text-sm text-slate-600">
                    This will email the reminder to <span className="font-medium text-slate-900">{sendingDraft.client_email}</span>. This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Preview</p>
                <p className="text-sm text-slate-700 leading-relaxed">{sendingDraft.body_text.substring(0, 150)}...</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={confirmSend}
                  disabled={sendMutation.isLoading}
                  className="btn btn-primary flex-1"
                >
                  {sendMutation.isLoading ? 'Sending...' : 'Send email'}
                </button>
                <button
                  onClick={() => setSendingDraft(null)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
