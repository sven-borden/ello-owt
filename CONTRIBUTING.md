# Contributing to OWT Chess Elo Tracker

Thank you for your interest in contributing to the OWT Chess Elo Tracker! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- A Firebase account (free tier works fine)
- Basic knowledge of Next.js, React, and TypeScript

### Initial Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ello-owt.git
   cd ello-owt
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**

   **Option A: For OWT Swiss contributors (recommended)**
   - Contact the project owner to receive the Firebase environment variables
   - This allows you to use the existing OWT Firebase project and contribute immediately

   **Option B: Use your own Firebase project**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Firestore Database
   - Get your Firebase configuration values

4. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```

   - If you received env values from the project owner, paste them into `.env.local`
   - Otherwise, fill in your own Firebase configuration values
   - See [docs/SETUP_ADMIN_SDK.md](docs/SETUP_ADMIN_SDK.md) for detailed instructions

5. **Deploy Firestore rules and indexes** (only if using your own Firebase project)
   ```bash
   firebase login
   firebase use --add  # Select your Firebase project
   firebase deploy --only firestore:rules
   firebase deploy --only firestore:indexes
   ```

   **Note**: If you're using the OWT Firebase project with env values from the owner, you can skip this step.

6. **Start the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to see the app.

## Development Workflow

### Branching Strategy

- `master` - Production-ready code
- `feature/*` - New features (e.g., `feature/player-statistics`)
- `fix/*` - Bug fixes (e.g., `fix/elo-calculation`)
- `docs/*` - Documentation updates (e.g., `docs/improve-setup-guide`)

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed

3. **Test your changes**
   ```bash
   npm run build  # Ensure it builds without errors
   npm run lint   # Check for linting issues
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add player statistics dashboard"
   ```
   Use [conventional commits](https://www.conventionalcommits.org/):
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes (formatting, etc.)
   - `refactor:` - Code refactoring
   - `test:` - Adding tests
   - `chore:` - Maintenance tasks

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Go to GitHub and create a PR from your fork to the main repository
   - Fill out the PR template completely
   - Link any related issues

## Project Structure

```
/app                      # Next.js App Router pages
  /page.tsx              # Dashboard (leaderboard + match form)
  /matches/page.tsx      # Match history page
  /players/[id]/page.tsx # Individual player profile
  /api                   # Server-side API routes
    /record-match/route.ts  # Match recording with Elo calculation
    /add-player/route.ts    # Player creation
/components              # React components
  /LeaderboardCard.tsx   # Leaderboard display
  /AddPlayerForm.tsx     # Player creation form
  /MatchHistoryTable.tsx # Match history table
  /EloChart.tsx          # Elo rating chart (Recharts)
/lib                     # Utilities and configuration
  /firebase.ts           # Firebase client SDK initialization
  /firebase-admin.ts     # Firebase Admin SDK (server-side only)
  /elo.ts                # Elo rating constants
  /types.ts              # TypeScript type definitions
/docs                    # Project documentation
  /BRANDING.md           # Design system and color palette
  /SECURITY_ANALYSIS.md  # Security considerations
  /SETUP_ADMIN_SDK.md    # Firebase Admin setup guide
  /CLAUDE.md             # Detailed technical documentation
```

## Coding Standards

### TypeScript

- **Use strict typing** - Avoid `any` types
- **Import types from `lib/types.ts`**
- **Define component props** - Always type component props

Example:
```typescript
interface PlayerCardProps {
  player: Player;
  rank: number;
}

export function PlayerCard({ player, rank }: PlayerCardProps) {
  // ...
}
```

### React/Next.js

- **Use functional components** with hooks
- **Prefer server components** unless you need client interactivity
- **Use `'use client'` directive** only when necessary
- **Keep components small and focused** - Single responsibility principle

### Styling

- **Use Tailwind CSS** - No inline styles or CSS modules
- **Follow the design system** - Use colors from `tailwind.config.ts`
- **Responsive design** - Mobile-first approach
- **Consistent spacing** - Use Tailwind's spacing scale

### Code Quality

- **DRY (Don't Repeat Yourself)** - Extract reusable logic
- **Meaningful names** - Use clear, descriptive variable/function names
- **Small functions** - Keep functions focused and under 50 lines
- **Comments** - Explain "why", not "what"
- **Error handling** - Handle errors gracefully, provide user feedback

### Security

Before submitting code, review [docs/SECURITY_ANALYSIS.md](docs/SECURITY_ANALYSIS.md) and ensure:

- **Never expose sensitive data** in client-side code
- **Validate all inputs** on the server side
- **Use Firebase Admin SDK** for privileged operations
- **Sanitize user inputs** to prevent XSS
- **Use transactions** for atomic database operations

## Submitting Changes

### Pull Request Checklist

Before submitting a PR, ensure:

- [ ] Code builds without errors (`npm run build`)
- [ ] No linting errors (`npm run lint`)
- [ ] TypeScript types are properly defined
- [ ] Code follows project coding standards
- [ ] Documentation is updated if needed
- [ ] PR description clearly explains changes
- [ ] Related issues are linked
- [ ] Commit messages follow conventional commits format

### Pull Request Template

When creating a PR, the template will guide you through:

1. **Summary** - What does this PR do?
2. **Problem** - What issue does it solve?
3. **Solution** - How does it solve it?
4. **Testing** - How was it tested?
5. **Security** - Any security considerations?
6. **Breaking Changes** - Any breaking changes?

### Review Process

1. A maintainer will review your PR
2. Address any requested changes
3. Once approved, your PR will be merged
4. Your contribution will be acknowledged in release notes

## Reporting Issues

### Bug Reports

When reporting a bug, include:

- **Description** - Clear description of the bug
- **Steps to reproduce** - Detailed steps
- **Expected behavior** - What should happen
- **Actual behavior** - What actually happens
- **Environment** - Browser, OS, Node version
- **Screenshots** - If applicable

### Feature Requests

When requesting a feature, include:

- **Problem statement** - What problem does it solve?
- **Proposed solution** - How should it work?
- **Alternatives** - Other solutions you've considered
- **Additional context** - Mockups, examples, etc.

## Questions?

If you have questions:

1. Check the [docs/CLAUDE.md](docs/CLAUDE.md) for technical details
2. Review existing [GitHub Issues](https://github.com/sven-borden/ello-owt/issues)
3. Open a new issue with the `question` label

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to OWT Chess Elo Tracker! 🎉
