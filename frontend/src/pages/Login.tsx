import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authApi } from '@/services/api'

interface LoginForm {
  email: string
  password: string
}

export default function Login() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    setError('')
    try {
      await authApi.login(data)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Logo and header */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">PayFlow</h1>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="mt-2 text-slate-600">Sign in to manage your payment reminders</p>
          </div>

          {/* Form */}
          <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email address
                </label>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  type="email"
                  autoComplete="email"
                  className="input"
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <input
                  {...register('password', { required: 'Password is required' })}
                  type="password"
                  autoComplete="current-password"
                  className="input"
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>

            <div className="text-center">
              <p className="text-sm text-slate-600">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-brand-600 hover:text-brand-500 transition-colors">
                  Create one
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Right side - Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 items-center justify-center p-12">
        <div className="max-w-md text-white space-y-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Trusted by growing businesses
            </div>
            <h2 className="text-4xl font-bold leading-tight">
              Simple payment reminders that work
            </h2>
            <p className="text-lg text-brand-100">
              AI drafts polite reminders. You approve. We send. Keep your client relationships strong while getting paid faster.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <div className="text-3xl font-bold">£29</div>
              <div className="text-sm text-brand-100 mt-1">per month</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
              <div className="text-3xl font-bold">100%</div>
              <div className="text-sm text-brand-100 mt-1">human approved</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
