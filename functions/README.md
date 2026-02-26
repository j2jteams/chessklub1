# Chess Tourneys - SendGrid Email Integration

Production-grade transactional email delivery system using Firebase Cloud Functions v2 and SendGrid.

## Features

- ✅ **Idempotency**: Never send duplicate emails
- ✅ **Audit Logging**: Complete email attempt history in Firestore
- ✅ **Error Handling**: Comprehensive error taxonomy and retry logic
- ✅ **Security**: Secret Manager integration, input validation, signature verification
- ✅ **Type Safety**: Full TypeScript with strict types
- ✅ **Maintainability**: Centralized email service, no code duplication

## Email Types

1. **WELCOME_EMAIL** - Sent on user signup
2. **CREATOR_SUBMISSION_RECEIPT** - Confirms tournament submission
3. **CREATOR_APPROVAL_EMAIL** - Notifies creator when tournament is approved
4. **TOURNAMENT_REGISTRATION_CONFIRMATION** - Confirms user registration
5. **REMINDER_24H** - 24-hour reminder before tournament start
6. **REMINDER_2H** - 2-hour reminder before tournament start
7. **TOURNAMENT_UPDATED_NOTIFICATION** - Notifies users of tournament changes
8. **PAYMENT_RECEIPT** - Payment confirmation (future Stripe integration)
9. **PAYMENT_FAILED** - Payment failure notification (future Stripe integration)

## Quick Start

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment instructions.

```bash
# Install dependencies
npm install

# Build
npm run build

# Deploy
firebase deploy --only functions
```

## Project Structure

```
functions/
├── src/
│   ├── email/
│   │   ├── emailTypes.ts       # Type definitions
│   │   ├── errors.ts           # Error handling
│   │   ├── emailService.ts     # Core email service
│   │   └── templateConfig.ts   # Template ID loader
│   ├── triggers/
│   │   ├── welcomeEmail.ts
│   │   ├── tournamentTriggers.ts
│   │   ├── reminderScheduler.ts
│   │   └── paymentWebhook.ts
│   ├── utils/
│   │   ├── validate.ts
│   │   ├── time.ts
│   │   ├── firestorePaging.ts
│   │   └── logger.ts
│   └── index.ts                # Entry point
├── package.json
├── tsconfig.json
└── DEPLOYMENT.md
```

## Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [CLIENT_TODO.md](./CLIENT_TODO.md) - Client setup checklist
- [DEVELOPER_TODO.md](./DEVELOPER_TODO.md) - Developer checklist

## License

Private - Chess Tourneys




