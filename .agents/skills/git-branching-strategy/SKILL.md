---
name: git-branching-strategy
description: Git branching model, branch naming conventions, commit message standards, and merge/rebase policies for maintaining a clean and traceable history.
---

# Git Branching Strategy

This skill defines the branching model, naming conventions, and merge policies for this project. It aligns with a **trunk-based development** approach with short-lived feature branches, optimized for frequent integration and CI/CD pipelines.

<HARD-GATE>
Do NOT create branches, craft commit messages, or perform any git operation without following the conventions in this skill. If the user requests an action that violates these policies (e.g., committing directly to `main`, force-pushing to a shared branch), the agent must refuse and explain why, then propose the compliant alternative.
</HARD-GATE>

---

## 1. Branch Model Overview

```
main (protected)
 └── feat/user-authentication
 └── fix/order-total-calculation
 └── chore/upgrade-dependencies
 └── release/v1.2.0  (if needed)
 └── hotfix/critical-payment-bug
```

- **`main`**: Always deployable. Protected. Never commit directly (AI policy). All changes arrive via Pull Requests.
- **`feat/*`**: New features or capabilities.
- **`fix/*`**: Bug fixes for non-critical issues.
- **`chore/*`**: Maintenance tasks: dependency upgrades, config changes, refactors without behavior change.
- **`docs/*`**: Documentation-only changes.
- **`test/*`**: Adding or fixing tests without touching production code.
- **`release/*`**: Release preparation branches (optional, used for staged releases).
- **`hotfix/*`**: Critical production fixes branched off `main`, merged back immediately.

---

## 2. Branch Naming Convention

Format: `<type>/<short-kebab-case-description>`

| ✅ Good | ❌ Bad |
|---|---|
| `feat/user-email-verification` | `feature_user` |
| `fix/cart-empty-on-reload` | `bugfix` |
| `chore/update-eslint-config` | `my-branch` |
| `hotfix/payment-timeout-crash` | `fix123` |

Rules:
- Max **50 characters** total for the branch name.
- Use only **lowercase letters, numbers, and hyphens** — no underscores or slashes beyond the type prefix.
- Be specific enough to understand the branch purpose without reading the commits.

---

## 3. Commit Message Standard

Follow **Conventional Commits** (`https://www.conventionalcommits.org`):

```
<type>(<scope>): <short imperative description>

[optional body: explain WHY, not WHAT — max 72 chars per line]

[optional footer: BREAKING CHANGE: ..., Closes #123]
```

**Allowed types:** `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`, `style`, `ci`, `build`

**Rules:**
- Subject line: **50 characters max**, imperative mood ("add", "fix", "remove" — not "added").
- Scope: the module or domain area impacted (e.g., `auth`, `order`, `user`).
- Body: explain the *reason* for the change, not the mechanics.
- One logical change per commit. If a diff touches unrelated concerns, suggest splitting.

**Examples:**
```
feat(auth): add JWT refresh token rotation

Tokens were previously single-use with no refresh mechanism,
causing users to be logged out after 1 hour. This adds sliding
session support via opaque refresh tokens stored server-side.

Closes #47
```

```
fix(order): correct total when discount exceeds subtotal
```

---

## 4. Merge Policy

- **Always use Pull Requests** — even for solo developers (forces a review checkpoint).
- Prefer **squash merge** for feature branches to keep `main` history clean and linear.
- Use **rebase** to keep your branch up-to-date with `main` before merging — never merge `main` into your branch (avoids noisy merge commits).
- **Never force-push** to `main` or shared branches. Force-push is only acceptable on your own local feature branch before the PR is opened.
- Delete branches **immediately after merging**.

---

## 5. Agent Behavior & Escalation Protocol

When helping with git operations, the agent must:

1. **Always suggest the correct branch type and name** before starting any feature or fix.
2. **Refuse to commit directly to `main`** — if asked, explain the risk and propose creating a proper branch instead.
3. **Always generate Conventional Commits messages** when crafting commit messages.
4. **Warn the user** if a branch has been open for more than a few days and suggest rebasing from `main`.
5. **Suggest splitting commits** when a diff contains multiple unrelated changes.

When a user requests a git operation that violates this strategy:

- Do NOT silently comply.
- Explain the specific convention being violated and the reason it exists.
- Propose the policy-compliant alternative.
- If the user explicitly insists after the explanation, respect their decision but add a brief warning comment.
