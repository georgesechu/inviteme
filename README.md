# InviteMe

A full-stack wedding invitation card management system with web and mobile apps.

## Architecture

This is a monorepo containing:

- **packages/server** - Node.js/TypeScript backend API
- **packages/web** - React.js/TypeScript web application
- **packages/mobile** - React Native/TypeScript mobile application
- **packages/shared** - Shared TypeScript code used across all platforms

## Features

- 🔐 Login via WhatsApp code
- 👥 Guest management (add, edit, delete guests)
- 🎨 Card design gallery and selection
- 📤 Share invitation cards via WhatsApp
- 💳 Payment integration for card sharing

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- For mobile: React Native development environment

### Installation

```bash
npm install
```

### Development

Run all services in development mode:

```bash
# Server
npm run dev:server

# Web app
npm run dev:web

# Mobile app
npm run dev:mobile
```

### Building

```bash
# Build all packages
npm run build

# Build specific package
npm run build:server
npm run build:web
npm run build:mobile
```

## Project Structure

```
.
├── packages/
│   ├── server/          # Backend API
│   ├── web/             # React web app
│   ├── mobile/          # React Native app
│   └── shared/          # Shared TypeScript code
├── package.json         # Root package.json
├── tsconfig.json        # Root TypeScript config
└── old_python_setup/    # Old Python-based setup (to be deleted)
```

## License

Private

