import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from 'react-query'
import { invoiceApi, authApi } from '@/services/api'

export default function InvoiceUpload() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<any>(null)
  const [dragActive, setDragActive] = useState(false)

  const uploadMutation = useMutation(
    (file: File) => invoiceApi.upload(file),
    {
      onSuccess: (response) => {
        setResult(response.data)
        queryClient.invalidateQueries('invoices')
        setFile(null)
      },
      onError: () => {
        setResult({ success: 0, failed: 1, errors: ['Upload failed. Please try again.'] })
      }
    }
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile)
        setResult(null)
      }
    }
  }

  const handleUpload = () => {
    if (file) {
      uploadMutation.mutate(file)
    }
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
                <Link to="/dashboard" className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                  Dashboard
                </Link>
                <Link to="/drafts" className="px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors">
                  Draft Inbox
                </Link>
                <Link to="/upload" className="px-3 py-2 rounded-lg text-sm font-medium bg-slate-50 text-slate-900">
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Upload Invoices</h2>
          <p className="mt-1 text-sm text-slate-600">Import your unpaid invoices from a CSV file</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Upload CSV File</h3>

              {/* Drag & Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                  dragActive
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>

                  {file ? (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-slate-900 mb-1">{file.name}</p>
                      <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-slate-900 mb-1">
                        Drag and drop your CSV file here
                      </p>
                      <p className="text-xs text-slate-500 mb-4">or</p>
                    </>
                  )}

                  <label className="btn btn-secondary text-sm cursor-pointer">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {file ? 'Choose different file' : 'Browse files'}
                  </label>
                </div>
              </div>

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={!file || uploadMutation.isLoading}
                className="btn btn-primary w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadMutation.isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </span>
                ) : (
                  'Upload invoices'
                )}
              </button>

              {/* Results */}
              {result && (
                <div className={`mt-6 rounded-xl border p-4 ${
                  result.failed > 0
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-emerald-50 border-emerald-200'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      result.failed > 0 ? 'bg-amber-100' : 'bg-emerald-100'
                    }`}>
                      {result.failed > 0 ? (
                        <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold mb-1 ${
                        result.failed > 0 ? 'text-amber-900' : 'text-emerald-900'
                      }`}>
                        {result.failed > 0 ? 'Upload completed with errors' : 'Upload successful'}
                      </p>
                      <p className={`text-sm ${
                        result.failed > 0 ? 'text-amber-700' : 'text-emerald-700'
                      }`}>
                        Imported {result.success} invoice{result.success !== 1 ? 's' : ''}
                        {result.failed > 0 && ` • ${result.failed} failed`}
                      </p>
                      {result.errors && result.errors.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {result.errors.map((error: string, idx: number) => (
                            <p key={idx} className="text-xs text-amber-700">{error}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Instructions Sidebar */}
          <div className="space-y-6">
            {/* Format Guide */}
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">CSV Format</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-slate-700 mb-1">Required columns:</p>
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <code className="text-xs text-slate-600 break-all">
                      client_name<br/>
                      client_email<br/>
                      amount<br/>
                      due_date
                    </code>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-700 mb-1">Date formats accepted:</p>
                  <p className="text-xs text-slate-600">YYYY-MM-DD or DD/MM/YYYY</p>
                </div>
              </div>
            </div>

            {/* Example */}
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Example CSV</h3>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 overflow-x-auto">
                <pre className="text-xs text-slate-600">
{`client_name,client_email,amount,due_date
ABC Company,contact@abc.com,850.00,2024-01-15
XYZ Ltd,billing@xyz.co.uk,1200.50,2024-01-20`}
                </pre>
              </div>
            </div>

            {/* Tips */}
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Tips</h3>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Clients are created automatically if they don't exist</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Amounts can include currency symbols (they'll be stripped)</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Overdue days are calculated automatically</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
