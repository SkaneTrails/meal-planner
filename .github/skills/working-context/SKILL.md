---
## name: working-context description: Track active tasks and discovered issues per-branch, defer non-critical fixes without losing them license: MIT

# Skill: Working Context Management

This skill defines how to maintain persistent working context across conversations using `.copilot-tasks.md`.

---

## ⚠️ CRITICAL: Always Read the Tasks File

**At the start of EVERY conversation, you MUST:**

1. Read `.copilot-tasks.md` using `read_file`
2. Check for active tasks on the current branch
3. Check the General section for backlog and discovered issues
4. Acknowledge what you found before proceeding

**This is not optional.** The file contains important context that persists across conversations. Ignoring it means losing track of work in progress.

### Staleness and bloat checks

On read, also check for:

1. **Failure Tracking entries** - if count = 3+, promote now; if Last seen > 14 days, offer to prune
2. **Discovered Issues > 5** - "You have N deferred issues. Prioritize or prune?"
3. **Completed (Recent) > 5** - "Clean up completed tasks?"
4. **General Backlog > 10** - "Backlog is growing. Review?"

If issues found: "Found items needing attention: [list]. Address now?"

User-triggered cleanup:

- "clean up branches" - remove branch sections for deleted branches
- "clean up completed" - remove old completed items
- "prune failures" - remove Failure Tracking entries older than 7 days

---

## Activation context

This skill activates when:

- **Starting a new conversation** (ALWAYS read the file first)
- Detecting an issue while working on something else
- Developer says "add to TODO", "fix later", "note that", or similar
- Developer asks "what was I working on?" or "what issues did we find?"
- Switching branches
- Completing a task or set of tasks
- Conversation reset/summarization occurs

---

## File location and format

**File:** `.copilot-tasks.md` in the repository root (gitignored, local only)

**Structure:**

```markdown
# Copilot Working Context

## General

### Backlog
Items not tied to a specific branch:
- [ ] Feature idea or future work
- [ ] Refactoring task

### Discovered Issues
- [ ] `path/to/file.py:123` - issue found during other work
- [ ] `another/file.ts` - another deferred issue

```

### Completed (Recent)

- [x] 2026-01-28: Completed task description

```markdown
## Failure Tracking

| Pattern | Count | Last seen | Context | Fix when promoted |
| ------- | ----- | --------- | ------- | ----------------- |
| shell-escaping | 2 | 2026-02-02 | PowerShell quotes | Use array splatting |
```

______________________________________________________________________
---

## Branch: feature/some-feature

### Active Task
What you're currently working on for this branch

- Next step: Specific next action

### Deferred (Post-Merge)
- [ ] Performance: Issue deferred from PR review

### Completed
- [x] Step that was finished on this branch

---

## Branch: fix/some-bug

### Active Task
None - ready for new work

---

## Reference
Useful commands, DB names, or other persistent info
```

**Key principles:**
- **General section**: Backlog, discovered issues, and completed items not tied to a branch
- **Branch sections**: Only for branch-specific active tasks and completed work
- **No "Current Branch" header**: You already know what branch you're on from git

---

## Reading context

**At the start of EVERY conversation:**

1. **Read the file** - Use `read_file` on `.copilot-tasks.md`
2. **Check General section** - Note any backlog items or discovered issues
3. **Find current branch section** - Look for `## Branch: <current-branch>`
4. **Acknowledge context** - Briefly mention what you found:
   - "Continuing: <active task>" if there's work in progress
   - "You have N discovered issues" if there are deferred items
   - "Ready for new work" if no active task
5. If the Active Task has a "Next step", **verify it's still needed**:
   - "Last session, next step was: <step>. Still needed?"

---

## Updating Active Task

Update the Active Task section when:

1. **Starting new work**: Set the task description and first next step
1. **Completing a step**: Update "Next step" to the next action
1. **Completing the task**: Remove or mark as done, move any remaining items to Discovered Issues if needed

Example progression:

```markdown
### Active Task

Migrate Redis data from bastion to Memorystore

- Next step: Create dump.rdb from bastion Redis
```

→ After dump created:

```markdown
### Active Task

Migrate Redis data from bastion to Memorystore

- Next step: Import dump.rdb to Memorystore at 10.80.1.3
```

→ After migration complete:

```markdown
### Active Task

None - ready for new work

### Completed (Recent)

- [x] 2026-01-28: Migrate Redis to Memorystore
```

**When completing a task:**

1. Move task to "Completed (Recent)" section with date
1. Set Active Task to "None - ready for new work"
1. After 3+ completed tasks accumulate, offer: "Clean up completed tasks from TODO?"

---

## Discovering issues during work

When you notice an issue while working on something else:

1. **Assess if the issue blocks the current Active Task**

1. **If blocking:** Explain why and ask before switching:

   > "This issue blocks current work: <reason>. Need to fix before continuing. Proceed?"

1. **If non-blocking:** Ask whether to defer:

   > "I noticed `path/to/file.py:45` has a hardcoded timeout that should be in settings. Add to TODO or fix now?"

1. **Always ask** - never auto-switch to fixing without confirmation

1. **If deferring**, add to the appropriate section:
   - Branch-specific issue → Add to that branch's section
   - General issue → Add to `## General > ### Discovered Issues`

1. **Do not interrupt** the active task unless the developer confirms

---

## Branch switching

When the developer switches branches:

1. Save current branch context (Active Task + any new Discovered Issues)
1. Load context for the new branch (if exists)
1. If the new branch has an Active Task, mention it
1. If the new branch has Discovered Issues, mention the count

---

## Completing discovered issues

When working through Discovered Issues:

1. When fixed, mark as complete, for example:
   ```markdown
   - [x] `path/to/file.py:45` - hardcoded timeout fixed in abc1234
   ```
1. Periodically clean up completed items (after 3+ completed, offer to remove them)
1. Issues can be promoted to Active Task if the developer wants to focus on them

---

## Deferred issues from PR reviews

When addressing PR review feedback, some issues may be intentionally deferred:

### When to defer

- Issue is valid but out of scope for the current PR
- Fix requires broader architectural discussion
- Performance optimization that doesn't block functionality
- Security hardening that can be done post-merge

### Tracking deferred PR issues

1. **In the PR**: Add a comment explaining what's deferred and why
2. **In `.copilot-tasks.md`**: Add to the branch section under `### Deferred (Post-Merge)`

```markdown
### Deferred (Post-Merge)
- [ ] Performance: `get_all_recipes` full collection scan - optimize with Firestore queries
- [ ] Security: Cross-household recipe ID visibility in grocery endpoint
```

3. **Do NOT resolve** the review thread if you haven't fixed it - leave unresolved threads with explanatory comments

### After PR merges

When branch is merged:

1. Move deferred items from the branch section to `## General > ### Discovered Issues`
2. Remove the branch section (it no longer exists)
3. Prefix moved items with `[from PR #N]` for traceability

### On conversation start (if PR work was in progress)

Check for:
- Unresolved review threads that were deferred
- Items in `### Deferred (Post-Merge)` section
- Mention: "This branch has N deferred issues from PR review"

---

## Conversation reset handling

When a conversation is being summarized or reset:

1. Ensure `.copilot-tasks.md` is up to date with:
   - Current Active Task and next step
   - All Discovered Issues (checked and unchecked)
1. The file persists across conversations, so context is not lost

---

## Commands

The developer can use natural language:

| Intent          | Example phrases                                       |
| --------------- | ----------------------------------------------------- |
| Add issue       | "add to TODO", "fix later", "note that", "defer this" |
| View context    | "what was I working on?", "show TODO", "what issues?" |
| Clear completed | "clean up TODO", "remove completed items"             |
| Promote issue   | "let's fix the timeout issue now"                     |
| Update task     | "next step is X", "now working on Y"                  |

---

## File management

- **Creation**: **Always create the file immediately** when this skill activates and the file doesn't exist. Do not ask - just create it with the current branch context. This ensures context is never lost.
- **Gitignore**: Ensure `.copilot-tasks.md` is in `.gitignore` (add if missing)
- **Cleanup**: Offer to remove branches that no longer exist locally
- **Never commit**: This file is local working context only

---

## Multi-repo work

When working across multiple repositories (e.g., planner-meals-dev, planner-hikes-prod):

- Each repo has its own `.copilot-tasks.md`

- Copilot does not have cross-repo visibility of TODO files

- If developer mentions work affecting another repo, note it with a repo prefix:

  ```markdown
  - [ ] [planner-meals-dev] Update C4 diagram after routing changes
  - [ ] [planner-hikes-prod] Add new country to pipeline config
  ```

- These serve as reminders to address when switching to that repo

---

## Example workflow

1. Developer starts new conversation
1. **Copilot reads `.copilot-tasks.md`** (this is mandatory!)
1. Copilot finds Active Task on current branch: "Continuing: Add Memorystore support. Next step: Update connection.py"
1. While updating connection.py, Copilot notices hardcoded timeout
1. "I noticed a hardcoded timeout at line 45. Add to TODO or fix now?"
1. Developer: "TODO"
1. Copilot adds to General > Discovered Issues, continues with Active Task
1. Task complete, Copilot updates the branch section
1. "You have 1 discovered issue. Want to address it?"


______________________________________________________________________

## Failure tracking

Track recurring mistakes across conversations to trigger documentation.

### When to log

Log immediately when:

- A command, API call, or approach failed due to a pattern (not a typo)
- **The user corrects you** for a behavioral pattern (asking permission when you shouldn't, missing a step, wrong format)

User corrections are the highest-signal failures. If the user had to point it out, you missed it - log before addressing the correction.

### Logging sequence (critical)

1. **Recognize the failure** - command failed, or user corrected you
2. **Log to Failure Tracking table** - update `.copilot-tasks.md` NOW
3. **Then** address the issue - fix, retry, or respond

Do NOT: fix first, then log. Once you announce "Fixed" or "Applied," the task feels closed and logging gets forgotten.

### Before logging

Check if pattern is already documented:

1. Search relevant `*.instructions.md` for the pattern
2. Search relevant skill for the pattern
3. If found, do not add to Failure Tracking (already promoted)

### Table schema (strict)

```markdown
| Pattern | Count | Last seen | Context | Fix when promoted |
| ------- | ----- | --------- | ------- | ----------------- |
```

**Rules:**
- Never change the header row; only add/update data rows
- One row per pattern (no duplicates)
- Pattern: short identifier (e.g., `shell-escaping`, `json-quotes`)
- Count: integer, increment on each occurrence
- Last seen: YYYY-MM-DD format
- Context: brief description of the situation
- Fix when promoted: capture the working solution while fresh

### Logging format

Add or update a row in the Failure Tracking table:

```markdown
| shell-escaping | 1 | 2026-02-02 | PowerShell quotes in JSON | TBD |
```

If the pattern already exists, increment the count and update "Last seen".

### Threshold behavior

When count reaches **3**:

1. Document the fix in the appropriate file:
   - Shell/language patterns → `*.instructions.md`
   - Workflow patterns → relevant skill
   - External API behavior → `copilot-references.md`
2. Remove the row from Failure Tracking (it's now properly documented)
3. Announce: "Promoted [pattern] to [destination] after 3 occurrences."

### Pruning stale entries

When user says "prune failures" or "reset failure tracking":

- **Prune:** Remove rows with Last seen older than 7 days
- **Reset:** Clear all rows from the table

There is no automatic expiry; pruning is user-triggered.

### Reading at conversation start

When reading `.copilot-tasks.md`:
1. Check Failure Tracking table
2. If any patterns exist, keep them in mind for the session
3. If working in a context matching a tracked pattern, be extra careful

______________________________________________________________________

## Example workflow

1. Developer starts work on feature branch
2. Copilot reads `.copilot-tasks.md`, finds Active Task from previous session
3. "Continuing work on: Add Memorystore support. Next step: Update connection.py to use new Redis host"
4. While updating connection.py, Copilot notices hardcoded timeout
5. "I noticed a hardcoded timeout at line 45. Add to TODO or fix now?"
6. Developer: "TODO"
7. Copilot adds to Discovered Issues, continues with Active Task
8. Task complete, Copilot updates Active Task to "None"
9. "You have 1 discovered issue on this branch. Want to address it?"
