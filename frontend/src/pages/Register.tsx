import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authApi } from '@/services/api'

interface RegisterForm {
  email: string
  password: string
  business_name: string
  industry_type: string
}

export default function Register() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>()

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    setError('')
    try {
      await authApi.register(data)
      navigate('/login')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
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
            <h2 className="text-3xl font-bold tracking-tight">Start your free trial</h2>
            <p className="mt-2 text-slate-600">Create your account and get your first reminders ready in minutes</p>
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
                  Work email
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
                  placeholder="you@company.com"
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
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters'
                    }
                  })}
                  type="password"
                  autoComplete="new-password"
                  className="input"
                  placeholder="At least 8 characters"
                />
                {errors.password && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="business_name" className="block text-sm font-medium text-slate-700 mb-2">
                  Business name
                </label>
                <input
                  {...register('business_name', { required: 'Business name is required' })}
                  type="text"
                  autoComplete="organization"
                  className="input"
                  placeholder="Acme Ltd"
                />
                {errors.business_name && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.business_name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="industry_type" className="block text-sm font-medium text-slate-700 mb-2">
                  Industry
                </label>
                <select
                  {...register('industry_type', { required: 'Please select your industry' })}
                  className="input"
                >
                  <option value="">Choose your industry</option>
                  <option value="cleaning">Cleaning Services</option>
                  <option value="agency">Marketing/Creative Agency</option>
                  <option value="msp">IT Services & MSP</option>
                  <option value="consulting">Consulting</option>
                  <option value="other">Other Services</option>
                </select>
                {errors.industry_type && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.industry_type.message}</p>
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
                  Creating account...
                </span>
              ) : (
                'Create account'
              )}
            </button>

            <p className="text-xs text-slate-500 text-center">
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </p>

            <div className="text-center pt-2">
              <p className="text-sm text-slate-600">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-brand-600 hover:text-brand-500 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Right side - Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 items-center justify-center p-12">
        <div className="max-w-md text-white space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold leading-tight">
              Get paid faster without the awkwardness
            </h2>
            <p className="text-lg text-brand-100">
              Join service businesses who've recovered thousands in overdue payments while maintaining great client relationships.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: '✓', text: 'AI writes polite, professional reminders' },
              { icon: '✓', text: 'You review and approve every message' },
              { icon: '✓', text: 'Automatic follow-ups for overdue invoices' },
              { icon: '✓', text: 'Complete audit trail of all communications' },
            ].map((feature, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">{feature.icon}</span>
                </div>
                <p className="text-brand-50">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
