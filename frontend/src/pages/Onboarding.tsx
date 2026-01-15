import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from 'react-query'
import { invoiceApi } from '@/services/api'

export default function Onboarding() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [uploadResult, setUploadResult] = useState<any>(null)

  const uploadMutation = useMutation(
    (file: File) => invoiceApi.upload(file),
    {
      onSuccess: (response) => {
        setUploadResult(response.data)
        queryClient.invalidateQueries('invoices')
      },
    }
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setUploadResult(null)
    }
  }

  const handleUpload = () => {
    if (file) {
      uploadMutation.mutate(file)
    }
  }

  const handleFinish = () => {
    navigate('/app/dashboard')
  }

  const handleSkip = () => {
    navigate('/app/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-slate-900">PayFlow</span>
            </div>
            <button
              onClick={handleSkip}
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Welcome to PayFlow</h1>
          <p className="text-lg text-slate-600">Let's get you set up with your first invoices</p>
        </div>

        {/* Upload Section */}
        <div className="card p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Upload your invoices</h2>

          <div className="mb-6">
            <p className="text-sm text-slate-600 mb-4">
              Upload a CSV file with your unpaid invoices. We'll start generating reminders for any that are overdue.
            </p>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-xs font-medium text-slate-700 mb-2">Required columns:</p>
              <code className="text-xs text-slate-600">
                client_name, client_email, amount, due_date
              </code>
            </div>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Select CSV file
            </label>
            <div className="flex items-center gap-3">
              <label className="btn btn-secondary cursor-pointer flex-shrink-0">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                Choose file
              </label>
              {file && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              )}
            </div>
          </div>

          {/* Upload Button */}
          {file && !uploadResult && (
            <button
              onClick={handleUpload}
              disabled={uploadMutation.isLoading}
              className="btn btn-primary w-full mb-4"
            >
              {uploadMutation.isLoading ? 'Uploading...' : 'Upload invoices'}
            </button>
          )}

          {/* Upload Result */}
          {uploadResult && (
            <div className={`mb-6 rounded-xl border p-4 ${
              uploadResult.failed > 0
                ? 'bg-amber-50 border-amber-200'
                : 'bg-emerald-50 border-emerald-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  uploadResult.failed > 0 ? 'bg-amber-100' : 'bg-emerald-100'
                }`}>
                  {uploadResult.failed > 0 ? (
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
                    uploadResult.failed > 0 ? 'text-amber-900' : 'text-emerald-900'
                  }`}>
                    {uploadResult.failed > 0 ? 'Upload completed with some errors' : 'Upload successful!'}
                  </p>
                  <p className={`text-sm ${
                    uploadResult.failed > 0 ? 'text-amber-700' : 'text-emerald-700'
                  }`}>
                    Imported {uploadResult.success} invoice{uploadResult.success !== 1 ? 's' : ''}
                    {uploadResult.failed > 0 && ` • ${uploadResult.failed} failed`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Finish Button */}
          {uploadResult && uploadResult.success > 0 && (
            <button
              onClick={handleFinish}
              className="btn btn-primary w-full"
            >
              Finish setup
            </button>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-600">
            Don't have invoices ready?{' '}
            <button onClick={handleSkip} className="text-brand-600 hover:text-brand-700 font-medium">
              Skip this step
            </button>
            {' '}and upload them later
          </p>
        </div>

        {/* Example */}
        <div className="mt-8 card p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Example CSV format</h3>
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            <pre className="text-xs text-slate-600 overflow-x-auto">
{`client_name,client_email,amount,due_date
ABC Company,contact@abc.com,850.00,2024-01-15
XYZ Ltd,billing@xyz.co.uk,1200.50,2024-01-20`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
