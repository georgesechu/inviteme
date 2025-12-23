# Database Setup Guide

## PostgreSQL Installation

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### macOS (Homebrew)
```bash
brew install postgresql@15
brew services start postgresql@15
```

### Docker (Recommended for Development)
```bash
docker run --name inviteme-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=inviteme \
  -p 5432:5432 \
  -d postgres:15
```

## Database Configuration

1. **Create database:**
```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE inviteme;
CREATE USER inviteme_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE inviteme TO inviteme_user;
\q
```

2. **Set environment variable:**
```bash
# In packages/server/.env
DATABASE_URL=postgresql://inviteme_user:your_password@localhost:5432/inviteme
```

## Prisma Setup

1. **Install dependencies:**
```bash
cd packages/server
npm install
```

2. **Generate Prisma Client:**
```bash
npx prisma generate
```

3. **Run migrations:**
```bash
npx prisma migrate dev --name init
```

4. **Seed database (optional):**
```bash
npx prisma db seed
```

## Prisma Commands

- `npx prisma studio` - Open database GUI
- `npx prisma migrate dev` - Create and apply migration
- `npx prisma migrate deploy` - Apply migrations in production
- `npx prisma generate` - Generate Prisma Client
- `npx prisma db push` - Push schema changes without migration (dev only)

## Production Deployment

For production on your server (46.62.209.58):

1. **Install PostgreSQL:**
```bash
sudo apt install postgresql postgresql-contrib
```

2. **Create production database:**
```bash
sudo -u postgres createdb inviteme_prod
sudo -u postgres createuser inviteme_prod_user
sudo -u postgres psql -c "ALTER USER inviteme_prod_user WITH PASSWORD 'strong_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE inviteme_prod TO inviteme_prod_user;"
```

3. **Set production DATABASE_URL:**
```bash
DATABASE_URL=postgresql://inviteme_prod_user:strong_password@localhost:5432/inviteme_prod
```

4. **Run migrations:**
```bash
NODE_ENV=production npx prisma migrate deploy
```

## Backup & Restore

```bash
# Backup
pg_dump -U inviteme_user inviteme > backup.sql

# Restore
psql -U inviteme_user inviteme < backup.sql
```

