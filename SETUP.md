# PayFlow Assist - Quick Setup Guide

## Step 1: Environment Setup

### Backend Environment

1. Navigate to backend:
```bash
cd backend
```

2. Create `.env` from template:
```bash
cp .env.example .env
```

3. Update `.env` with your credentials:
```env
# Database (use docker-compose DB or your own)
DATABASE_URL=postgresql://user:password@localhost:5432/payflow

# JWT Secret (generate with: openssl rand -hex 32)
SECRET_KEY=your-generated-secret-key

# OpenAI
OPENAI_API_KEY=sk-...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...

# Email (Gmail App Password)
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
```

## Step 2: Database Setup

### Option A: Using Docker (Recommended)

```bash
cd backend
docker-compose up -d db redis
```

### Option B: Local PostgreSQL

Install PostgreSQL 15+ and create database:
```bash
createdb payflow
```

## Step 3: Run Migrations

```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
```

## Step 4: Start Backend

### Development Mode
```bash
uvicorn app.main:app --reload
```

### With Celery (for background jobs)
```bash
# Terminal 1: API
uvicorn app.main:app --reload

# Terminal 2: Celery Worker
celery -A app.jobs.celery_app worker --loglevel=info

# Terminal 3: Celery Beat
celery -A app.jobs.celery_app beat --loglevel=info
```

### Using Docker (All Services)
```bash
docker-compose up
```

## Step 5: Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:3000
Backend: http://localhost:8000
API Docs: http://localhost:8000/docs

## Step 6: Create Test Account

1. Visit http://localhost:3000
2. Click "Register"
3. Fill in:
   - Email: test@example.com
   - Password: password123
   - Business Name: Test Business
   - Industry: Cleaning Services
4. Login with credentials

## Step 7: Test the Flow

1. **Upload Invoices**
   - Go to "Upload" page
   - Download the example CSV or create one:
   ```csv
   client_name,client_email,amount,due_date
   ABC Company,test@example.com,850.00,2024-01-01
   ```
   - Upload the file

2. **Trigger Draft Generation** (Manual for testing)
   ```bash
   # In backend directory
   celery -A app.jobs.celery_app call app.jobs.reminder_tasks.update_days_overdue
   celery -A app.jobs.celery_app call app.jobs.reminder_tasks.generate_reminder_drafts
   ```

3. **Review Drafts**
   - Go to "Draft Inbox"
   - Review AI-generated reminders
   - Edit if needed
   - Approve
   - Send

## Gmail App Password Setup

For sending emails via Gmail SMTP:

1. Go to Google Account settings
2. Enable 2-Factor Authentication
3. Go to Security > App Passwords
4. Generate app password for "Mail"
5. Use the 16-character password in `.env` as `SMTP_PASSWORD`

## Stripe Setup (Optional for MVP Testing)

1. Create Stripe account
2. Get test API keys from Dashboard
3. Create a product and price
4. Add webhook endpoint: `http://localhost:8000/webhooks/stripe`
5. Copy webhook secret

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps
# or
pg_isready
```

### Celery Not Processing Jobs
```bash
# Check Redis connection
redis-cli ping
```

### Frontend API Errors
- Check that backend is running on port 8000
- Check CORS settings in `backend/app/core/config.py`

### Email Sending Fails
- Verify Gmail App Password (not regular password)
- Check "Less secure app access" is enabled (if not using App Password)
- Check SMTP settings match Gmail requirements

## Production Deployment

### Backend
- Use managed PostgreSQL (Supabase, Railway, RDS)
- Use managed Redis
- Deploy to Railway, Render, or Fly.io
- Set environment variables in platform settings

### Frontend
- Build: `npm run build`
- Deploy `dist/` to Vercel or Netlify
- Configure environment variables for API URL

### Celery
- Deploy as separate worker service
- Use managed Redis (Upstash, Redis Cloud)

## Next Steps

1. Configure Stripe subscription product
2. Set up production domain
3. Configure email sending with custom domain
4. Enable production API keys
5. Set up monitoring and logging
