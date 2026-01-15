# PayFlow Assist - Project Summary

## MVP Completion Status

### Core Features Implemented ✓

1. **Authentication & Authorization**
   - JWT-based auth with access + refresh tokens
   - httpOnly cookies for security
   - User registration with business creation
   - Role-based access (owner/admin)

2. **Invoice Management**
   - CSV upload with validation
   - Support for multiple date formats
   - Automatic client creation
   - Days overdue calculation

3. **AI Reminder Generation**
   - OpenAI integration
   - Tone-based generation (friendly/neutral/firm)
   - Prohibited language filter
   - Automatic regeneration if violations detected
   - 100-word limit enforcement

4. **Human Approval Workflow**
   - Draft inbox UI
   - Individual approval required
   - Edit functionality (requires re-approval)
   - Snooze capability
   - No bulk operations (by design)

5. **Email Sending**
   - SMTP integration (Gmail)
   - Sends from user's email
   - Subject: "Invoice reminder"
   - Plain text body only

6. **Subscription Enforcement**
   - Stripe webhook integration
   - Subscription status tracking
   - Sending blocked if not active
   - Draft generation continues (graceful degradation)

7. **Audit Logging**
   - Immutable logs
   - All critical actions logged
   - JSON payload snapshots
   - Exportable (via API)

8. **Background Jobs**
   - Daily days_overdue updates
   - Daily draft generation
   - Celery + Redis implementation

## Tech Stack Compliance

✓ Python 3.11
✓ FastAPI
✓ SQLAlchemy 2.0
✓ PostgreSQL
✓ JWT Authentication
✓ Celery + Redis
✓ OpenAI API
✓ Stripe
✓ React 18
✓ TypeScript
✓ Tailwind CSS
✓ React Query
✓ React Hook Form

## Core Principles Enforced

### Hard-Coded Rules (Cannot be bypassed)

1. **No Autonomous Escalation**
   - VIP clients excluded from auto-generation
   - Manual override required for sensitive clients

2. **No Threatening Language**
   - Prohibited phrase filter in AI service
   - Multiple regeneration attempts
   - Fails gracefully if can't generate acceptable text

3. **No Auto-Send**
   - Explicit approval required
   - Confirmation modal before send
   - Individual send actions only

4. **User Email Origin**
   - All emails sent from user's authenticated account
   - No system emails

5. **Complete Audit Trail**
   - Every draft generated, edited, approved, sent = logged
   - Immutable logs
   - Timestamp + actor + payload

## File Structure

```
payflow-assist/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py          # Authentication endpoints
│   │   │   ├── invoices.py       # Invoice upload & retrieval
│   │   │   ├── reminders.py      # Draft approval workflow
│   │   │   └── webhooks.py       # Stripe webhooks
│   │   ├── core/
│   │   │   ├── config.py         # Settings management
│   │   │   ├── database.py       # DB session
│   │   │   ├── security.py       # JWT, password hashing
│   │   │   └── dependencies.py   # Auth dependencies
│   │   ├── jobs/
│   │   │   ├── celery_app.py     # Celery configuration
│   │   │   └── reminder_tasks.py # Background jobs
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── business.py
│   │   │   ├── client.py
│   │   │   ├── invoice.py
│   │   │   ├── reminder.py
│   │   │   └── audit_log.py
│   │   ├── schemas/
│   │   │   ├── auth.py
│   │   │   ├── invoice.py
│   │   │   └── reminder.py
│   │   ├── services/
│   │   │   ├── ai_service.py     # OpenAI integration
│   │   │   ├── email_service.py  # SMTP/Gmail
│   │   │   └── audit_service.py  # Logging
│   │   └── main.py               # FastAPI app
│   ├── alembic/                  # Migrations
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── DraftInbox.tsx    # CORE SCREEN
│   │   │   └── InvoiceUpload.tsx
│   │   ├── services/
│   │   │   └── api.ts            # API client
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── README.md
├── SETUP.md
└── .gitignore
```

## Database Schema

### Tables (6)
1. `users` - Authentication & user management
2. `businesses` - Business entities with subscription status
3. `clients` - Customer records with sensitivity settings
4. `invoices` - Payment tracking with overdue calculations
5. `reminder_drafts` - AI-generated messages awaiting approval
6. `audit_logs` - Immutable action history

### Key Relationships
- User → Business (many-to-one)
- Client → Business (many-to-one)
- Invoice → Client (many-to-one)
- ReminderDraft → Invoice (many-to-one)
- AuditLog → User (many-to-one, actor)

## API Endpoints Summary

### Auth (4)
- POST /auth/register
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout

### Invoices (2)
- GET /invoices
- POST /invoices/upload

### Reminders (6)
- GET /reminders/drafts
- POST /reminders/{id}/approve
- POST /reminders/{id}/edit
- POST /reminders/{id}/snooze
- POST /reminders/{id}/send
- DELETE /reminders/{id}

### Webhooks (1)
- POST /webhooks/stripe

## UI Pages Summary

1. **Login** - Email/password auth
2. **Register** - Account + business creation
3. **Dashboard** - Key metrics (unpaid invoices, pending drafts, avg days overdue)
4. **Draft Inbox** - Core approval workflow (table view with inline edit)
5. **Invoice Upload** - CSV file upload with validation feedback

## MVP Success Criteria

✓ User can upload invoices
✓ Drafts are generated automatically
✓ User can approve drafts
✓ Email is sent on approval
✓ Audit log records action
✓ Subscription gates sending

## Known Limitations (MVP)

1. Gmail OAuth not implemented (SMTP fallback only)
2. No Xero/QuickBooks integration
3. No SMS/WhatsApp
4. No payment plans
5. No analytics beyond basic metrics
6. No multi-business support per user
7. No settings page (configuration via code)

## Production Readiness Checklist

### Required Before Launch

- [ ] Set up production database
- [ ] Configure production Redis
- [ ] Add proper error tracking (Sentry)
- [ ] Implement rate limiting
- [ ] Add request validation middleware
- [ ] Set up SSL certificates
- [ ] Configure CORS for production domain
- [ ] Implement proper logging
- [ ] Add health check endpoints
- [ ] Set up backup strategy
- [ ] Configure Stripe production mode
- [ ] Implement email verification
- [ ] Add password reset flow
- [ ] Create privacy policy & terms
- [ ] Set up monitoring alerts

### Nice to Have

- [ ] Implement caching (Redis)
- [ ] Add API documentation (Swagger UI is auto-generated)
- [ ] Create admin panel
- [ ] Add bulk operations
- [ ] Implement search/filtering
- [ ] Add export functionality
- [ ] Create mobile responsive improvements
- [ ] Add dark mode

## Estimated Development Time

**Total: ~40-50 hours for solo developer**

- Backend setup & models: 6h
- Authentication: 4h
- Invoice upload: 3h
- AI service: 4h
- Reminder workflow: 6h
- Email integration: 3h
- Celery jobs: 4h
- Stripe integration: 3h
- Frontend setup: 3h
- UI components: 8h
- Testing & debugging: 6h

## Monthly Operating Costs (Estimate)

- Database (Railway/Supabase): $10-25
- Redis (Upstash): $0-10
- Backend hosting (Render/Railway): $7-15
- Frontend hosting (Vercel/Netlify): $0 (free tier)
- OpenAI API: $20-100 (depends on volume)
- **Total: ~$37-150/month**

Revenue target: $29/month × 10 customers = $290/month (break-even ~1-5 customers)

## Next Steps

1. Deploy MVP to staging environment
2. Test end-to-end flow
3. Invite beta testers
4. Collect feedback
5. Iterate on UX
6. Prepare for launch
