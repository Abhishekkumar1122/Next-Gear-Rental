# Cashfree Payment Gateway Integration

## Overview
Cashfree payment gateway has been successfully integrated into Next Gear Rentals, alongside existing Razorpay, Stripe, and PayPal integrations.

## What's Integrated ✅

### 1. **Cashfree** 💰 (India)
- Order creation with dynamic amounts
- Payment verification with Cashfree API
- Webhook support for payment events
- Supports: Cards, UPI, Wallets, Net Banking
- Status: ✅ FULLY INTEGRATED

---

## Environment Variables

Add these to your `.env.local` file:

```bash
# Cashfree Core
CASHFREE_APP_ID="your-cashfree-app-id"
CASHFREE_APP_SECRET="your-cashfree-app-secret"
NEXT_PUBLIC_CASHFREE_APP_ID="your-cashfree-app-id"

# Cashfree Mode (sandbox or production)
CASHFREE_MODE="sandbox"  # Use "production" for live payments

# Cashfree Webhook Secret (for secure webhook verification)
CASHFREE_WEBHOOK_SECRET="your-cashfree-webhook-secret"
```

### Getting Cashfree Credentials

1. Visit [Cashfree Dashboard](https://dashboard.cashfree.com)
2. Navigate to **Settings** → **API Keys**
3. Copy your **App ID** and **App Secret**
4. Go to **Settings** → **Webhooks** to set up webhook secret

---

## API Endpoints Created

### Payment Core APIs
```
POST /api/payments/checkout
  → Creates payment order for Cashfree
  → Returns: { orderId, paymentSessionId }
  
POST /api/payments/verify
  → Verifies Cashfree payment status
  → Queries Cashfree API for order status
```

### Webhook Handler
```
POST /api/payments/webhooks/cashfree
  → Handles Cashfree payment events
  → Updates database with payment status
  → Verifies webhook signature
```

---

## Components Updated

### 1. PaymentGatewaySelector Component
- **File**: [src/components/payment-gateway-selector.tsx](src/components/payment-gateway-selector.tsx)
- **Changes**:
  - Added Cashfree to payment provider list
  - Shows "✓ Connected" status when `NEXT_PUBLIC_CASHFREE_APP_ID` is set
  - Icon: 💰

### 2. CheckoutForm Component
- **File**: [src/components/checkout-form.tsx](src/components/checkout-form.tsx)
- **Changes**:
  - Updated `PaymentProvider` type to include `"cashfree"`
  - Added `handleCashfreePayment()` function
  - Loads Cashfree SDK dynamically
  - Redirects to Cashfree hosted checkout
  - Updated test credentials section

---

## API Routes Updated

### 1. Checkout API
- **File**: [src/app/api/payments/checkout/route.ts](src/app/api/payments/checkout/route.ts)
- **Changes**:
  - Added "cashfree" to provider enum
  - Implemented Cashfree order creation using Cashfree API
  - Supports both sandbox and production modes
  - Returns `orderId` and `paymentSessionId`

### 2. Verification API
- **File**: [src/app/api/payments/verify/route.ts](src/app/api/payments/verify/route.ts)
- **Changes**:
  - Added "cashfree" to provider enum
  - Implemented Cashfree order status verification
  - Queries Cashfree API for real-time payment status
  - Returns payment verification result

### 3. Webhook Handler
- **File**: [src/app/api/payments/webhooks/route.ts](src/app/api/payments/webhooks/route.ts)
- **Changes**:
  - Added `handleCashfreeWebhook()` function
  - Verifies webhook signature using HMAC-SHA256
  - Updates payment status: `PAID` or `FAILED`
  - Handles webhook routing for Cashfree

---

## Database Integration

### Payment Record Schema
Cashfree payments are stored with:
```typescript
Payment {
  id: UUID
  bookingId: String
  userId: String
  vendorId: String (optional)
  provider: "cashfree"
  status: "CREATED" | "PAID" | "FAILED" | "REFUNDED"
  amountINR: Number
  providerPaymentId: String (orderId from Cashfree)
  metadataJson: {
    provider: "cashfree"
    orderId: String
    paymentSessionId: String
    orderStatus: String
  }
}
```

---

## Payment Flow

### User Initiates Payment
1. Customer selects Cashfree from payment gateway options
2. Enters booking details and amount

### Order Creation
1. **Request**: `POST /api/payments/checkout`
   ```json
   {
     "provider": "cashfree",
     "amountINR": 50000,
     "currency": "INR",
     "bookingId": "booking_123"
   }
   ```

2. **Response**:
   ```json
   {
     "provider": "cashfree",
     "mode": "live",
     "orderId": "NG_booking_123_1234567890",
     "paymentSessionId": "cf_session_id_xyz"
   }
   ```

### Payment Processing
1. Frontend loads Cashfree SDK
2. Redirects user to Cashfree hosted checkout
3. Customer selects payment method and completes payment
4. Cashfree redirects back to your app (return_url)

### Webhook Notification
1. Cashfree sends webhook to `/api/payments/webhooks/cashfree`
2. Webhook is verified using HMAC signature
3. Database is updated with payment status
4. Email notification sent to user

### Verification
1. **Request**: `POST /api/payments/verify`
   ```json
   {
     "provider": "cashfree",
     "cashfreeOrderId": "NG_booking_123_1234567890"
   }
   ```

2. **Response**:
   ```json
   {
     "verified": true,
     "provider": "cashfree",
     "status": "PAID",
     "cashfreeOrderId": "NG_booking_123_1234567890",
     "cashfreeStatus": "PAID"
   }
   ```

---

## Testing Checklist

- [ ] Set up Cashfree account
- [ ] Add credentials to `.env.local`
- [ ] Test payment flow in sandbox mode
- [ ] Verify webhook signature validation
- [ ] Test payment success scenario
- [ ] Test payment failure scenario
- [ ] Verify database records are updated
- [ ] Check email notifications are sent
- [ ] Test on mobile devices
- [ ] Switch to production credentials when ready

---

## Sandbox Test Data

For testing Cashfree payments in sandbox mode:

**Test Card Numbers:**
- Visa: `4111111111111111` | Name: _any_ | Expiry: _any future date_ | CVV: _any 3 digits_
- Mastercard: `5555555555554444` | Name: _any_ | Expiry: _any future date_ | CVV: _any 3 digits_

**UPI IDs:**
- `success@okhdfcbank`
- `fail@okhdfcbank`

---

## Troubleshooting

### Issue: "Cashfree credentials missing"
**Solution**: Ensure both `CASHFREE_APP_ID` and `CASHFREE_APP_SECRET` are set in `.env.local`

### Issue: "Webhook signature verification failed"
**Solution**: 
1. Verify `CASHFREE_WEBHOOK_SECRET` matches Cashfree dashboard
2. Check webhook endpoint is publicly accessible
3. Ensure webhook URL is configured correctly in Cashfree dashboard

### Issue: Payment status not updating
**Solution**:
1. Check database connection is working
2. Verify webhook is being triggered (check Cashfree logs)
3. Run payment verification API manually: `POST /api/payments/verify`

### Issue: "Failed to load Cashfree SDK"
**Solution**:
1. Check internet connectivity
2. Verify no CORS issues
3. Try clearing browser cache

---

## Migration & Deployment

### Pre-Production Steps
1. Get production credentials from Cashfree
2. Update environment variables
3. Set `CASHFREE_MODE="production"`
4. Register production webhook URL in Cashfree dashboard
5. Test with real payments
6. Ensure email notifications are configured

### Production Deployment
1. Deploy code with updated `.env` variables
2. Monitor webhook logs
3. Have customer support ready
4. Test refund mechanism
5. Set up payment reconciliation process

---

## Support & Resources

- **Cashfree Docs**: https://docs.cashfree.com
- **API Reference**: https://docs.cashfree.com/reference
- **Status Page**: https://status.cashfree.com
- **Support Email**: support@cashfree.com

---

## Summary of Changes

| File | Changes |
|------|---------|
| [src/app/api/payments/checkout/route.ts](src/app/api/payments/checkout/route.ts) | Added Cashfree order creation |
| [src/app/api/payments/verify/route.ts](src/app/api/payments/verify/route.ts) | Added Cashfree verification |
| [src/app/api/payments/webhooks/route.ts](src/app/api/payments/webhooks/route.ts) | Added Cashfree webhook handler |
| [src/components/payment-gateway-selector.tsx](src/components/payment-gateway-selector.tsx) | Added Cashfree option |
| [src/components/checkout-form.tsx](src/components/checkout-form.tsx) | Added Cashfree payment flow |
| [.env.example](.env.example) | Added Cashfree configuration |

---

**Last Updated:** March 21, 2026  
**Integration Status:** ✅ Complete and Ready for Testing
