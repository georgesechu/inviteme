# InviteMe Server

Node.js/TypeScript backend API for InviteMe.

## Features

- Express.js REST API
- WhatsApp authentication
- Guest management
- Card design management
- Payment processing
- Card generation and sharing

## Development

```bash
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `PORT` - Server port (default: 3000)
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_FROM_NUMBER` - Twilio WhatsApp number
- `JWT_SECRET` - Secret for JWT tokens
- `DATABASE_URL` - Database connection string

