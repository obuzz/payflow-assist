import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const faqs = [
    {
      question: 'Will this email clients automatically?',
      answer: 'No. Every message requires your approval. Nothing is sent without you explicitly clicking send.'
    },
    {
      question: 'Can I edit the reminder text?',
      answer: 'Yes. You can edit every message before sending. The AI provides a starting point, but you have full control over what gets sent.'
    },
    {
      question: 'Is this debt collection software?',
      answer: 'No. This is for polite, professional reminders only. We specifically prohibit threatening or legal language.'
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes. There is no long-term contract. Cancel your subscription at any time from the settings page.'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-lg font-bold text-slate-900">PayFlow</span>
            </div>
            <Link to="/login" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 tracking-tight mb-6">
            Stop thinking about<br />chasing invoices.
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            We draft polite payment reminders for small B2B service businesses — so you don't have to.
          </p>
          <Link
            to="/signup"
            className="inline-block px-8 py-3.5 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 transition-colors shadow-sm"
          >
            Start free trial
          </Link>
          <p className="mt-4 text-sm text-slate-500">
            No messages are sent without your approval.
          </p>
        </div>
      </section>

      {/* Problem / Relief Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-6 bg-white rounded-xl border border-slate-200">
              <div className="w-2 h-2 bg-slate-400 rounded-full mt-2 flex-shrink-0" />
              <p className="text-lg text-slate-700">Writing the same reminder email every month</p>
            </div>
            <div className="flex items-start gap-4 p-6 bg-white rounded-xl border border-slate-200">
              <div className="w-2 h-2 bg-slate-400 rounded-full mt-2 flex-shrink-0" />
              <p className="text-lg text-slate-700">Wondering if you sound too pushy — or too soft</p>
            </div>
            <div className="flex items-start gap-4 p-6 bg-white rounded-xl border border-slate-200">
              <div className="w-2 h-2 bg-slate-400 rounded-full mt-2 flex-shrink-0" />
              <p className="text-lg text-slate-700">Putting it off because it's uncomfortable</p>
            </div>
          </div>
          <p className="mt-8 text-center text-slate-600 text-lg">
            This is a small problem that creates constant friction. We remove it.
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-semibold text-slate-700">1</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Upload invoices or connect your system</h3>
              <p className="text-slate-600">Import your unpaid invoices via CSV or connect your accounting software.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-semibold text-slate-700">2</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">We draft polite payment reminders</h3>
              <p className="text-slate-600">Our system generates professional, appropriate reminders for overdue invoices.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-semibold text-slate-700">3</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">You approve — we send</h3>
              <p className="text-slate-600">Review each reminder, edit if needed, and send with a single click.</p>
            </div>
          </div>
          <p className="mt-12 text-center text-slate-600">
            Nothing is sent automatically. You approve every message.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Features</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-brand-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Draft-only by default</h3>
                <p className="text-sm text-slate-600">All reminders start as drafts requiring your approval.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-brand-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">You approve every reminder</h3>
                <p className="text-sm text-slate-600">Nothing sends without your explicit confirmation.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-brand-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Sent from your email address</h3>
                <p className="text-sm text-slate-600">Reminders come from you, maintaining your relationship.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-brand-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-brand-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Clear history of what was sent</h3>
                <p className="text-sm text-slate-600">Complete audit trail of all communications.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Pricing</h2>
          <div className="inline-block mt-8">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-soft">
              <div className="text-5xl font-bold text-slate-900 mb-2">£29<span className="text-2xl text-slate-600">/month</span></div>
              <p className="text-slate-600 mb-2">14-day free trial</p>
              <p className="text-sm text-slate-500 mb-6">Cancel anytime</p>
              <Link
                to="/signup"
                className="inline-block px-8 py-3 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 transition-colors"
              >
                Start free trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Frequently asked questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-slate-900">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-slate-400 transition-transform ${openFaq === index ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4 text-slate-600">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">
            Ready to stop thinking about invoices?
          </h2>
          <Link
            to="/signup"
            className="inline-block px-8 py-3.5 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-700 transition-colors shadow-sm"
          >
            Start free trial
          </Link>
          <p className="mt-4 text-sm text-slate-500">
            14-day free trial • No credit card required during trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex justify-between items-center text-sm text-slate-600">
          <div>© 2024 PayFlow. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-900">Privacy</a>
            <a href="#" className="hover:text-slate-900">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
