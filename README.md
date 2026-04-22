# Next Gear Rentals - MVP

Pan India rental MVP for:
- Bike rental
- Car rental
- Scooty rental
- Indian + NRI booking support

## Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS
- API routes for search + booking
- In-memory data store (replace with PostgreSQL/MySQL in production)

## Features Included

### User Side
- Email-based booking flow scaffold (ready to connect OTP provider)
- Search by city and date
- Vehicle filters (price/type/fuel/transmission)
- Live availability dates
- Booking creation + booking history
- Cancellation/refund flow placeholder
- Support messaging hints (chat + WhatsApp)

### NRI Support
- Passport upload workflow placeholder
- Currency display (INR, USD, AED)
- International payment support notes (Stripe/PayPal)
- Airport pickup option
- Timezone-based booking capture

### Vendor Panel
- Vendor listing snapshot
- Commission view
- Vehicle listing count per vendor

### Admin Panel
- Manage users/vendors/vehicles/bookings/payments/commission/cities overview

## Run Locally

```bash
npm install
npm run prisma:generate
npm run dev
```

Open http://localhost:3000

## Enable PostgreSQL Persistence

```bash
# 1) Add DATABASE_URL in .env.local (see .env.example)
# 2) Create first migration locally
npm run prisma:migrate -- --name init

# 3) Seed demo data
npm run prisma:seed
```

For production (Vercel):

```bash
npx vercel env add DATABASE_URL production
npm run prisma:migrate:deploy
```

## Phase 3 Database Setup

```bash
npm run prisma:migrate
npm run prisma:seed
```

Test credentials:
- Test accounts are available upon request
- Contact: support@nextgear.in

## Logo Setup

Add your two logo files in `public/` with these exact names:
- `WhatsApp Image 2026-02-21 at 00.53.35 (3).jpeg`
- `WhatsApp Image 2026-02-21 at 00.53.35 (2).jpeg`

The homepage hero already uses these two files.

## API Endpoints
- `GET /api/vehicles`: Search/filter vehicles
- `GET /api/bookings?email=...`: Booking history
- `POST /api/bookings`: Create booking
- `PATCH /api/bookings/:bookingId/cancel`: Cancel booking + persist refund status
- `POST /api/payments/webhook/stripe`: Stripe signed webhook updates (`PAID`/`FAILED`)
- `POST /api/payments/webhook/razorpay`: Razorpay signed webhook updates (`PAID`/`FAILED`)
- `POST /api/payments/webhook/retry/process`: Process queued webhook retry jobs
- `GET /api/admin/finance/export`: Admin CSV export with `provider` and `status` filters
- `GET|POST /api/payments/webhook/retry/cron`: Cron-safe retry processor endpoint
- `GET /api/admin/webhooks/logs`: Paginated webhook audit logs (`provider`, `status`, `page`, `pageSize`)
- `GET /api/admin/ops/metrics`: Admin operations metrics snapshot
- `POST /api/admin/webhooks/requeue`: Requeue a failed webhook event from admin ops
- `POST /api/admin/webhooks/retry-now`: Trigger retry processor manually from admin ops

## Production Next Steps
- Add auth with OTP + email verification (Clerk/Auth.js + OTP provider)
- Add DB and ORM (PostgreSQL + Prisma)
- Integrate payments (Razorpay, Stripe, PayPal)
- Add document upload (license/passport/RC/insurance) via object storage
- Add legal pages: Terms, Privacy, Rental Agreement
- Implement KYC verification + permit/compliance checks

## Phase 2 Delivered
- Prisma schema for users, vendors, vehicles, bookings, payments, OTP
- API auth routes: register, login, request OTP, verify OTP, me, logout
- Secure session cookie with JWT
- Checkout API layer for Razorpay, Stripe, and PayPal (live when keys are present, mock fallback without keys)

## Phase 3 Delivered
- Middleware-based role guard for `/dashboard/*`
- Protected dashboards:
	- `/dashboard/customer`
	- `/dashboard/vendor`
	- `/dashboard/admin`
- Prisma seed script with initial city, user, vendor, vehicle, and booking data

## Phase 4 Delivered
- `GET /api/vehicles` now serves Prisma-backed vehicle data when `DATABASE_URL` is configured
- `GET /api/bookings` and `POST /api/bookings` now persist/read real booking records in Prisma
- `POST /api/payments/checkout` now creates Prisma payment records for all providers (Razorpay, Stripe, PayPal), including mock/live metadata
- Graceful fallback to in-memory behavior remains active when `DATABASE_URL` is not configured

## Phase 5 Delivered
- Verified Stripe webhook endpoint with signature validation
- Verified Razorpay webhook endpoint with HMAC signature validation
- Payment status persistence from webhooks (`PAID`, `FAILED`)
- Booking cancellation endpoint with refund persistence (`REFUNDED`)

## Phase 6 Delivered
- Webhook replay/idempotency protection with event tracking for Stripe and Razorpay
- Duplicate webhook event detection to avoid repeated payment state updates
- Payment and refund history panels added to:
	- `/dashboard/customer`
	- `/dashboard/vendor`
	- `/dashboard/admin`

## Phase 7 Delivered
- Persistent webhook audit logs with event status tracking (`RECEIVED`, `PROCESSED`, `FAILED`, `DUPLICATE`, `IGNORED`)
- Webhook retry queue with retry attempts, backoff scheduling, and manual processor endpoint
- Admin finance operations filters (`provider`, `status`) and CSV export support

## Phase 8 Delivered
- Scheduled retry runner endpoint for cron integration
- Admin webhook audit viewer with provider/status filters
- One-click webhook requeue for failed events
- Manual retry trigger action from admin dashboard

## Security Hardening
- Admin mutation APIs now enforce same-origin checks (`Origin`/`Referer`) to reduce CSRF risk
- Webhook/admin endpoints now include in-memory request rate limiting with `429` + `Retry-After` responses
- When `REDIS_URL` is configured, rate limiting runs in distributed Redis mode across instances (with automatic in-memory fallback)
