import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authApi } from '@/services/api'

interface SignupForm {
  email: string
  password: string
  business_name: string
  industry_type: string
}

export default function Signup() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<SignupForm>()

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true)
    setError('')
    try {
      await authApi.register(data)
      // After successful registration, redirect to onboarding
      navigate('/app/onboarding')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-slate-900">PayFlow</span>
            </Link>
            <Link to="/login" className="text-sm text-slate-600 hover:text-slate-900">
              Already have an account? <span className="font-medium">Sign in</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Start your 14-day free trial</h1>
            <p className="text-slate-600">You won't be charged until the trial ends.</p>
          </div>

          {/* Form Card */}
          <div className="card p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {/* Email */}
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

              {/* Password */}
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

              {/* Business Name */}
              <div>
                <label htmlFor="business_name" className="block text-sm font-medium text-slate-700 mb-2">
                  Business name
                </label>
                <input
                  {...register('business_name', { required: 'Business name is required' })}
                  type="text"
                  autoComplete="organization"
                  className="input"
                  placeholder="Your company name"
                />
                {errors.business_name && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.business_name.message}</p>
                )}
              </div>

              {/* Industry */}
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  'Start free trial'
                )}
              </button>

              {/* Terms */}
              <p className="text-xs text-slate-500 text-center">
                By signing up, you agree to our{' '}
                <a href="#" className="text-slate-700 hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-slate-700 hover:underline">Privacy Policy</a>
              </p>
            </form>
          </div>

          {/* Trust Message */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-slate-600">
              <svg className="w-4 h-4 text-brand-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No credit card required for trial</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
