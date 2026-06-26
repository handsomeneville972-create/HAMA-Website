# Contributing to HAMA™

Thank you for your interest in contributing to HAMA! We appreciate every contribution — whether it's a bug report, feature suggestion, UI improvement, or code change.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Code Style Guidelines](#code-style-guidelines)
- [Pull Request Process](#pull-request-process)
- [Commit Guidelines](#commit-guidelines)
- [Testing](#testing)
- [Database Migrations](#database-migrations)
- [Reporting Issues](#reporting-issues)

---

## Code of Conduct

By participating in this project, you agree to:

- **Be respectful** — treat others with empathy and professionalism.
- **Be constructive** — focus on solutions, not blame.
- **Be inclusive** — we welcome contributors of all backgrounds and experience levels.
- **Be patient** — maintainers review contributions as time permits.

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Expo CLI (`npm install -g expo-cli`)
- A Supabase account (free tier) for database features
- Git for Windows (if on Windows)

### Local Setup

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/hama.git
cd hama

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase project credentials

# Start the development server
npx expo start
```

> **Note:** The `.env` file is git-ignored. Never commit it or share your Supabase service role key.

## Development Workflow

### Branch Naming

Use descriptive branch names with a prefix:

| Prefix | Use Case | Example |
|--------|----------|---------|
| `feat/` | New feature | `feat/property-map-view` |
| `fix/` | Bug fix | `fix/login-validation` |
| `ui/` | UI/UX improvements | `ui/card-animations` |
| `refactor/` | Code refactoring | `refactor/auth-context` |
| `docs/` | Documentation | `docs/api-endpoints` |
| `chore/` | Maintenance | `chore/update-expo-sdk` |

### Development Cycle

```bash
# 1. Pull latest changes from main
git checkout main
git pull origin main

# 2. Create your feature branch
git checkout -b feat/your-feature-name

# 3. Make changes and test locally
# 4. Run checks before committing
npm test
npx tsc --noEmit

# 5. Commit your changes
git add .
git commit -m "feat: add property map view"

# 6. Push and create a pull request
git push origin feat/your-feature-name
```

## Project Structure

```
HAMA/
├── app/                    # Expo Router pages
│   ├── (tabs)/             # Bottom tab navigation
│   └── About.tsx           # Stack screens
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── GlassCard.tsx   # Glassmorphism card
│   │   ├── PricingCard.tsx # Subscription pricing card
│   │   ├── ThumbnailCard.tsx # YouTube-style thumbnail card
│   │   └── ...             # Other components
│   ├── config/             # App configuration
│   ├── constants/          # Theme, types, mock data
│   │   ├── theme.ts        # Colors, spacing, fonts, shadows
│   │   ├── types.ts        # TypeScript interfaces & types
│   │   └── data.ts         # Mock/fallback data
│   ├── contexts/           # React contexts
│   │   ├── AuthContext.tsx  # Authentication state
│   │   └── EarlyAccessContext.tsx  # Early Access Program state
│   ├── hooks/              # Custom React hooks
│   ├── screens/            # Screen components
│   ├── services/           # API and Supabase services
│   ├── utils/              # Helpers & utilities
│   │   ├── analytics.ts    # Event tracking
│   │   ├── currency.ts     # Price formatting
│   │   └── supabaseClient.ts  # Supabase client init
│   └── lib/                # Shared libraries
├── supabase/
│   └── migrations/         # Database schema migrations
├── server/                 # Server-side code (Paystack, Stripe, M-Pesa)
└── .github/workflows/      # CI configuration
```

## Code Style Guidelines

### TypeScript & React

- **Use TypeScript** for all new files. Avoid `any` types — prefer generics, union types, or `unknown`.
- **Functional components** with hooks — no class components.
- **Props interfaces** — define and export prop types for all components.
- **Early returns** — handle loading, error, and empty states explicitly.

```typescript
// Good
interface UserProfileProps {
  userId: string;
  onUpdate: (user: User) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userId, onUpdate }) => {
  // ...component logic
};

// Avoid
const UserProfile = (props: any) => { ... };
```

### Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Files & folders | `kebab-case` | `payment-modal.tsx`, `early-access-context.tsx` |
| Components | `PascalCase` | `GlassCard`, `PricingCard` |
| Functions & variables | `camelCase` | `formatPrice()`, `isLoading` |
| Constants & enums | `UPPER_SNAKE_CASE` | `COLORS`, `EARLY_ACCESS_CONFIG` |
| Types & interfaces | `PascalCase` | `UserProfile`, `SubscriptionPlan` |
| CSS/RN styles | `camelCase` | `styles.container`, `styles.headerTitle` |

### Styling

- Use the `COLORS`, `SPACING`, `RADIUS`, `FONTS`, and `SHADOWS` constants from `src/constants/theme.ts`. Never hardcode values.
- Prefer `StyleSheet.create()` over inline styles.
- Organize styles at the bottom of the file.

```typescript
// Good
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: SPACING.md,
  },
});
```

### Imports Order

Group imports in this order, separated by a blank line:

1. React & React Native
2. Third-party libraries (expo, ionic, gradient)
3. Project components
4. Project contexts, hooks, services
5. Constants, config, utils
6. Types

```typescript
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { GlassCard } from '../components/GlassCard';
import { useAuth } from '../contexts/AuthContext';
import { COLORS, SPACING, FONTS } from '../constants/theme';
```

### Supabase & Database

- **Migrations only** — never modify the database schema manually. All changes go through `supabase/migrations/`.
- **Use RLS** — every table must have Row Level Security enabled.
- **Service role key** — only use in server-side code or migration scripts. Never expose it client-side.
- **Environment variables** — all API keys and secrets come from `.env`. Never hardcode them.

## Pull Request Process

1. **Create a feature branch** from `main` using the naming convention above.
2. **Make your changes** following the code style guidelines.
3. **Run checks locally:**
   ```bash
   npx tsc --noEmit        # Type check
   npm test                # Run tests
   ```
4. **Write or update tests** for your changes.
5. **Update documentation** if you add or change features.
6. **Create a pull request** with a clear description of what you changed and why.
7. **Link related issues** — use `Closes #123` or `Fixes #456` in the PR description.
8. **Request reviewers** — at least one maintainer must approve.
9. **Address feedback** — make requested changes and re-request review.
10. **Merge** — once approved, squash-merge into `main`.

### PR Checklist

- [ ] Code follows the project's style guidelines
- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] All tests pass (`npm test`)
- [ ] New components have prop types defined
- [ ] No hardcoded colors, spacing, or font sizes (use theme constants)
- [ ] No `.env` variables or secrets in code
- [ ] Database changes have a migration file
- [ ] Documentation is updated (README, comments, etc.)

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | When to Use |
|------|-------------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `ui` | UI/UX changes (not feature-related) |
| `refactor` | Code restructuring |
| `docs` | Documentation changes |
| `test` | Adding or updating tests |
| `chore` | Build, CI, dependencies |
| `db` | Database migrations |

### Examples

```
feat(property): add interactive map view for listings
fix(auth): resolve token refresh on app foreground
ui(cards): update property card animations
refactor(services): split supabase service into modules
docs(readme): add deployment instructions
db(migrations): add feature requests table
chore(deps): upgrade expo SDK to 52
```

## Testing

- **Jest** is the test runner. Configuration is in `jest.config.js`.
- Tests live alongside source files in `__tests__/` directories.
- Name test files `*.test.ts` or `*.test.tsx`.

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

### What to Test

- Utility functions (currency formatting, validation, etc.)
- Service layer logic (where possible without network calls)
- Critical business logic
- **Not required:** UI component rendering (snapshot tests are not used in this project)

## Database Migrations

All database schema changes must go through Supabase migrations.

### Creating a Migration

1. Create a new file in `supabase/migrations/` with the naming format:
   ```
   YYYYMMDDHHMMSS_description.sql
   ```

2. Follow the existing migration patterns:
   - `create table if not exists`
   - `alter table ... enable row level security`
   - `DROP POLICY IF EXISTS ...; create policy ...`
   - `create index if not exists ...`

3. Test your migration by running it in the Supabase SQL Editor.

### Migration Order

Migrations are applied in order. Never modify an existing migration file — create a new one.

```
supabase/migrations/
├── 20240620000001_initial_schema.sql
├── 20240620000002_data_tables.sql
├── 20240620000003_seed_data.sql
├── 20240620000004_early_access_features.sql
└── 20240620000005_feature_requests.sql
```

## Reporting Issues

### Bug Reports

When reporting a bug, include:

- **Summary** — brief description of the issue
- **Steps to reproduce** — detailed steps
- **Expected behavior** — what should happen
- **Actual behavior** — what happens instead
- **Environment** — device, OS version, app version, Expo SDK version
- **Screenshots** — if applicable
- **Error logs** — from the console or device logs

### Feature Requests

Use the Feature Request Portal within the app, or open a GitHub issue with:

- **Title** — clear, descriptive name
- **Description** — what you want and why
- **Use case** — how this helps users
- **Alternatives** — any workarounds you've considered

---

*Thank you for contributing to HAMA! Every contribution makes finding a home easier for someone.*
