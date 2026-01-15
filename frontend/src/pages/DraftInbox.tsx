import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { reminderApi, authApi } from '@/services/api'
import type { ReminderDraft } from '@/types'

export default function DraftInbox() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editingDraft, setEditingDraft] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [sendingDraft, setSendingDraft] = useState<ReminderDraft | null>(null)

  const { data: drafts, isLoading } = useQuery<ReminderDraft[]>('drafts', async () => {
    const res = await reminderApi.getDrafts()
    return res.data
  })

  const approveMutation = useMutation(
    (draftId: string) => reminderApi.approve(draftId),
    {
      onSuccess: () => queryClient.invalidateQueries('drafts'),
    }
  )

  const editMutation = useMutation(
    ({ draftId, text }: { draftId: string; text: string }) =>
      reminderApi.edit(draftId, text),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('drafts')
        setEditingDraft(null)
        setEditText('')
      },
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

  const handleEdit = (draft: ReminderDraft) => {
    setEditingDraft(draft.id)
    setEditText(draft.body_text)
  }

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
                <Link to="/dashboard" className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                  Dashboard
                </Link>
                <Link to="/drafts" className="px-3 py-2 rounded-lg text-sm font-medium bg-slate-50 text-slate-900">
                  Draft Inbox
                </Link>
                <Link to="/upload" className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Draft Inbox</h2>
          <p className="mt-1 text-sm text-slate-600">Review and approve AI-generated payment reminders</p>
        </div>

        {/* Empty State */}
        {!drafts || drafts.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">All caught up</h3>
            <p className="text-slate-600 mb-6">No pending drafts to review</p>
            <Link to="/dashboard" className="btn btn-primary text-sm">
              Back to Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {drafts.map((draft) => (
              <div key={draft.id} className="card overflow-hidden">
                <div className="p-6">
                  {/* Draft Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">{draft.client_name}</h3>
                        {draft.approved && (
                          <span className="badge badge-success">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Approved
                          </span>
                        )}
                        <span className={`badge ${draft.days_overdue > 30 ? 'badge-warning' : 'badge-info'}`}>
                          {draft.days_overdue} days overdue
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">{draft.client_email}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-900">£{Number(draft.amount).toFixed(2)}</div>
                      <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">{draft.tone} tone</div>
                    </div>
                  </div>

                  {/* Draft Body */}
                  {editingDraft === draft.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Edit message</label>
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="input font-normal text-sm"
                          rows={6}
                          placeholder="Write your reminder message..."
                        />
                        <p className="mt-1.5 text-xs text-slate-500">Editing will reset approval status</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => editMutation.mutate({ draftId: draft.id, text: editText })}
                          disabled={editMutation.isLoading}
                          className="btn btn-primary text-sm"
                        >
                          {editMutation.isLoading ? 'Saving...' : 'Save changes'}
                        </button>
                        <button
                          onClick={() => setEditingDraft(null)}
                          className="btn btn-secondary text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{draft.body_text}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {editingDraft !== draft.id && (
                    <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(draft)}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        {!draft.approved && (
                          <button
                            onClick={() => approveMutation.mutate(draft.id)}
                            disabled={approveMutation.isLoading}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 hover:text-emerald-900 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Approve
                          </button>
                        )}
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
                      <button
                        onClick={() => handleSendClick(draft)}
                        disabled={!draft.approved || sendMutation.isLoading}
                        className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Send reminder
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
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
