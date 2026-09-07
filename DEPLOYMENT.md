# Deployment Guide — Investor Outreach OS

This guide walks you through deploying the app to your own Supabase + Vercel stack with a custom subdomain.

---

## 1. Create a Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and sign in.
2. Click **New Project**.
3. Choose your organization, give it a name (e.g. `investor-outreach`), set a strong database password, and pick a region close to your users.
4. Wait for the project to be provisioned (~2 minutes).

### Disable Public Signups

> [!IMPORTANT]
> This is critical — without this, anyone could create an account.

1. In your Supabase project, go to **Authentication → Providers → Email**.
2. **Disable** "Enable Sign Up" (uncheck the checkbox).
3. Confirm that only manually-created users can log in.

### Collect Your Credentials

From **Project Settings → API**:

| Value | Env Var |
|-------|---------|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` / `public` key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` key | `SUPABASE_SERVICE_ROLE_KEY` |

From **Project Settings → Database → Connection String**:

| Value | Env Var |
|-------|---------|
| Connection string (Transaction mode / Supavisor) | `DATABASE_URL` |
| Connection string (Session mode / Direct) | `DIRECT_URL` |

> [!TIP]
> For the connection strings, use the **URI** format. Replace `[YOUR-PASSWORD]` with the database password you set during project creation.

---

## 2. Configure Environment Variables (Local Dev)

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in all the Supabase values collected above. Generate an encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 3. Run Database Migrations

With your `.env.local` configured:

```bash
# Install dependencies
npm install

# Push the Prisma schema to your Supabase database
npx prisma db push

# Or, if you prefer migration-based workflow:
npx prisma migrate deploy
```

---

## 4. Create Your First Admin User

Since there's no public signup, you create users via the included CLI script:

```bash
npm run create-user -- admin@yourcompany.com "YourSecurePassword123!"
```

This creates:
- A confirmed user in Supabase Auth (no email verification needed)
- An associated Workspace record in the app database

You can create additional users the same way:

```bash
npm run create-user -- colleague@yourcompany.com "AnotherSecurePass456!"
```

---

## 5. Deploy to Vercel

### 5a. Push to Your Own Git Repo

```bash
# Initialize a new repo (if not already)
git init
git remote add origin https://github.com/your-org/investor-outreach.git
git add .
git commit -m "Initial commit — internal deployment"
git push -u origin main
```

### 5b. Import in Vercel

1. Go to [https://vercel.com/new](https://vercel.com/new).
2. Import your GitHub repository.
3. Framework Preset: **Next.js** (auto-detected).
4. Set all environment variables (see section below).
5. Click **Deploy**.

### 5c. Set Environment Variables in Vercel

Go to **Project → Settings → Environment Variables** and add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | All |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Production only |
| `DATABASE_URL` | `postgresql://...` (Transaction mode) | All |
| `DIRECT_URL` | `postgresql://...` (Session mode) | All |
| `ENCRYPTION_KEY` | 64-char hex string | All |
| `GOOGLE_CLIENT_ID` | Your Google OAuth client ID | All |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth secret | All |
| `GOOGLE_REDIRECT_URI` | `https://app.yourcompany.com/api/auth/callback/google` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://app.yourcompany.com` | Production |
| `CRON_SECRET` | Random secret string | All |
| `GMAIL_MOCK_MODE` | `false` | Production |

> [!WARNING]
> Never add `SUPABASE_SERVICE_ROLE_KEY` to client-side / `NEXT_PUBLIC_` variables. It has full admin access to your database.

---

## 6. Connect a Custom Subdomain

To point `app.yourcompany.com` at your Vercel deployment:

### 6a. Add Domain in Vercel

1. Go to **Project → Settings → Domains**.
2. Enter `app.yourcompany.com` and click **Add**.
3. Vercel will show you the required DNS record.

### 6b. Configure DNS

In your DNS provider (Cloudflare, Namecheap, Route53, etc.), add:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| **CNAME** | `app` | `cname.vercel-dns.com` | 300 |

> [!NOTE]
> If you're using Cloudflare, set the proxy status to **DNS only** (gray cloud) initially, then enable proxy after verification.

### 6c. Verify

1. Wait 5-10 minutes for DNS propagation.
2. Vercel will automatically provision an SSL certificate.
3. Visit `https://app.yourcompany.com` — you should see the login page.

### 6d. Update Environment Variables

After the subdomain is live, update these in Vercel:

```
NEXT_PUBLIC_APP_URL=https://app.yourcompany.com
GOOGLE_REDIRECT_URI=https://app.yourcompany.com/api/auth/callback/google
```

Then redeploy: **Project → Deployments → ⋯ → Redeploy**.

---

## Ongoing Operations

### Adding New Users

```bash
# Locally (with .env.local configured)
npm run create-user -- newuser@company.com "Password123!"
```

Or create users directly in **Supabase Dashboard → Authentication → Users → Add User**.

### Running Campaign Engine

The campaign processing endpoints are protected by `CRON_SECRET`. To trigger them:

```bash
curl -X POST https://app.yourcompany.com/api/engine/process-campaigns \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Set up Vercel Cron Jobs or an external scheduler to call these periodically.
