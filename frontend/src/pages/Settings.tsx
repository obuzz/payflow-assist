import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { authApi } from '@/services/api'
import type { ReminderSettings } from '@/types'

export default function Settings() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Settings state - simplified for MVP (manual workflow)
  const [stage1Days, setStage1Days] = useState(7)
  const [stage2Days, setStage2Days] = useState(14)
  const [stage3Days, setStage3Days] = useState(30)
  const [stage4Days, setStage4Days] = useState(60)

  // Fetch settings
  const { data: settings, isLoading } = useQuery<ReminderSettings>('reminder-settings', async () => {
    const res = await fetch('/api/reminders/settings', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    if (!res.ok) throw new Error('Failed to fetch settings')
    return res.json()
  })

  // Update form when settings load
  useEffect(() => {
    if (settings) {
      setStage1Days(settings.stage_1_days)
      setStage2Days(settings.stage_2_days)
      setStage3Days(settings.stage_3_days)
      setStage4Days(settings.stage_4_days)
    }
  }, [settings])

  // Save settings mutation
  const saveMutation = useMutation(
    async () => {
      const res = await fetch('/api/reminders/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          auto_send_enabled: false,  // Disabled for MVP
          auto_approve_stage_1: false,  // Disabled for MVP
          stage_1_days: stage1Days,
          stage_2_days: stage2Days,
          stage_3_days: stage3Days,
          stage_4_days: stage4Days
        })
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.detail || 'Failed to save settings')
      }
      return res.json()
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('reminder-settings')
        // Show success message briefly, then redirect
        setTimeout(() => {
          navigate('/app/dashboard')
        }, 1500)
      }
    }
  )

  const handleLogout = async () => {
    await authApi.logout()
    navigate('/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading settings...</p>
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
                <Link to="/app/drafts" className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                  Draft Inbox
                </Link>
                <Link to="/app/settings" className="px-3 py-2 rounded-lg text-sm font-medium bg-slate-50 text-slate-900">
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Reminder Settings</h2>
          <p className="mt-1 text-sm text-slate-600">Configure when each reminder stage triggers based on how long an invoice is overdue</p>
        </div>

        <div className="space-y-6">
          {/* Escalation Timeline */}
          <div className="card p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Escalation Timeline</h3>
              <p className="text-sm text-slate-600 mt-1">
                Configure when each reminder stage triggers based on days overdue
              </p>
            </div>

            <div className="space-y-8">
              {/* Stage 1 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-info">Stage 1</span>
                      <span className="font-medium text-slate-900">Friendly Reminder</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">Gentle, understanding tone for first contact</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-900">{stage1Days}</div>
                    <div className="text-xs text-slate-500">days overdue</div>
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={stage1Days}
                  onChange={(e) => setStage1Days(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>1 day</span>
                  <span>30 days</span>
                </div>
              </div>

              {/* Stage 2 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="badge bg-blue-100 text-blue-700">Stage 2</span>
                      <span className="font-medium text-slate-900">Professional Follow-up</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">More direct, business-like tone</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-900">{stage2Days}</div>
                    <div className="text-xs text-slate-500">days overdue</div>
                  </div>
                </div>
                <input
                  type="range"
                  min={stage1Days + 1}
                  max="60"
                  value={stage2Days}
                  onChange={(e) => setStage2Days(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>{stage1Days + 1} days</span>
                  <span>60 days</span>
                </div>
              </div>

              {/* Stage 3 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-warning">Stage 3</span>
                      <span className="font-medium text-slate-900">Firm Notice</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">Firm tone with potential consequences</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-900">{stage3Days}</div>
                    <div className="text-xs text-slate-500">days overdue</div>
                  </div>
                </div>
                <input
                  type="range"
                  min={stage2Days + 1}
                  max="90"
                  value={stage3Days}
                  onChange={(e) => setStage3Days(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>{stage2Days + 1} days</span>
                  <span>90 days</span>
                </div>
              </div>

              {/* Stage 4 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="badge bg-red-100 text-red-700">Stage 4</span>
                      <span className="font-medium text-slate-900">Final Notice</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">Final warning before collections/legal action</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-900">{stage4Days}</div>
                    <div className="text-xs text-slate-500">days overdue</div>
                  </div>
                </div>
                <input
                  type="range"
                  min={stage3Days + 1}
                  max="120"
                  value={stage4Days}
                  onChange={(e) => setStage4Days(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>{stage3Days + 1} days</span>
                  <span>120 days</span>
                </div>
              </div>
            </div>

            {/* Visual Timeline */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <p className="text-sm font-medium text-slate-700 mb-4">Timeline Preview</p>
              <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="absolute h-full bg-gradient-to-r from-blue-400 to-blue-500"
                  style={{ width: `${(stage1Days / 120) * 100}%` }}
                />
                <div
                  className="absolute h-full bg-gradient-to-r from-blue-500 to-blue-600"
                  style={{ left: `${(stage1Days / 120) * 100}%`, width: `${((stage2Days - stage1Days) / 120) * 100}%` }}
                />
                <div
                  className="absolute h-full bg-gradient-to-r from-amber-500 to-amber-600"
                  style={{ left: `${(stage2Days / 120) * 100}%`, width: `${((stage3Days - stage2Days) / 120) * 100}%` }}
                />
                <div
                  className="absolute h-full bg-gradient-to-r from-red-500 to-red-600"
                  style={{ left: `${(stage3Days / 120) * 100}%`, width: `${((stage4Days - stage3Days) / 120) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>0 days</span>
                <span>120 days</span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between pt-4">
            <Link to="/app/dashboard" className="text-sm text-slate-600 hover:text-slate-900">
              ← Back to Dashboard
            </Link>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isLoading}
              className="btn btn-primary"
            >
              {saveMutation.isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>

          {/* Success/Error Messages */}
          {saveMutation.isSuccess && (
            <div className="card bg-emerald-50 border-emerald-200 p-4">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium text-emerald-900">Settings saved successfully!</p>
              </div>
            </div>
          )}

          {saveMutation.isError && (
            <div className="card bg-red-50 border-red-200 p-4">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium text-red-900">
                  Error: {saveMutation.error instanceof Error ? saveMutation.error.message : 'Failed to save settings'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
