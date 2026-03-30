# ♻️ EcoPoints – Team GitHub Guide

## 🎯 Introduction
Welcome to the **EcoPoints Capstone Project**!  
This guide will help you use **Git & GitHub properly**, collaborate smoothly, and avoid messy merge conflicts.

---

# 🌿 Branch Structure

We use a strict 2-branch workflow to manage our code changes safely:
┌─────────────────────────────────────────────────────────────────────┐
│                          BRANCH STRUCTURE                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   main ──────────────────────────────────────────────────────────── │
│        │      (Final/Production - DO NOT TOUCH directly)            │
│        │                                                            │
│        └──────► dev ──────────────────────────────────────────────  │
│                 (Development - ALL TEAM MEMBERS WORK HERE)          │
│                      │                                              │
│                      ├── feature/your-feature-name                  │
│                      ├── fix/bug-description                        │
│                      └── update/what-you-changed                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

### 📌 Branch Rules

| Branch        | Purpose                          | Who Can Push |
|--------------|----------------------------------|-------------|
| `main`       | Final, stable production code    | Lead Dev only (via merge) |
| `dev`        | Active development branch        | ❌ No direct push (PR only) |
| `feature/*`  | New features                     | Team members |
| `fix/*`      | Bug fixes                        | Team members |
| `update/*`   | Refactors / updates              | Team members |

---

# 🚀 Getting Started

## 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-username/EcoPoints.git
cd EcoPoints
```

## 2️⃣ Switch to Dev Branch
```bash
git checkout dev
git pull origin dev
```

## 3️⃣ Create Your Branch (IMPORTANT)
Always branch from `dev`:

```bash
# Feature
git checkout -b feature/your-feature-name

# Bug Fix
git checkout -b fix/bug-description

# Update / Refactor
git checkout -b update/what-you-changed
```

### ✅ Example Names
- `feature/add-user-auth`
- `fix/points-calculation`
- `update/dashboard-ui`

---

# 💻 Daily Workflow

## 🔄 Before Starting Work
```bash
git checkout dev
git pull origin dev
git checkout -b feature/your-task-name
```

---

## ⚙️ While Working

### Check Changes
```bash
git status
```

### Stage Files
```bash
git add src/pages/YourFile.js
# OR
git add .
```

### Commit Changes
```bash
git commit -m "feat: add barcode scanner functionality"
```

---

# 🧠 Commit Message Guide

| Prefix     | Purpose               |
|----------- |-----------------------|
| `feat:`    | New feature           |
| `fix:`     | Bug fix               |
| `update:`  | Updates               |
| `style:`   | UI / CSS changes      |
| `refactor:`| Code restructuring    |
| `docs:`    | Documentation         |

---

# 📝 Pull Request (PR) Guide

## 🚀 Step 1: Push Your Branch
```bash
git push origin feature/your-task-name
```

## 🚀 Step 2: Create PR on GitHub

Set branches correctly:

Base: `dev`  
Compare: `feature/your-task-name`

---

## ✍️ PR Template

```md
## What does this PR do?
- Added user authentication
- Fixed mobile layout issue

## Files Changed
- components/Login.js
- styles/globals.css

## Testing Done
- Tested locally
- Verified database connection
```

---

# ⚠️ Important Rules

## ❌ NEVER DO
- Push directly to `main` or `dev`
- Force push (`git push -f`)
- Resolve others' conflicts without asking

## ✅ ALWAYS DO
- Create a branch per task
- Pull latest `dev` before working
- Test locally before pushing

# ✅ Pre-PR Checklist

- [ ] Runs locally without errors  
- [ ] Synced with latest `dev`  
- [ ] Clear commit messages  
- [ ] No API keys or sensitive data  

---

# 🎉 Final Note

> Clean commits = happy team 😄  
> Good workflow = fewer headaches 💀  

**Happy Coding! ♻️**





-------------------------------------------------------------------------


# FROM HERE, IS FOR dev BRANCH MONITOR

# 🆘 Troubleshooting

## ❗ Merge Conflicts

### What it looks like:
```text
<<<<<<< HEAD
Your code
=======
Incoming code
>>>>>>> dev
```

### Fix Steps:
1. Open file in IDE  
2. Choose correct code  
3. Remove markers (`<<<<<<<`, `=======`, `>>>>>>>`)  
4. Save and commit:

```bash
git add .
git commit -m "fix: resolve merge conflicts with dev"
```

---

## 🔄 Update Your Branch with Latest Dev

```bash
git fetch origin
git merge origin/dev
```

---
