# 🔍 Guide: Tracking Code Changes & Debugging After Edits

## Table of Contents
1. [Understanding the Problem](#understanding-the-problem)
2. [Using Git to Track Changes](#using-git-to-track-changes)
3. [Finding What Changed](#finding-what-changed)
4. [Debugging After Code Changes](#debugging-after-code-changes)
5. [Prevention Strategies](#prevention-strategies)
6. [Team Collaboration Best Practices](#team-collaboration-best-practices)
7. [Tools & Techniques](#tools--techniques)
8. [Real-World Scenarios](#real-world-scenarios)

---

## Understanding the Problem

**Scenario:** 
> Your app was working fine yesterday. Today, someone on your team (or you) made changes, and now something is broken. How do you find out what changed and fix it?

**Common situations:**
- ❌ Feature that worked yesterday is now broken
- ❌ Tests that passed are now failing
- ❌ App crashes on startup
- ❌ API endpoints return errors
- ❌ UI looks different/broken

**Key Questions:**
1. **WHAT** changed? (Which files, which lines)
2. **WHO** changed it? (Which team member)
3. **WHEN** was it changed? (Exact time/commit)
4. **WHY** was it changed? (Commit message, issue tracker)
5. **HOW** do we fix it? (Revert, modify, or rewrite)

---

## Using Git to Track Changes

Git is your **time machine** and **detective tool** for code changes.

### 1️⃣ Check What Files Changed

```bash
# See uncommitted changes (what you just edited)
git status

# Example output:
# Changes not staged for commit:
#   modified:   client/src/pages/Alarm.tsx
#   modified:   server/routes.ts
#   deleted:    client/src/components/OldComponent.tsx
```

**What this tells you:**
- `modified` = File was edited
- `deleted` = File was removed
- `new file` = File was added

---

### 2️⃣ See Exactly What Changed

```bash
# See line-by-line changes (not yet committed)
git diff

# See changes in a specific file
git diff client/src/pages/Alarm.tsx

# See changes that are staged (ready to commit)
git diff --staged
```

**Example output:**
```diff
diff --git a/client/src/pages/Alarm.tsx b/client/src/pages/Alarm.tsx
index 1a2b3c4..5d6e7f8 100644
--- a/client/src/pages/Alarm.tsx
+++ b/client/src/pages/Alarm.tsx
@@ -45,7 +45,7 @@ export default function Alarm() {
-  const [alarmTime, setAlarmTime] = useState<string>("");
+  const [alarmTime, setAlarmTime] = useState<string>();
   
   const handleSubmit = async () => {
-    if (!alarmTime) return;
+    // Validation removed
   }
```

**How to read it:**
- `---` (red) = OLD code (removed)
- `+++` (green) = NEW code (added)
- `@@ -45,7 +45,7 @@` = Line numbers (old file, new file)

---

### 3️⃣ See Recent Commits (History)

```bash
# See last 10 commits
git log --oneline -10

# Example output:
# a1b2c3d Fix alarm validation
# e4f5g6h Add notification feature
# i7j8k9l Update database schema
# m0n1o2p Remove unused imports
```

**More detailed view:**
```bash
# See commits with full messages and changed files
git log --stat -5

# See commits with actual code changes
git log -p -3

# See commits by specific person
git log --author="John"

# See commits in last 24 hours
git log --since="24 hours ago"

# See commits that changed a specific file
git log client/src/pages/Alarm.tsx
```

---

### 4️⃣ See What a Specific Commit Changed

```bash
# Show changes in a commit
git show a1b2c3d

# Show only files changed
git show --name-only a1b2c3d

# Show stats (how many lines added/removed)
git show --stat a1b2c3d
```

---

### 5️⃣ Find Who Changed a Specific Line

```bash
# See who last modified each line in a file
git blame client/src/pages/Alarm.tsx

# Example output:
# a1b2c3d (John Doe 2026-02-20 15:30:45) const [alarmTime, setAlarmTime] = useState();
# e4f5g6h (Jane Smith 2026-02-19 10:15:30) const handleSubmit = async () => {
# a1b2c3d (John Doe 2026-02-20 15:30:45)   // Validation removed
```

**Shows:**
- Commit hash
- Who made the change
- When it was changed
- The actual line of code

**More focused blame:**
```bash
# Blame specific line range (lines 40-50)
git blame -L 40,50 client/src/pages/Alarm.tsx

# Ignore whitespace changes
git blame -w client/src/pages/Alarm.tsx
```

---

### 6️⃣ Compare Between Commits/Branches

```bash
# Compare current code with last commit
git diff HEAD

# Compare current code with 3 commits ago
git diff HEAD~3

# Compare two specific commits
git diff a1b2c3d e4f5g6h

# Compare current branch with main
git diff main

# Compare specific file between branches
git diff main..feature-branch client/src/pages/Alarm.tsx

# See what changed between yesterday and today
git diff "@{yesterday}" HEAD
```

---

### 7️⃣ Find When a Bug Was Introduced

```bash
# Binary search through commits to find when bug appeared
git bisect start

# Mark current commit as bad (has the bug)
git bisect bad

# Mark a known good commit (doesn't have bug)
git bisect good a1b2c3d

# Git will checkout middle commit - test it
# Then mark it as good or bad
git bisect good  # or git bisect bad

# Repeat until Git finds the problematic commit
# When done:
git bisect reset
```

**Example workflow:**
```bash
# Start bisect
git bisect start
git bisect bad                    # Current code is broken
git bisect good HEAD~10          # 10 commits ago it worked

# Git checks out middle commit
# Test: npm run dev, click around, see if bug exists

git bisect bad                    # Still broken
# Git checks out another commit
# Test again...

git bisect good                   # This one works!
# Continue until Git finds exact commit

# Output:
# a1b2c3d is the first bad commit
# commit a1b2c3d
# Author: John Doe
# Date: 2026-02-20
# 
#     Remove alarm validation
```

---

## Finding What Changed

### Scenario 1: "It worked yesterday, broken today"

**Step-by-step process:**

```bash
# 1. Check what's uncommitted
git status
git diff

# 2. If nothing uncommitted, check recent commits
git log --since="yesterday" --stat

# 3. Look for suspicious changes
git show <commit-hash>

# 4. Check if specific file changed
git log --since="yesterday" -- client/src/pages/Alarm.tsx

# 5. See who made changes
git log --since="yesterday" --pretty=format:"%h %an %s"
```

---

### Scenario 2: "Someone deleted/edited my code"

**Find what happened:**

```bash
# 1. Check file history
git log --all --full-history -- path/to/deleted/file.tsx

# 2. See when file was deleted
git log --diff-filter=D --summary

# 3. Recover deleted file
git checkout <commit-before-deletion> -- path/to/file.tsx

# 4. See who deleted it
git log --all --oneline --graph --decorate -- path/to/file.tsx
```

**For edited code:**

```bash
# 1. See line-by-line history of specific section
git log -L 15,30:client/src/pages/Alarm.tsx

# 2. See all changes to a function
git log -L :handleSubmit:client/src/pages/Alarm.tsx

# 3. Find when a specific line was changed
git log -S "setAlarmTime" client/src/pages/Alarm.tsx
```

---

### Scenario 3: "Function/variable disappeared"

**Find where it went:**

```bash
# Search for a function name across all commits
git log -S "functionName" --source --all

# Search for text in commit messages
git log --grep="alarm"

# Search in deleted files
git log --all --full-history -- "**/Alarm*"

# Find when a line containing specific text was removed
git log -S "const alarmTime" --all
```

---

## Debugging After Code Changes

### Process Flow

```
1. IDENTIFY what broke
   ↓
2. FIND when it broke
   ↓
3. LOCATE what changed
   ↓
4. UNDERSTAND why it broke
   ↓
5. FIX the issue
   ↓
6. VERIFY the fix
   ↓
7. PREVENT it from happening again
```

---

### Step 1: Identify What Broke

**Run the app and look for errors:**

```bash
# Start dev server
npm run dev

# Watch for errors in terminal
# Check browser console (F12)
```

**Run tests:**

```bash
# Run all tests
npm test

# Run specific test file
npm test Alarm.test

# Run in watch mode
npm test -- --watch
```

**Check build:**

```bash
# Try to build
npm run build

# Look for TypeScript errors
npx tsc --noEmit
```

---

### Step 2: Find When It Broke

**Use git bisect (automated):**

```bash
git bisect start
git bisect bad                    # Current version broken
git bisect good HEAD~20          # 20 commits ago it worked

# For each commit Git shows:
npm run dev                       # Test the app
# If broken:
git bisect bad
# If working:
git bisect good

# Git will find the exact commit
```

**Manual approach:**

```bash
# Checkout previous commits one by one
git log --oneline -20

git checkout a1b2c3d              # Try this commit
npm run dev                       # Test it

# If broken, try earlier commit
git checkout e4f5g6h
npm run dev

# When you find the breaking commit:
git checkout -                    # Return to current
```

---

### Step 3: Locate What Changed

Once you know the problematic commit:

```bash
# See what changed in that commit
git show a1b2c3d

# Focus on specific files
git show a1b2c3d -- client/src/pages/Alarm.tsx

# See just the file names
git show --name-only a1b2c3d

# See statistics
git show --stat a1b2c3d
```

---

### Step 4: Understand Why It Broke

**Analyze the changes:**

```typescript
// Example: Someone removed validation

// BEFORE (working):
const handleSubmit = async () => {
  if (!alarmTime) {
    toast.error('Please set an alarm time');
    return;
  }
  
  await createAlarm(alarmTime);
};

// AFTER (broken):
const handleSubmit = async () => {
  // Validation removed - now crashes if alarmTime is empty
  await createAlarm(alarmTime);
};
```

**Why it broke:**
- ❌ Validation was removed
- ❌ `alarmTime` can now be undefined
- ❌ `createAlarm()` expects a valid string
- ❌ Results in error: "Cannot process undefined time"

---

### Step 5: Fix the Issue

**Option A: Revert the commit**

```bash
# Undo the problematic commit
git revert a1b2c3d

# This creates a NEW commit that undoes the changes
# Safe for shared branches
```

**Option B: Fix the code manually**

```typescript
// Add validation back
const handleSubmit = async () => {
  if (!alarmTime) {
    toast.error('Please set an alarm time');
    return;
  }
  
  await createAlarm(alarmTime);
};
```

**Option C: Cherry-pick the good parts**

```bash
# If commit had both good and bad changes
# You can manually edit:

git revert --no-commit a1b2c3d
# Manually fix the parts you want to keep
git add .
git commit -m "Partially revert a1b2c3d - keep good changes"
```

---

### Step 6: Verify the Fix

```bash
# Run tests
npm test

# Start dev server
npm run dev

# Test the specific feature that broke
# Test related features
# Test edge cases

# Run full build
npm run build
```

---

### Step 7: Prevent Future Issues

**Add tests:**

```typescript
// Test that validation exists
describe('Alarm Form', () => {
  test('shows error when time is empty', async () => {
    render(<AlarmForm />);
    
    const submitButton = screen.getByText('Create Alarm');
    fireEvent.click(submitButton);
    
    expect(screen.getByText('Please set an alarm time')).toBeInTheDocument();
  });
});
```

**Add TypeScript checks:**

```typescript
// Make it impossible to pass undefined
function createAlarm(time: string) {  // Not string | undefined
  // TypeScript will catch if you try to pass undefined
}
```

**Add code comments:**

```typescript
// IMPORTANT: This validation prevents crashes when creating alarms
// Do not remove without updating createAlarm() to handle empty values
if (!alarmTime) {
  toast.error('Please set an alarm time');
  return;
}
```

---

## Prevention Strategies

### 1️⃣ Code Reviews

**Before merging code:**

```bash
# Create a pull request (PR)
# Team reviews changes
# Catches issues before they reach main branch
```

**GitHub/GitLab PR checklist:**
- [ ] Code follows project standards
- [ ] Tests added/updated
- [ ] No breaking changes (or documented)
- [ ] Related code still works
- [ ] Documentation updated

---

### 2️⃣ Protected Branches

**In GitHub/GitLab settings:**

```
main branch → Settings → Branch Protection
✅ Require pull request reviews
✅ Require status checks to pass
✅ Require branches to be up to date
✅ Require conversation resolution
```

**Prevents:**
- Direct pushes to main
- Merging without reviews
- Merging failing code

---

### 3️⃣ Automated Testing

**Set up CI/CD:**

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test
      - name: Build
        run: npm run build
```

**Benefits:**
- Tests run on every commit
- Catches errors immediately
- Prevents broken code from merging

---

### 4️⃣ Pre-commit Hooks

**Install Husky:**

```bash
npm install --save-dev husky
npx husky install
```

**Add pre-commit hook:**

```bash
npx husky add .husky/pre-commit "npm test"
npx husky add .husky/pre-commit "npm run lint"
```

**Now every commit automatically:**
- Runs tests
- Runs linter
- Fails if issues found

---

### 5️⃣ Good Commit Messages

```bash
# ❌ Bad
git commit -m "fix"
git commit -m "update"
git commit -m "changes"

# ✅ Good
git commit -m "fix: restore alarm validation to prevent crashes"
git commit -m "feat: add user authentication"
git commit -m "refactor: extract alarm logic to separate hook"
```

**Format:**
```
<type>: <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructure (no behavior change)
- `test`: Adding/updating tests
- `docs`: Documentation
- `chore`: Maintenance (dependencies, etc.)

---

## Team Collaboration Best Practices

### 1️⃣ Communication

**Before making big changes:**

```
👤 Developer: "I'm going to refactor the alarm system"
👥 Team: "Wait, I'm working on alarm notifications"
👤 Developer: "Let's coordinate - you finish first"
```

**Use project management:**
- Create tickets/issues
- Assign to yourself
- Update status
- Comment on progress

---

### 2️⃣ Branching Strategy

**Git Flow approach:**

```bash
main            → Production-ready code
  ↓
develop         → Development branch
  ↓
feature/alarm   → Your feature
```

**Workflow:**

```bash
# Create feature branch
git checkout develop
git pull
git checkout -b feature/alarm-notifications

# Make changes
git add .
git commit -m "feat: add alarm notifications"

# Push to remote
git push origin feature/alarm-notifications

# Create pull request on GitHub/GitLab
# Team reviews
# Merge to develop
# Later, develop → main for release
```

---

### 3️⃣ Handling Conflicts

**When your code conflicts with teammate's:**

```bash
# Update your branch with latest changes
git checkout feature/your-branch
git pull origin develop

# If conflicts:
# CONFLICT (content): Merge conflict in client/src/pages/Alarm.tsx
```

**Resolve conflicts:**

```typescript
// File shows both versions:
<<<<<<< HEAD (your changes)
const [alarmTime, setAlarmTime] = useState<string>();
=======
const [alarmTime, setAlarmTime] = useState<string>("");
>>>>>>> develop (their changes)

// Choose one or combine:
const [alarmTime, setAlarmTime] = useState<string>("");  // Keep their version

// Then:
git add client/src/pages/Alarm.tsx
git commit -m "merge: resolve alarm state conflict"
```

---

### 4️⃣ Daily Sync

**Start of day:**

```bash
# Get latest changes
git checkout develop
git pull

# Update your feature branch
git checkout feature/your-branch
git merge develop
```

**Prevents:**
- Large conflicts later
- Working on outdated code
- Duplicate work

---

## Tools & Techniques

### Visual Tools

#### 1️⃣ **VS Code Git Integration**

**Built-in features:**
- Source Control panel (Ctrl+Shift+G)
- See changes inline
- Stage/unstage files
- Commit with GUI
- View history

**GitLens extension:**
```bash
# Install GitLens
code --install-extension eamodio.gitlens
```

**Features:**
- Blame annotations inline
- Hover over line to see who changed it
- View file history
- Compare with previous versions
- Rich commit search

---

#### 2️⃣ **GitHub Desktop**

GUI for Git:
- Visual diff viewer
- Easy branch switching
- Commit history
- Pull request integration

---

#### 3️⃣ **Git GUI Tools**

**SourceTree** (Free):
- Visual branch graph
- Interactive rebase
- Stash management

**GitKraken** (Free for public repos):
- Beautiful visual interface
- Merge conflict editor
- Integration with GitHub/GitLab

---

### Advanced Git Commands

#### **Stash changes temporarily:**

```bash
# Save uncommitted changes
git stash

# Apply them later
git stash pop

# Stash with message
git stash save "Work in progress on alarm feature"

# List stashes
git stash list

# Apply specific stash
git stash apply stash@{0}
```

**Use case:** Need to switch branches but not ready to commit

---

#### **Undo changes:**

```bash
# Undo changes in working directory (not committed)
git checkout -- client/src/pages/Alarm.tsx

# Undo all uncommitted changes
git reset --hard

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Undo changes to a specific file from last commit
git checkout HEAD -- client/src/pages/Alarm.tsx
```

---

#### **Amend last commit:**

```bash
# Forgot to add a file to last commit
git add forgotten-file.tsx
git commit --amend --no-edit

# Change commit message
git commit --amend -m "New message"
```

---

#### **Interactive rebase:**

```bash
# Clean up last 3 commits
git rebase -i HEAD~3

# Opens editor with:
# pick a1b2c3d First commit
# pick e4f5g6h Second commit
# pick i7j8k9l Third commit

# Change to:
# pick a1b2c3d First commit
# squash e4f5g6h Second commit  ← Combines with previous
# reword i7j8k9l Third commit   ← Edit message
```

---

## Real-World Scenarios

### Scenario 1: "Alarm feature broke after teammate's commit"

**Investigation:**

```bash
# 1. Check recent commits
git log --oneline -10

# Output:
# a1b2c3d (HEAD) Add user profile
# e4f5g6h Update alarm component  ← Suspicious!
# i7j8k9l Fix typo

# 2. See what changed in alarm commit
git show e4f5g6h

# Output shows validation was removed

# 3. Who did it?
git show e4f5g6h --format="%an %ae"
# John Doe john@example.com

# 4. Why did they do it?
git show e4f5g6h --format="%B"
# "Update alarm component
#  - Cleaned up code
#  - Removed unnecessary checks"  ← They thought validation was unnecessary!
```

**Resolution:**

```bash
# Option 1: Talk to teammate
# "Hey John, I see you removed alarm validation in e4f5g6h.
#  This is causing crashes when users don't fill the time.
#  Can we add it back?"

# Option 2: Fix it yourself
git checkout -b fix/restore-alarm-validation
# Add validation back
git commit -m "fix: restore alarm validation removed in e4f5g6h"
# Create PR

# Option 3: Revert their commit
git revert e4f5g6h
git commit -m "revert: restore alarm validation for safety"
```

---

### Scenario 2: "Can't find where calculatePoints function went"

**Investigation:**

```bash
# 1. Search for function in history
git log -S "calculatePoints" --all

# Output:
# a1b2c3d Refactor points system
# m0n1o2p Add gamification

# 2. Check the refactor commit
git show a1b2c3d

# Output shows:
# - function calculatePoints() { ... }  ← Removed
# + // Moved to lib/gamification.tsx   ← Comment shows where!

# 3. Verify it's there
git show a1b2c3d:client/src/lib/gamification.tsx | grep -A 10 "calculatePoints"
```

**Resolution:**

```typescript
// Update imports
// Before:
import { calculatePoints } from './points';

// After:
import { calculatePoints } from '@/lib/gamification';
```

---

### Scenario 3: "Tests passed yesterday, failing today"

**Investigation:**

```bash
# 1. Run tests to see what fails
npm test

# Output:
# FAIL client/src/pages/Alarm.test.tsx
#   ✕ creates alarm with valid time (15ms)
#   Expected: toast.success called
#   Received: toast.error called

# 2. Find when test started failing
git bisect start
git bisect bad                    # Current version fails
git bisect good HEAD~5           # 5 commits ago it passed

# Git checks out middle commits
# For each:
npm test
git bisect good  # or bad

# Output:
# e4f5g6h is the first bad commit
# - Changed validation logic

# 3. See what changed
git show e4f5g6h
```

**Resolution:**

```typescript
// Update test to match new validation logic
// OR fix the code if validation is wrong
```

---

## Quick Reference

### Most Used Commands

```bash
# See what changed
git status                        # Uncommitted changes
git diff                          # Line-by-line changes
git log --oneline -10            # Recent commits

# Find changes
git log -- <file>                 # File history
git blame <file>                  # Line-by-line authors
git show <commit>                 # Commit details

# Compare
git diff HEAD~1                   # vs last commit
git diff main..feature           # Between branches

# Undo
git checkout -- <file>            # Discard changes
git reset --soft HEAD~1          # Undo commit, keep changes
git revert <commit>               # Create commit that undoes

# Find bugs
git bisect start                  # Binary search for bug
git log -S "text"                 # Find when text was added/removed
```

---

## Summary

**When code breaks after changes:**

1. ✅ **Don't panic** - Git tracks everything
2. ✅ **Use `git status` and `git diff`** - See uncommitted changes
3. ✅ **Use `git log`** - See commit history
4. ✅ **Use `git show`** - See what changed in a commit
5. ✅ **Use `git blame`** - See who changed a line
6. ✅ **Use `git bisect`** - Find when bug was introduced
7. ✅ **Communicate** - Talk to your team
8. ✅ **Fix carefully** - Test thoroughly
9. ✅ **Prevent** - Add tests, code reviews, CI/CD

**Remember:** 
- Git is your safety net
- Every change is tracked
- You can always undo
- Deleted code can be recovered
- Communication prevents conflicts

---

**Pro Tip:** Set up Git aliases to save time:

```bash
# Add to ~/.gitconfig
[alias]
  st = status
  co = checkout
  br = branch
  ci = commit
  unstage = reset HEAD --
  last = log -1 HEAD
  visual = log --oneline --graph --decorate --all
  who = shortlog -s -n
  changes = log --oneline --stat
```

Now use: `git st` instead of `git status`, etc.

---

*Last Updated: February 25, 2026*
