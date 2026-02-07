# 🔒 Reeyo Backend - Security Guide

## ⚠️ CRITICAL: Read This Before Deployment

This document outlines **mandatory** security practices for the Reeyo platform. Violations can lead to:
- Financial loss
- Data breaches
- Legal liability
- Platform shutdown

---

# 🚨 1. Environment Variables (.env Files)

## ❌ NEVER COMMIT TO GIT

```bash
# Always run this FIRST
echo ".env" >> .gitignore
echo ".env.*" >> .gitignore

# Verify .env is ignored
git status  # .env should NOT appear
```

## Required Variables

### Critical Secrets (Must be 32+ characters):
```env
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
SESSION_SECRET=another_super_secret_key_32_plus_characters
```

### Generate Secure Secrets:
```bash
# In terminal
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Database Credentials:
```env
DYNAMODB_TABLE=ReeYo-Production
AWS_ACCESS_KEY_ID=AKIA...  # Never hardcode
AWS_SECRET_ACCESS_KEY=...   # Never hardcode
```

### Payment Gateway:
```env
CAMPAY_USERNAME=your_username
CAMPAY_PASSWORD=your_password
CAMPAY_APP_KEY=your_app_key
```

## Production Deployment:
1. Use AWS Secrets Manager or Parameter Store
2. Inject secrets at runtime
3. Never store secrets in code
4. Rotate secrets every 90 days

---

# 🔐 2. Password Security

## ✅ Always Use Bcrypt

```typescript
// CORRECT
import { PasswordHelper } from './libs/shared-utils/helpers/password.helper';

const passwordHash = await PasswordHelper.hash(password);
```

## ❌ NEVER:
```typescript
// WRONG - Plain text
user.password = req.body.password;

// WRONG - Weak hashing
user.password = md5(password);
user.password = sha1(password);

// WRONG - Logging passwords
logger.info('Password:', password);
```

## Password Requirements:
- Minimum 8 characters
- Must contain: uppercase, lowercase, number, special character
- Validated by `PasswordHelper.validateStrength()`

---

# 🎫 3. JWT Token Security

## Token Lifespan:
```typescript
// Access Token: 7 days
// Refresh Token: 30 days
```

## ✅ Best Practices:
```typescript
// Store tokens in:
// - Mobile: Secure storage (iOS Keychain, Android Keystore)
// - Web: httpOnly cookies (NOT localStorage)

// Always verify tokens
const payload = JWTHelper.verifyAccessToken(token);
```

## ❌ NEVER:
```typescript
// Don't store in localStorage (XSS vulnerable)
localStorage.setItem('token', token);

// Don't expose JWT_SECRET
res.json({ secret: process.env.JWT_SECRET });

// Don't accept tokens from query params
const token = req.query.token; // NO!
```

---

# 💰 4. Financial Transaction Security

## ✅ MANDATORY: Use ACID Transactions

```typescript
// CORRECT - Atomic transaction
await walletService.processOrderCompletion(order);

// This ensures ALL these happen together or NONE:
// 1. Credit admin wallet
// 2. Credit vendor wallet
// 3. Credit rider wallet
// 4. Record all transactions
// 5. Update order status
```

## ❌ NEVER Update Wallets Directly:
```typescript
// WRONG - Race condition, can lose money
await walletRepo.update({ availableBalance: balance + amount });
```

## Money Validation:
```typescript
// Always validate amounts
if (amount <= 0) {
  throw ErrorFactory.badRequest('Invalid amount');
}

// Check sufficient balance
const wallet = await walletRepo.getBalance(entityType, entityId);
if (wallet.availableBalance < amount) {
  throw ErrorFactory.badRequest('Insufficient balance');
}

// Use Decimal.js for precise calculations
import Decimal from 'decimal.js';
const total = new Decimal(subtotal).plus(deliveryFee).toNumber();
```

---

# 🛡️ 5. Input Validation

## ✅ Always Validate:
```typescript
import { vendorRegistrationSchema } from './libs/shared-utils/validators/schemas';

// Validate ALL user input
const { error, value } = vendorRegistrationSchema.validate(req.body);
if (error) {
  throw ErrorFactory.validation('Invalid input', error.details);
}
```

## ❌ NEVER Trust User Input:
```typescript
// WRONG - No validation
const vendor = await vendorRepo.create(req.body);

// WRONG - Direct database query with user input
const query = `SELECT * FROM users WHERE id = ${req.params.id}`;
```

## SQL Injection Prevention:
```typescript
// DynamoDB is NoSQL, but still validate
// CORRECT
const result = await db.query(
  'PK = :pk',
  { ':pk': `USER#${userId}` }  // Parameterized
);

// WRONG
const query = `PK = USER#${req.params.id}`; // String interpolation
```

---

# 🚪 6. Authentication & Authorization

## Authentication Middleware:
```typescript
// Protect ALL routes that need auth
router.get('/profile', authenticateVendor, getProfile);
router.put('/orders/:id', authenticateVendor, requireActiveVendor, updateOrder);
```

## Authorization Checks:
```typescript
// Verify ownership
if (order.vendorId !== req.vendor.vendorId) {
  throw ErrorFactory.forbidden('Access denied');
}

// Check permissions
if (req.vendor.status !== VendorStatus.ACTIVE) {
  throw ErrorFactory.forbidden('Account not active');
}
```

---

# 📡 7. API Security

## Rate Limiting:
```typescript
// Already configured in server.ts
// 100 requests per 15 minutes per IP
```

## CORS:
```typescript
// CORRECT - Whitelist specific origins
const allowedOrigins = [
  'https://reeyo.cm',
  'https://app.reeyo.cm',
];

// WRONG - Allow all
cors({ origin: '*' });
```

## HTTPS Only:
```
// Production MUST use HTTPS
// No HTTP endpoints allowed
```

---

# 🗃️ 8. Database Security

## Access Control:
```typescript
// Use IAM roles, not hardcoded keys
// AWS Lambda execution role should have minimal permissions

// CORRECT IAM Policy:
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:GetItem",
    "dynamodb:PutItem",
    "dynamodb:UpdateItem",
    "dynamodb:Query"
  ],
  "Resource": "arn:aws:dynamodb:region:account:table/ReeYo-Production"
}
```

## Data Encryption:
```
- DynamoDB: Enable encryption at rest
- S3: Enable default encryption
- RDS: Use encryption (if used)
```

---

# 📝 9. Logging Security

## ✅ DO Log:
```typescript
logger.info('User login', { userId, ip, timestamp });
logger.info('Order created', { orderId, vendorId, amount });
logTransaction('txn_123', 50000, 'CREDIT');
```

## ❌ NEVER Log:
```typescript
// NO - Passwords
logger.info('Login attempt', { email, password });

// NO - Full tokens
logger.info('Token:', token);

// NO - Credit cards
logger.info('Payment:', { cardNumber, cvv });

// NO - Personal data (unless necessary)
logger.info('User:', { ssn, dateOfBirth });
```

## Log Retention:
```
- Development: 7 days
- Production: 90 days minimum
- Financial logs: 7 years (legal requirement)
```

---

# 🔍 10. Error Handling

## ✅ Safe Error Messages:
```typescript
// User-facing
throw ErrorFactory.badRequest('Invalid email or password');

// Internal logging
logger.error('Login failed', { email, reason: 'Password mismatch' });
```

## ❌ Don't Expose Internal Errors:
```typescript
// WRONG - Exposes database structure
throw new Error(`Column 'user_ssn' not found in table 'users'`);

// WRONG - Shows file paths
throw new Error(`File not found: /var/www/app/config/secrets.json`);

// CORRECT
throw ErrorFactory.internal('An unexpected error occurred');
```

---

# 🔄 11. Dependency Security

## Regular Updates:
```bash
# Check for vulnerabilities
npm audit

# Fix automatically (if possible)
npm audit fix

# Manual review for major versions
npm outdated
```

## Avoid Suspicious Packages:
- Check download counts
- Review GitHub activity
- Read code before using
- Use lock files (package-lock.json)

---

# 🌐 12. Third-Party Service Security

## Campay (Payment):
```typescript
// Always verify webhook signatures
const isValid = campayService.verifyWebhookSignature(payload, signature);
if (!isValid) {
  throw ErrorFactory.unauthorized('Invalid webhook signature');
}

// Use sandbox for testing
// Never test with production credentials
```

## AWS Services:
```
- Use IAM roles, not access keys
- Enable CloudTrail for audit logs
- Set up billing alerts
- Use least privilege principle
```

---

# 📱 13. Mobile App Security

## API Communication:
```
- HTTPS only (no HTTP)
- Certificate pinning (recommended)
- Token refresh before expiry
- Biometric authentication for payments
```

## Token Storage:
```
iOS: Use Keychain
Android: Use Keystore
```

---

# 🚨 14. Incident Response

## If Compromised:

### Immediate Actions:
1. **Rotate ALL secrets** (JWT, database, API keys)
2. **Invalidate ALL tokens** (force re-login)
3. **Review access logs** (find breach point)
4. **Notify affected users** (legal requirement)
5. **Document incident** (post-mortem)

### Investigation:
```bash
# Check CloudWatch logs
# Review DynamoDB access patterns
# Analyze API Gateway logs
# Check AWS CloudTrail
```

---

# ✅ 15. Security Checklist

## Before Every Deployment:

### Code Review:
- [ ] No hardcoded secrets
- [ ] All inputs validated
- [ ] Error messages sanitized
- [ ] Authentication on protected routes
- [ ] Authorization checks in place
- [ ] Financial operations use transactions
- [ ] Logs don't contain sensitive data

### Configuration:
- [ ] .env in .gitignore
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] HTTPS enforced
- [ ] Database encryption enabled
- [ ] IAM roles with least privilege

### Testing:
- [ ] SQL injection tests
- [ ] XSS tests
- [ ] Authentication bypass tests
- [ ] Authorization bypass tests
- [ ] Rate limit tests
- [ ] Financial transaction tests

---

# 📞 Security Contacts

## Report Security Issues:
- Email: security@reeyo.cm
- Do NOT create public GitHub issues
- Use encrypted email if possible

---

# 📚 Additional Resources

## Security Tools:
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- npm audit: Built-in vulnerability scanner
- Snyk: Automated security scanning
- AWS Security Hub: Centralized security monitoring

---

## 🎯 Remember:

1. **Security is not optional** - It's mandatory
2. **One breach can destroy the platform** - Be paranoid
3. **Test everything** - Assume users are malicious
4. **Keep secrets secret** - No exceptions
5. **Financial integrity** - Use transactions always
6. **Audit regularly** - Review logs and access patterns
7. **Stay updated** - Security is ongoing, not one-time

---

**Built with security in mind. Keep it that way! 🔒**