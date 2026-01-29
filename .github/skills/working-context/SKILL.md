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

### Completed (Recent)
- [x] 2026-01-28: Completed task description

---

## Branch: feature/some-feature

### Active Task
What you're currently working on for this branch

- Next step: Specific next action

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

When working across multiple repositories (e.g., sbpaa-geospatial-routing, sbpaa-ingka-geoview, sbpaa-ingka-geospatial):

- Each repo has its own `.copilot-tasks.md`

- Copilot does not have cross-repo visibility of TODO files

- If developer mentions work affecting another repo, note it with a repo prefix:

  ```markdown
  - [ ] [sbpaa-ingka-geoview] Update C4 diagram after routing changes
  - [ ] [sbpaa-ingka-geospatial] Add new country to pipeline config
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
