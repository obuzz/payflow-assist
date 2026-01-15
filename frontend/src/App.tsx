import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import Onboarding from '@/pages/Onboarding'
import Dashboard from '@/pages/Dashboard'
import DraftInbox from '@/pages/DraftInbox'
import InvoiceUpload from '@/pages/InvoiceUpload'
import AddInvoice from '@/pages/AddInvoice'
import Invoices from '@/pages/Invoices'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* App Routes */}
          <Route path="/app/onboarding" element={<Onboarding />} />
          <Route path="/app/dashboard" element={<Dashboard />} />
          <Route path="/app/drafts" element={<DraftInbox />} />
          <Route path="/app/invoices" element={<Invoices />} />
          <Route path="/app/invoices/add" element={<AddInvoice />} />
          <Route path="/app/upload" element={<InvoiceUpload />} />

          {/* Legacy routes - redirect to new structure */}
          <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/drafts" element={<Navigate to="/app/drafts" replace />} />
          <Route path="/upload" element={<Navigate to="/app/upload" replace />} />
          <Route path="/register" element={<Navigate to="/signup" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App
