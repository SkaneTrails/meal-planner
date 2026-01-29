______________________________________________________________________

## name: working-context description: Track active tasks and discovered issues per-branch, defer non-critical fixes without losing them license: MIT

# Skill: Working Context Management

This skill defines how to maintain persistent working context across conversations using `.copilot-todo.md`.

______________________________________________________________________

## Activation context

This skill activates when:

- Starting a new conversation (read existing context)
- Detecting an issue while working on something else
- Developer says "add to TODO", "fix later", "note that", or similar
- Developer asks "what was I working on?" or "what issues did we find?"
- Switching branches
- Completing a task or set of tasks
- Conversation reset/summarization occurs

______________________________________________________________________

## File location and format

**File:** `.copilot-todo.md` in the repository root (gitignored, local only)

**Structure:**

```markdown
# Copilot Working Context

## Current Branch: <branch-name>

### Active Task
<What you're currently working on>
- Next step: <Specific next action>

### Discovered Issues (Fix Later)
- [ ] `path/to/file.py:123` - brief description of issue
- [ ] `another/file.ts` - another issue found during work

### Completed (Recent)
- [x] 2026-01-28: Previous task completed

---

## Branch: <other-branch-name>

### Active Task
<Previous work on this branch>

### Discovered Issues
- [ ] Issue found on this branch
```

______________________________________________________________________

## Reading context

At the start of each conversation:

1. Check if `.copilot-todo.md` exists
1. If it exists, read the file
1. Identify the current branch and load its context
1. **Do not** recite entire file contents
1. If there's an Active Task, mention it: "Continuing: <task description>"
1. If the Active Task has a "Next step", **verify it's still needed**:
   - "Last session, next step was: <step>. Is that still needed or already done?"
1. If there are unchecked Discovered Issues, mention the count: "You have N deferred issues on this branch."

______________________________________________________________________

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

______________________________________________________________________

## Discovering issues during work

When you notice an issue while working on something else:

1. **Assess if the issue blocks the current Active Task**

1. **If blocking:** Explain why and ask before switching:

   > "This issue blocks current work: <reason>. Need to fix before continuing. Proceed?"

1. **If non-blocking:** Ask whether to defer:

   > "I noticed `path/to/file.py:45` has a hardcoded timeout that should be in settings. Add to TODO or fix now?"

1. **Always ask** - never auto-switch to fixing without confirmation

1. **If deferring**, add to Discovered Issues for the current branch:

   ```markdown
   - [ ] `path/to/file.py:45` - hardcoded timeout should be in settings
   ```

1. **Do not interrupt** the active task unless the developer confirms

______________________________________________________________________

## Branch switching

When the developer switches branches:

1. Save current branch context (Active Task + any new Discovered Issues)
1. Load context for the new branch (if exists)
1. If the new branch has an Active Task, mention it
1. If the new branch has Discovered Issues, mention the count

______________________________________________________________________

## Completing discovered issues

When working through Discovered Issues:

1. When fixed, mark as complete, for example:
   ```markdown
   - [x] `path/to/file.py:45` - hardcoded timeout fixed in abc1234
   ```
1. Periodically clean up completed items (after 3+ completed, offer to remove them)
1. Issues can be promoted to Active Task if the developer wants to focus on them

______________________________________________________________________

## Conversation reset handling

When a conversation is being summarized or reset:

1. Ensure `.copilot-todo.md` is up to date with:
   - Current Active Task and next step
   - All Discovered Issues (checked and unchecked)
1. The file persists across conversations, so context is not lost

______________________________________________________________________

## Commands

The developer can use natural language:

| Intent          | Example phrases                                       |
| --------------- | ----------------------------------------------------- |
| Add issue       | "add to TODO", "fix later", "note that", "defer this" |
| View context    | "what was I working on?", "show TODO", "what issues?" |
| Clear completed | "clean up TODO", "remove completed items"             |
| Promote issue   | "let's fix the timeout issue now"                     |
| Update task     | "next step is X", "now working on Y"                  |

______________________________________________________________________

## File management

- **Creation**: **Always create the file immediately** when this skill activates and the file doesn't exist. Do not ask - just create it with the current branch context. This ensures context is never lost.
- **Gitignore**: Ensure `.copilot-todo.md` is in `.gitignore` (add if missing)
- **Cleanup**: Offer to remove branches that no longer exist locally
- **Never commit**: This file is local working context only

______________________________________________________________________

## Multi-repo work

When working across multiple repositories (e.g., sbpaa-geospatial-routing, sbpaa-ingka-geoview, sbpaa-ingka-geospatial):

- Each repo has its own `.copilot-todo.md`

- Copilot does not have cross-repo visibility of TODO files

- If developer mentions work affecting another repo, note it with a repo prefix:

  ```markdown
  - [ ] [sbpaa-ingka-geoview] Update C4 diagram after routing changes
  - [ ] [sbpaa-ingka-geospatial] Add new country to pipeline config
  ```

- These serve as reminders to address when switching to that repo

______________________________________________________________________

## Example workflow

1. Developer starts work on feature branch
1. Copilot reads `.copilot-todo.md`, finds Active Task from previous session
1. "Continuing work on: Add Memorystore support. Next step: Update connection.py to use new Redis host"
1. While updating connection.py, Copilot notices hardcoded timeout
1. "I noticed a hardcoded timeout at line 45. Add to TODO or fix now?"
1. Developer: "TODO"
1. Copilot adds to Discovered Issues, continues with Active Task
1. Task complete, Copilot updates Active Task to "None"
1. "You have 1 discovered issue on this branch. Want to address it?"
