# Payment Gateway Integration Guide

## Overview
Next Gear Rentals supports three major payment gateways:
- **Razorpay**: Best for India (UPI, Cards, Wallets)
- **Stripe**: Global payments (Cards, Apple Pay, Google Pay)
- **PayPal**: Multiple countries (Email, PayPal Balance)

---

## Setup Instructions

### 1. Razorpay Setup (India)

#### Get Credentials:
1. Go to https://dashboard.razorpay.com
2. Sign up/Login to your account
3. Navigate to Settings → API Keys
4. Copy your Key ID and Key Secret

#### Environment Variables:
```env
# Public (visible in frontend)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx

# Private (backend only)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_key_secret_here
```

#### Webhook Setup:
1. Go to Settings → Webhooks
2. Add new webhook with URL: `https://yourdomain.com/api/payments/webhooks/razorpay`
3. Select events:
   - `payment.authorized`
   - `payment.failed`
   - `payment.captured`
4. Copy webhook secret and add to env:
```env
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

#### Test Credentials:
```
Key ID: rzp_test_xxxxxxxxxxxxx
Key Secret: (contact Razorpay support)
Card: 4111 1111 1111 1111
CVV: 123 | Expiry: Any future date
```

---

### 2. Stripe Setup (Global)

#### Get Credentials:
1. Go to https://dashboard.stripe.com
2. Sign up/Login
3. Navigate to Developers → API Keys
4. Copy Publishable Key and Secret Key

#### Environment Variables:
```env
# Public (visible in frontend)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxx

# Private (backend only)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

#### Webhook Setup:
1. Go to Developers → Webhooks
2. Click "Add endpoint"
3. URL: `https://yourdomain.com/api/payments/webhooks/stripe`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy signing secret and add to env

#### Test Credentials:
```
Publishable Key: pk_test_xxxxxxxxxxxxxxxxxxxxxxxx
Secret Key: sk_test_xxxxxxxxxxxxxxxxxxxxxxxx
Card: 4242 4242 4242 4242
CVV: Any 3 digits | Expiry: Any future date
Success: Any amount works
```

---

### 3. PayPal Setup (Global)

#### Get Credentials:
1. Go to https://developer.paypal.com
2. Sign up/Login to Developer account
3. Navigate to Apps & Credentials
4. Create app and copy Client ID and Secret

#### Environment Variables:
```env
# Public (visible in frontend)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=AZnUXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Private (backend only)
PAYPAL_CLIENT_ID=AZnUXXXXXXXXXXXXXXXXXXXXXXXXXXX
PAYPAL_CLIENT_SECRET=your_client_secret_here
PAYPAL_MODE=sandbox  # or "production"
```

#### Webhook Setup:
1. Go to Apps & Credentials → Sandbox
2. Click app name and edit
3. Add webhook with URL: `https://yourdomain.com/api/payments/webhooks/paypal`
4. Select events:
   - `CHECKOUT.ORDER.APPROVED`
   - `CHECKOUT.ORDER.COMPLETED`

#### Test Account:
```
Business Account Email: Your developer email
Personal Account Email: (auto-created)
Sandbox URL: https://www.sandbox.paypal.com
```

---

## API Endpoints

### 1. Create Payment Order
**POST** `/api/payments/checkout`

Request:
```json
{
  "provider": "razorpay|stripe|paypal",
  "amountINR": 1899,
  "currency": "INR",
  "bookingId": "BK-1001"
}
```

Response (Razorpay):
```json
{
  "provider": "razorpay",
  "mode": "live|mock",
  "order": {
    "id": "order_xxxxxxxxxxxxx",
    "amount": 189900,
    "currency": "INR"
  }
}
```

Response (Stripe):
```json
{
  "provider": "stripe",
  "mode": "live|mock",
  "paymentIntentId": "pi_xxxxxxxxxxxxx",
  "clientSecret": "pi_xxxxxxxxxxxxx_secret_xxxxx"
}
```

Response (PayPal):
```json
{
  "provider": "paypal",
  "mode": "live|mock",
  "orderId": "XXXXXXXXXXXXXXX",
  "approvalUrl": "https://www.sandbox.paypal.com/checkoutnow?token=EC-XXXXXXX"
}
```

---

### 2. Verify Payment
**POST** `/api/payments/verify`

Request (Razorpay):
```json
{
  "provider": "razorpay",
  "razorpayPaymentId": "pay_xxxxxxxxxxxxx",
  "razorpayOrderId": "order_xxxxxxxxxxxxx",
  "razorpaySignature": "8c8e16d1234567890abcdef123456789"
}
```

Request (Stripe):
```json
{
  "provider": "stripe",
  "paymentIntentId": "pi_xxxxxxxxxxxxx"
}
```

Request (PayPal):
```json
{
  "provider": "paypal",
  "paypalOrderId": "XXXXXXXXXXXXXXX"
}
```

Response:
```json
{
  "verified": true,
  "mode": "live|mock",
  "provider": "razorpay|stripe|paypal",
  "status": "PAID|FAILED|PENDING"
}
```

---

### 3. Capture PayPal Order
**POST** `/api/payments/paypal/capture`

Request:
```json
{
  "paypalOrderId": "XXXXXXXXXXXXXXX"
}
```

Response:
```json
{
  "captured": true,
  "mode": "live|mock",
  "orderId": "XXXXXXXXXXXXXXX",
  "status": "COMPLETED"
}
```

---

## Webhook Endpoints

### Razorpay Webhook
**POST** `/api/payments/webhooks/razorpay`

Headers:
```
x-razorpay-signature: signature_hash
```

Events:
- `payment.authorized`
- `payment.failed`
- `payment.captured`

### Stripe Webhook
**POST** `/api/payments/webhooks/stripe`

Headers:
```
stripe-signature: t=timestamp,v1=signature
```

Events:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

### PayPal Webhook
**POST** `/api/payments/webhooks/paypal`

Body includes:
- `event_type`: CHECKOUT.ORDER.APPROVED, CHECKOUT.ORDER.COMPLETED
- `resource`: Order details

---

## Testing Flows

### Test with Mock Mode (No Keys):
1. Don't set provider credentials
2. All payment endpoints return mock data
3. Use for development without keys

### Test with Live Keys:
1. Set all credentials in .env.local
2. Use test/sandbox mode credentials
3. Use provided test cards/accounts
4. Verify in admin payments dashboard

### Integration Testing:
1. Deploy to staging
2. Configure webhook URLs
3. Test payment flow end-to-end
4. Verify webhook receipt and database updates

---

## Security Best Practices

✅ **DO:**
- Store keys in .env.local (never commit)
- Use HTTPS for webhook endpoints
- Verify webhook signatures
- Store payment IDs, not full card numbers
- Use secure environment variables on production

❌ **DON'T:**
- Expose secret keys in frontend code
- Log sensitive payment data
- Save credit card details
- Commit .env files to Git
- Use test mode keys in production

---

## Troubleshooting

### Payment fails with "Mock mode"
- Set provider credentials in .env.local
- Restart development server
- Check credentials are correct

### Webhook not received
- Verify webhook URL is publicly accessible
- Check firewall/VPN isn't blocking
- Verify signature secret is correct
- Check logs in gateway dashboard

### Verification fails
- Ensure payment record exists in database
- Check signature/payment ID format
- Verify correct provider key is used
- Check order was created successfully

### Test Payment Stuck
- Clear browser cache
- Check server logs for errors
- Verify database connection
- Try different browser/incognito

---

## Production Checklist

- [ ] Switch from sandbox/test to production credentials
- [ ] Update webhook URLs to production domain
- [ ] Test with real payment methods
- [ ] Set up monitoring/alerting for payment failures
- [ ] Configure retry logic for failures
- [ ] Enable 3D Secure (Razorpay/Stripe)
- [ ] Set up reconciliation process
- [ ] Document refund procedure
- [ ] Enable audit logging
- [ ] Set up admin alerts for failed payments
