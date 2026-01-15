# PayFlow Assist

AI-powered payment reminder assistant for small B2B service businesses.

## Overview

PayFlow Assist is an MVP tool that helps small business owners send polite payment reminders to clients. The core principle is: **AI drafts → human approves → system sends**.

### Key Features

- CSV invoice upload
- AI-generated polite payment reminders
- Human approval workflow (no auto-send)
- Email delivery via SMTP/Gmail
- Subscription-based access control
- Complete audit logging

### Core Safety Rules (Hard-Coded)

- No autonomous escalation
- No threatening or legal language
- No messages sent without explicit user approval
- All emails originate from user's email
- Every action is audit-logged

## Tech Stack

### Backend
- Python 3.11
- FastAPI
- SQLAlchemy 2.0
- PostgreSQL
- JWT authentication
- Celery + Redis (background jobs)
- OpenAI API (reminder generation)
- Stripe (subscriptions)

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- React Query
- React Hook Form

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Redis 7+

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your credentials:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/payflow
OPENAI_API_KEY=your-openai-key
STRIPE_SECRET_KEY=sk_test_xxx
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Run database migrations:
```bash
alembic upgrade head
```

6. Start the backend:
```bash
uvicorn app.main:app --reload
```

### Using Docker

```bash
cd backend
docker-compose up
```

This will start:
- PostgreSQL database
- Redis
- FastAPI backend
- Celery worker
- Celery beat (scheduler)

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

Frontend will be available at: http://localhost:3000

Backend API will be available at: http://localhost:8000

## Usage Flow

1. **Register** a new account with business details
2. **Upload invoices** via CSV (client_name, client_email, amount, due_date)
3. **Wait for draft generation** (runs daily, checks invoices 7+ days overdue)
4. **Review drafts** in the Draft Inbox
5. **Edit if needed** (requires re-approval)
6. **Approve** each draft individually
7. **Send** approved reminders

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Logout

### Invoices
- `GET /invoices` - Get all invoices
- `POST /invoices/upload` - Upload CSV

### Reminders
- `GET /reminders/drafts` - Get pending drafts
- `POST /reminders/{id}/approve` - Approve draft
- `POST /reminders/{id}/edit` - Edit draft
- `POST /reminders/{id}/snooze` - Snooze draft
- `POST /reminders/{id}/send` - Send reminder (requires active subscription)
- `DELETE /reminders/{id}` - Delete draft

### Webhooks
- `POST /webhooks/stripe` - Stripe subscription events

## Database Models

### User
- id (UUID)
- email
- password_hash
- business_id
- role (owner/admin)

### Business
- id (UUID)
- name
- industry_type
- timezone
- subscription_status (active/past_due/cancelled)
- stripe_customer_id

### Client
- id (UUID)
- business_id
- name
- email
- sensitivity_level (standard/vip)
- reminders_disabled

### Invoice
- id (UUID)
- client_id
- amount
- due_date
- status (unpaid/paid)
- days_overdue
- external_source (manual/stripe/xero)

### ReminderDraft
- id (UUID)
- invoice_id
- tone (friendly/neutral/firm)
- body_text
- approved
- sent_at
- snoozed_until

### AuditLog
- id (UUID)
- action
- actor_id
- payload_snapshot
- created_at

## Background Jobs

### Daily Jobs (Celery Beat)

1. **Update Days Overdue** - Recalculates days_overdue for all unpaid invoices
2. **Generate Reminder Drafts** - Creates drafts for eligible invoices:
   - Unpaid
   - 7+ days overdue
   - Not VIP client
   - Reminders enabled
   - No pending draft exists

## AI Reminder Generation

### Prompt Rules
- Professional, calm, neutral tone
- Max 100 words
- Plain text only
- No dates, deadlines, or consequences
- No modal verbs ("must", "required")

### Prohibited Language Filter
The AI service automatically rejects and regenerates drafts containing:
- legal, court, breach, default
- final notice, penalty, interest
- action will be taken, lawsuit
- attorney, lawyer, consequences
- must pay, required to pay, demand

## Subscription Enforcement

- Draft generation continues regardless of subscription status
- Sending emails requires active subscription
- Webhook updates subscription status based on Stripe events

## Development

### Running Tests
```bash
cd backend
pytest
```

### Database Migrations
```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

### Frontend Build
```bash
cd frontend
npm run build
```

## Deployment

### Backend (Docker)
```bash
docker build -t payflow-backend .
docker run -p 8000:8000 payflow-backend
```

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy dist/ folder
```

## Environment Variables

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - JWT secret key
- `OPENAI_API_KEY` - OpenAI API key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret

### Optional
- `GMAIL_CLIENT_ID` - Gmail OAuth (future)
- `GMAIL_CLIENT_SECRET` - Gmail OAuth (future)
- `SMTP_USER` - SMTP email
- `SMTP_PASSWORD` - SMTP password

## License

Proprietary - All rights reserved

## Support

For issues and questions, contact support or check the documentation.

## Roadmap (Post-MVP)

- Gmail OAuth integration
- Xero/QuickBooks integration
- SMS reminders
- Payment plan features
- Advanced analytics
- Multi-business support
