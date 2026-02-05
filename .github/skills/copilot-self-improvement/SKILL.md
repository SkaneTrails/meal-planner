---
name: copilot-self-improvement
description: Meta-skill for maintaining and improving Copilot configuration files, instructions, and skills
---

# Skill: Copilot Self-Improvement

This skill provides guidance for maintaining healthy Copilot configuration as the project evolves.

---

## Audience and Ownership

**These files are written FOR Copilot, BY Copilot.**

| Principle | Rationale |
| --------- | -------- |
| Copilot is the audience | Formatting for human readability is wasted tokens |
| Copilot authors changes | Propose edits, human approves |
| Human role is approval | Review and accept/reject, not author |
| Optimize for parsing | Structure for Copilot consumption, not human scanning |

**Humans should not directly edit these files.** Instead:

1. Human describes what they want (verbally or in an issue)
2. Copilot proposes the change
3. Human reviews and approves
4. Copilot commits

This ensures consistency and avoids human-introduced formatting that wastes tokens.

---

## Copilot is the Domain Expert

**For Copilot configuration files, Copilot knows best.**

These files exist to optimize Copilot's effectiveness. Copilot is the consumer and understands:
- What content is useful vs. noise
- When conditional loading is beneficial
- What structure aids parsing
- Whether extraction is worth the overhead

**Default behavior for Copilot config:**

| Normal tasks | Copilot config tasks |
| ------------ | ------------------- |
| Seek user confirmation | Act on best judgment |
| Present options | Make the decision |
| Ask "should I...?" | State "I'm doing X because Y" |
| Defer to user expertise | Copilot IS the expert |

**Anti-pattern:** Asking "should I extract this?" or "what line limit do you prefer?"

**Correct pattern:** "Extracting X to Y because [reasoning]. Override if you disagree."

The user can always override, but Copilot should not ask permission for decisions within its domain expertise.

---

## Activation Context

This skill activates when:

- Editing `copilot-instructions.md` or any `*.instructions.md` file
- Creating or modifying skills in `.github/skills/`
- Conversation context is lost or incomplete after summarization
- Encountering knowledge gaps that external information resolves
- The user asks about improving Copilot's effectiveness

---

## CRITICAL: No Deferral Rule

**Size violations and structural issues must be fixed IMMEDIATELY.**

When this skill detects a problem (e.g., `copilot-instructions.md` exceeds size target):

1. **Do not defer** - "fix later" is not acceptable
2. **Do not proceed with other work** until the issue is resolved
3. **Fix it now** as the first action, before any other changes
4. **Block on user approval** if needed, but do not skip

Deferring structural fixes causes:
- Continued token waste on every subsequent request
- Problem compounds as more content is added
- Fix becomes harder over time

---

## CRITICAL: Detect Misplaced Content

When reading `copilot-instructions.md`, actively scan for content that belongs elsewhere:

### File-Type Specific Content → `*.instructions.md`

**Indicators of misplaced file-type content:**

- Naming conventions for specific file extensions (`.tf`, `.py`, `.ts`)
- Language-specific formatting rules
- Framework conventions (React, Terraform, Django)
- Linting/testing commands for specific languages
- Code patterns or examples for specific file types

**Action:** Extract to `<type>.instructions.md` (e.g., `terraform.instructions.md`, `python.instructions.md`)

### Procedural Content → Skills

**Indicators of misplaced procedures:**

- Step-by-step instructions
- "How to" sections
- Decision trees or flowcharts
- Detailed examples with multiple steps

**Action:** Extract to `.github/skills/<name>/SKILL.md`

### External References → `copilot-references.md`

**Indicators of misplaced references:**

- URLs to external documentation
- Version-specific information that may become stale
- API references

**Action:** Extract to `copilot-references.md`

### Detection is Mandatory

When this skill is invoked, scan `copilot-instructions.md` for these patterns. If found, extract them BEFORE proceeding with any other work.

### Transparency in Assessment

Copilot is best suited to assess what extractions are worthwhile - these files are for Copilot's consumption.

When detecting potential misplaced content:

1. **Assess each finding** - is extraction beneficial or overhead?
2. **Act on beneficial extractions** - create the files
3. **Report all findings** - including those assessed as not worth extracting
4. **Explain reasoning** - why some were extracted, why others weren't

Example of WRONG behavior:
> (silently dismisses python.instructions.md, user never knows it was considered)

Example of CORRECT behavior:
> "Created terraform.instructions.md. Also detected Python patterns but assessed as overhead since Ruff config in pyproject.toml handles formatting rules."

**The user can override any assessment, but Copilot decides by default.**

---

## 1. File Architecture

### Attachment Behavior

Understanding when files are attached determines optimal content placement:

| File | When Attached | Token Cost | Optimal Content |
| ---- | ------------- | ---------- | --------------- |
| `copilot-instructions.md` | Every request | High (always paid) | Minimal, foundational only |
| `*.instructions.md` | File pattern match | Medium (conditional) | File-type specific rules |
| Skills (`SKILL.md`) | On demand via read | Low (only when needed) | Procedures, workflows |
| `copilot-references.md` | On demand via read | Low (only when needed) | External links, data |
| `.copilot-tasks.md` | Conversation start | Low (once per session) | Cross-conversation state |

### What Goes Where

**`copilot-instructions.md`** (always attached - keep under 200 lines):

- Project overview (1-2 paragraphs)
- Tech stack summary (bullet list)
- Core principles (brief, actionable)
- Skill registry (one line per skill)
- Workflow overview (table with links)
- Links to detailed docs (not the docs themselves)

**DO NOT include:** Procedures, examples, detailed workflows, reference data.

**`*.instructions.md`** (e.g., `terraform.instructions.md`):

- File-type specific conventions
- Language/framework patterns
- Linting/formatting rules for that file type
- Activated when editing matching files

**Skills** (`.github/skills/<name>/SKILL.md`):

- Step-by-step procedures
- Decision trees and workflows
- Detailed examples
- Activated by task type or explicit request

**`copilot-references.md`**:

- External documentation links
- API references that may be outdated
- Knowledge that needs periodic refresh
- Fetched when uncertain or asked to check

### Size Guidelines

Size limits are guidelines, not hard rules. What matters is content efficiency:

| File | Guideline | Assessment Criteria |
| ---- | --------- | ------------------- |
| `copilot-instructions.md` | ~200 lines | Could any content be conditionally loaded? |
| Individual skill | ~300 lines | Is this doing too many things? Split by concern? |
| `*.instructions.md` | ~100 lines | Is this file type common enough to justify? |

**Key question:** Is content loaded unconditionally that could be loaded conditionally?

- Content needed for 100% of requests → `copilot-instructions.md`
- Content needed for file-type work → `*.instructions.md`
- Content needed for specific tasks → skills

Size is a smell, not a violation. A 400-line `copilot-instructions.md` of essential content is fine. A 150-line file with extractable content is not.

---

## 2. Content Placement Decision Tree

When adding new content, follow this logic:

```
Is this always needed for every request?
├─ Yes → Does it fit in <20 lines?
│        ├─ Yes → copilot-instructions.md
│        └─ No → Summarize in instructions, detail in skill
└─ No → Is it triggered by file type?
         ├─ Yes → *.instructions.md
         └─ No → Is it a procedure/workflow?
                  ├─ Yes → Skill
                  └─ No → Is it external reference data?
                           ├─ Yes → copilot-references.md
                           └─ No → Probably doesn't need to be documented
```

---

## 3. Instruction File Size Management

### Monitor Size

`copilot-instructions.md` is always attached to conversations. If it grows too large:

- Increases token usage on every request
- Dilutes focus on what matters for the current task
- May be truncated, losing important instructions

**Target:** Keep `copilot-instructions.md` under 200 lines. Check periodically.

### When to Split

| Content Type | Destination | Trigger |
| ------------ | ----------- | ------- |
| Task-specific procedures | Skill (`.github/skills/<name>/SKILL.md`) | Activated by task type or user request |
| File/language patterns | Instructions file (`*.instructions.md`) | Activated by file pattern match |
| Reference data/links | `copilot-references.md` | Fetched on demand |
| Project context | `copilot-instructions.md` | Always needed |

### Splitting Criteria

**Move to a skill when:**

- Content is procedural (how to do something)
- Content is only relevant for specific tasks
- Content exceeds 50 lines and has clear activation context

**Move to `*.instructions.md` when:**

- Content applies to specific file types or patterns
- Example: `terraform.instructions.md` for `.tf` files

**Keep in `copilot-instructions.md` when:**

- Content is always relevant (project structure, principles, tech stack)
- Content is short and foundational

---

## 4. Cross-Conversation Context

### The Problem

Conversation summarization loses context. I cannot detect when it happens or inject content into summaries.

### The Solution: `.copilot-tasks.md`

Maintain a gitignored file that survives summarization:

```markdown
# Copilot Working Context

## Current Branch: <branch-name>

### Active Task
<What you're currently working on>
- Next step: <Specific next action>

### Discovered Issues (Fix Later)
- [ ] `path/to/file.py:123` - brief description
```

**Behaviors:**

| When | Action |
| ---- | ------ |
| Conversation starts | Read `.copilot-tasks.md`, resume context |
| Completing a step | Update "Next step" immediately |
| Task complete | Clear Active Task |
| Finding unrelated issue | Ask "Add to TODO or fix now?" |

**Critical:** Update frequently, not just before summarization (which I cannot detect).

---

## 5. Knowledge Gap Management

### The Problem

My training data becomes outdated. Users provide corrections that get lost after summarization.

### The Solution: `copilot-references.md`

When I encounter a knowledge gap:

1. User provides a link with correct/current information
2. I offer to add it to `copilot-references.md`
3. Future conversations can fetch the link

**Reference file structure:**

```markdown
## <Topic Category>

| Topic | Link | Description | Last verified |
| ----- | ---- | ----------- | ------------- |
| ... | ... | ... | YYYY-MM-DD |
```

**Behaviors:**

| Trigger | Action |
| ------- | ------ |
| Uncertain about current syntax/API | Check `copilot-references.md` first |
| User says "check for updates" | Fetch from references |
| User provides corrective link | Offer to add it |
| Knowledge gap resolved | Add reference with date |

### Obsolescence Check

I cannot distinguish base knowledge from fetched content. To prune stale references:

1. Ask me about the topic without fetching
2. Compare my answer to linked content
3. If accurate, reference may be obsolete - remove it

---

## 6. Skill Creation Guidelines

### When to Create a New Skill

- Procedure is used repeatedly
- Procedure has clear activation context
- Procedure is complex enough to warrant documentation (>20 lines)

### Skill Structure

```markdown
---
name: skill-name
description: One-line description
---

# Skill: Human-Readable Name

Brief overview.

---

## Activation Context

When this skill activates...

---

## Sections...
```

### Registration

After creating a skill, update `copilot-instructions.md` to register it in the Skills section:

```markdown
Available skills in `.github/skills/`:

- **new-skill** - Brief description. Use when [activation context].
```

**Registration format:** `- **skill-name** - Description. Use when [trigger].`

This ensures the skill is discoverable. Skills not listed may not be invoked.

---

## 7. Portability

This meta-skill is designed to be copied to other repositories. To adopt:

1. Copy `.github/skills/copilot-self-improvement/` to the target repo
2. Add the skill reference to that repo's `copilot-instructions.md`
3. **Add trigger rule** to the Collaboration Rules section:

   ```
   - **Before editing Copilot config** - read `copilot-self-improvement` skill before modifying `copilot-instructions.md`, `*.instructions.md`, skills, or `copilot-references.md`
   ```

4. Create `copilot-references.md` if knowledge gaps are common
5. Add `.copilot-tasks.md` to `.gitignore`

The skill will guide creation of repo-specific skills and instructions.

### Self-Registration Requirement

This skill must ensure its own activation by verifying `copilot-instructions.md` contains:

1. **Trigger rule** in Collaboration Rules:
   ```
   - **Before editing Copilot config** - read `copilot-self-improvement` skill...
   ```

2. **Iteration tracking** in Collaboration Rules:
   ```
   - **Track iterations** - when a command/approach fails, IMMEDIATELY log to Failure Tracking table BEFORE retrying...
   ```

3. **Failure tracking bootstrap** in Working Context section:
   ```
   - **Skim Failure Tracking table** for patterns relevant to current topic
   - **Log failures** to Failure Tracking table; when count reaches 3, promote...
   ```

If any are missing, add them before making other changes to Copilot config files.

---

## 8. Anti-Patterns

Avoid these common mistakes:

| Anti-Pattern | Problem | Solution |
| ------------ | ------- | -------- |
| Everything in `copilot-instructions.md` | Bloated, slow, diluted focus | Split per decision tree above |
| Duplicated content across files | Inconsistent, hard to maintain | Single source of truth, link to it |
| Procedures in instructions | Always loaded but rarely needed | Move to skills |
| Examples in instructions | Token-heavy, often skipped | Move to skills or link to tests |
| Vague skill activation | Skill never invoked | Explicit triggers in activation context |
| No skill registration | Skill not discoverable | Always update copilot-instructions.md |
| Hardcoded external data | Becomes stale | Use copilot-references.md |
| Detailed rules for every file type | Verbose, often irrelevant | Only create *.instructions.md when needed |

---

## 9. Optimal `copilot-instructions.md` Template

For a well-structured main instructions file:

```markdown
# Project Instructions

## Overview
[2-3 sentences: what the project does, its purpose]

## Tech Stack
- [Language/framework]
- [Key tools]

## Core Principles
- [Principle 1 - brief]
- [Principle 2 - brief]
- [Principle 3 - brief]

## Project Structure
[Brief tree or description - link to detailed docs if complex]

## Skills
[One-line per skill with activation trigger]

## Quick Reference
[Any always-needed short rules - keep under 20 lines]

## Links
- [README](README.md)
- [Contributing](CONTRIBUTING.md)
- [Detailed docs](docs/)
```

Target: 150-200 lines total.

---

## 10. Health Checks

Perform these checks at the specified frequency:

| Check | Frequency | Action |
| ----- | --------- | ------ |
| Unconditional content review | Every edit | Is there content that could be conditionally loaded? |
| Misplaced content scan | Every edit | File-type patterns, procedures, external refs |
| Fitness-for-purpose assessment | On skill review | Does each skill serve its intended purpose effectively? |
| Stale references | Weekly | Test 2-3 references for continued relevance |
| Unused skills | Weekly | Check if any skills haven't been invoked recently |
| `.copilot-tasks.md` cleanup | Per branch merge | Remove completed branch sections |

**On first read of any Copilot config file:**

1. Scan for content that could be conditionally loaded
2. If found, assess whether extraction is beneficial
3. If beneficial, extract before proceeding with original task
4. Report findings and reasoning

**The goal is efficiency, not arbitrary limits.** A large file of essential content is fine. A small file with extractable content is not.

---

## 10a. Fitness-for-Purpose Assessment

When reviewing skills (either on request or during health checks), assess each skill against these criteria:

### Assessment Criteria

| Criterion | Question to Ask |
| --------- | --------------- |
| **Purpose clarity** | Is the skill's purpose immediately clear from the name and description? |
| **Audience fit** | Is it written FOR Copilot (AI parsing) rather than human reading? |
| **Actionable guidance** | Does it provide specific, executable instructions vs vague principles? |
| **Domain value** | Does it contain knowledge Copilot wouldn't have from training? |
| **Up-to-date** | Does it reflect current project state (tools, APIs, conventions)? |
| **Activation triggers** | Is the activation context specific enough to invoke when needed? |
| **Dependencies valid** | Do referenced files/configs actually exist? |

### Assessment Format

For each skill, report:

```markdown
### `skill-name` (N lines)

| Criterion | Assessment |
| --------- | ---------- |
| Purpose | ✅/🟡/❌ [brief note] |
| Audience fit | ✅/🟡/❌ [brief note] |
| Actionable | ✅/🟡/❌ [brief note] |
| Domain value | ✅/🟡/❌ [brief note] |
| Up-to-date | ✅/🟡/❌ [brief note] |
| Dependencies | ✅/🟡/❌ [list any missing] |

**Verdict:** ✅ Fit / 🟡 Needs attention / ❌ Needs rewrite
**Issues:** [list specific problems if any]
```

### When to Assess

- **On explicit request:** "assess skills", "review Copilot config"
- **During health checks:** When this skill is invoked for any reason
- **After major project changes:** New tools, changed architecture

### Indicators of Poor Fitness

| Symptom | Likely Problem |
| ------- | -------------- |
| Skill never invoked | Activation context too narrow or misaligned with real tasks |
| Copilot ignores skill guidance | Instructions too vague or conflicting with training |
| Skill content duplicated elsewhere | Extraction wasn't complete, or scope unclear |
| Referenced files don't exist | Skill out of sync with project structure |
| Human-formatted content | Tables for visual appeal, verbose explanations |

### Acting on Assessment

- **✅ Fit:** No action needed
- **🟡 Needs attention:** Note issues, propose specific fixes
- **❌ Needs rewrite:** Block on fixing before other work (per No Deferral Rule)

---

## 11. Proposing Improvements

When detecting opportunities, act immediately - do not just observe:

**Knowledge gap detected:**
> "I wasn't aware of that. Adding this to `copilot-references.md` now."

**Instructions over limit:**
> "`copilot-instructions.md` has content that could be conditionally loaded. Extracting [topic] to [destination] now."

**Repeated procedure:**
> "This is the third time we've done [procedure]. Creating a skill for it now."

**Context lost after summarization:**
> "I see `.copilot-tasks.md` has context from a previous session. Resuming: [task]"

---

## 12. Iteration Learning

### The Problem

Copilot repeats the same mistakes across conversations (e.g., shell escaping, API payload format). Without capturing what works, each session rediscovers solutions.

### Mechanism: Failure Tracking

Use the Failure Tracking table in `.copilot-tasks.md` to count mistakes across conversations:

1. **On failure** → log pattern to table (or increment if exists)
2. **On conversation start** → skim table for patterns relevant to current topic
3. **On count = 3** → promote to permanent documentation, remove from table
4. **Before logging** → check if pattern already exists in target `*.instructions.md` or skill

See `working-context` skill for table format and full workflow.

### Table Schema (strict)

```markdown
| Pattern | Count | Last seen | Context | Fix when promoted |
| ------- | ----- | --------- | ------- | ----------------- |
```

**Rules:**

- Never change the header row
- One row per pattern (no duplicates)
- Pattern should be a short identifier (e.g., `shell-escaping`, `json-quotes`)
- Context describes the specific situation
- "Fix when promoted" captures the solution while fresh

### Matching Rule

Before adding a new failure:

1. Check if pattern already exists in table → increment count
2. Check if pattern already promoted to `*.instructions.md` or skill → **do not re-add**
3. Only add new row if pattern is genuinely new

### Behavior During Problem Solving

When trying multiple approaches:

1. **Verbalize attempts** - "Trying [A]... failed because [error]. Trying [B]..."
2. **Log failure** - update Failure Tracking in `.copilot-tasks.md`
3. **Announce success** - "Solution: [C]. Previous attempts [A, B] failed because [reasons]."
4. **Check threshold** - if count hits 3, promote immediately

### Where to Promote (at threshold)

| Learning Type | Destination | Example |
| ------------- | ----------- | ------ |
| Shell/language pattern | `*.instructions.md` | PowerShell escaping rules → `powershell.instructions.md` |
| Workflow/procedure | Relevant skill | API retry pattern → skill that uses that API |
| External API behavior | `copilot-references.md` | Jira field format → link to Jira API docs |
| Cross-cutting pattern | `copilot-instructions.md` | Only if needed for every request |

### Promotion Format

When promoting to permanent documentation:

```markdown
## [Problem Signature]

**Symptom:** [What the error looks like]

**Wrong approach:**
- [What doesn't work and why]

**Correct approach:**
[What works and why]
```

### User Triggers

| User Says | Action |
| --------- | ------ |
| "log this failure" | Add/update row in Failure Tracking table now |
| "update failure tracking" | Scan recent conversation, sync table |
| "save this learning" | Promote immediately (skip threshold) |
| "remember this" | Same as above |
| "prune failures" | Remove rows with Last seen > 7 days or obsolete |
| "reset failure tracking" | Clear all rows from table |

### Success Criteria

Iteration learning works when:

- Failures are logged to `.copilot-tasks.md` (not forgotten)
- Counter persists across conversations
- Threshold triggers automatic promotion
- Promoted patterns are in files that get read automatically
- Already-promoted patterns are not re-logged

---

## 13. File Inventory

| File | Purpose | Attached | Gitignored |
| ---- | ------- | -------- | ---------- |
| `copilot-instructions.md` | Core project context | Always | No |
| `copilot-references.md` | Knowledge links | On demand | No |
| `.copilot-tasks.md` | Cross-conversation state | On demand | Yes |
| `*.instructions.md` | File-pattern instructions | By pattern | No |
| `skills/*/SKILL.md` | Task procedures | On demand | No |
