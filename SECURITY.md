# Security Policy for HAMA™

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 1.x.x   | ✅ Active development |

---

## Reporting a Vulnerability

We take security seriously. If you discover a vulnerability in HAMA, please report it privately **before** disclosing it publicly.

### How to Report

1. **Do not** open a public GitHub issue.
2. Send an email to: **security@hama.app** (replace with your actual security contact)
3. Alternatively, use **GitHub's private vulnerability reporting**:
   - Go to the repository on GitHub
   - Click **Security** → **Report a vulnerability**
   - Fill in the details

### What to Include

- **Type of vulnerability** (XSS, SQL injection, auth bypass, RLS misconfiguration, etc.)
- **Severity** (Critical, High, Medium, Low)
- **Affected component** (mobile app, Supabase, payment integration, API, etc.)
- **Steps to reproduce** — minimal, clear, and complete
- **Proof of concept** — if applicable (e.g., curl commands, code snippets, screenshots)
- **Impact** — what an attacker could achieve

### Response Timeline

| Timeframe | Action |
|-----------|--------|
| 24 hours | Initial acknowledgment of receipt |
| 5 business days | Severity assessment and triage |
| 14 days | Fix deployed for Critical/High issues |
| 30 days | Fix deployed for Medium/Low issues |

We'll keep you updated throughout the process and credit you in the release notes (unless you prefer to remain anonymous).

---

## Security Posture by Component

### 🔐 Supabase & Database

| Concern | Practice |
|---------|----------|
| **Row Level Security (RLS)** | Every table has RLS enabled. All client-side queries go through RLS policies. Never bypass RLS with the service role key client-side. |
| **Service Role Key** | Used only in server-side code and migration scripts. **Never** exposed in the mobile app, `.env` committed to git, or client-side bundles. |
| **Migrations** | All schema changes go through versioned migration files. No ad-hoc schema edits in production. |
| **SQL Injection** | All queries use Supabase JS client (parameterized queries). Raw SQL is never concatenated with user input. |
| **Least Privilege** | RLS policies grant the minimum access required. Anonymous users see only public data. Authenticated users see only their own data unless explicitly shared. |
| **RLS Bypass Prevention** | The `security definer` functions in migrations explicitly set `set search_path = ''` to prevent search-path injection attacks. |

### 💳 Payment Processing

| Concern | Practice |
|---------|----------|
| **Stripe** | Payment Intents API with client-side tokenization. **No raw card numbers** ever touch the app or server. Webhook signatures verified server-side. |
| **Paystack** | Transaction tokens used client-side. Server validates Paystack webhook signatures with secret key. |
| **M-Pesa** | Server handles STK Push and callback verification. No payment credentials stored on device. |
| **PCI Compliance** | We never store, log, or transmit raw card data. All payment processing is delegated to Stripe/Paystack/M-Pesa APIs. |

### 🔑 Authentication & Sessions

| Concern | Practice |
|---------|----------|
| **Supabase Auth** | Handles password hashing, session management, and token refresh automatically. |
| **Session Tokens** | Stored securely via `expo-secure-store` (encrypted at rest on device). |
| **Token Refresh** | Automatic refresh handled by Supabase client library before expiration. |
| **Password Policy** | Minimum 8 characters enforced by Supabase Auth. Consider enabling 2FA for admin accounts. |

### 📱 Mobile App Security

| Concern | Practice |
|---------|----------|
| **API Keys** | Supabase anon key is public by design (protected by RLS). Service role key is never bundled. |
| **Environment Variables** | All secrets stored in `.env` (git-ignored). `.env.example` contains only the Supabase project URL (no keys). |
| **Data Storage** | Sensitive user data cached via `AsyncStorage` (not encrypted). For production, migrate to `expo-secure-store` for sensitive values. |
| **Deep Links** | Validated to prevent spoofing. Only handle links matching registered URL schemes. |

### 🌐 API & Network

| Concern | Practice |
|---------|----------|
| **HTTPS** | All API communication is over HTTPS enforced by Supabase and payment providers. |
| **Request Validation** | Server-side endpoints validate and sanitize all incoming data. |
| **Rate Limiting** | Apply rate limiting on payment webhooks and auth endpoints at the infrastructure level. |

---

## Environment Variables & Secrets

### ✅ Do

- Keep `.env` in `.gitignore` — **never commit it**
- Use `.env.example` as a template with placeholder values only
- Rotate Supabase anon key and service role key regularly
- Use GitHub Actions secrets for CI environment variables
- Restrict access to production secrets to the minimum number of maintainers

### ❌ Don't

- Commit `.env` or any file containing real API keys
- Log environment variables, tokens, or payment data
- Share the Supabase service role key via chat, email, or public channels
- Hardcode fallback secrets in source code

### Required Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase Secrets (Server-Side Only)

```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
STRIPE_SECRET_KEY=sk_live_...
PAYSTACK_SECRET_KEY=sk_live_...
MPESA_CONSUMER_SECRET=...
```

---

## Security Checklist for Contributors

Before submitting a PR, verify:

- [ ] No secrets, API keys, or tokens in the code
- [ ] No raw SQL concatenation with user input
- [ ] Supabase queries use the client library, not raw SQL
- [ ] New tables have RLS enabled with appropriate policies
- [ ] Sensitive data (tokens, payment info) is not logged
- [ ] `.env` changes are reflected in `.env.example` (without real values)
- [ ] `security definer` functions include `set search_path = ''`
- [ ] No `any` type casts that could bypass TypeScript safety
- [ ] New dependencies are from trusted sources (npm registry)

---

## Dependency Management

- **Regular audits** — run `npm audit` before each release
- **Dependabot** — enabled for automated dependency update PRs
- **Review changes** — carefully review dependency updates before merging
- **Pin versions** — use exact versions in production to prevent unexpected breaking changes

```bash
# Check for known vulnerabilities
npm audit --audit-level=high

# Update dependencies safely
npm update --save
```

---

## Security Contacts

| Role | Contact |
|------|---------|
| Security Lead | security@hama.app |
| Lead Maintainer | maintainers@hama.app |
| Emergency | security@hama.app (24hr response) |

---

## Disclosure Policy

We follow **Coordinated Disclosure**:

1. Reporter submits vulnerability privately
2. We acknowledge within 24 hours
3. We develop and test a fix
4. We release the fix and notify users
5. We publicly disclose after the fix is deployed (with reporter's consent)
6. We credit the reporter in the release notes (optional)

---

## Hall of Fame

We appreciate the security community's help keeping HAMA safe. Contributors who report valid vulnerabilities will be acknowledged here (with permission).

*No entries yet — be the first!*

---

*Last updated: June 2026*
