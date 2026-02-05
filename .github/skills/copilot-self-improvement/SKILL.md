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
|-----------|----------|
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
|--------------|---------------------|
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
- Creating or modifying agents in `.github/agents/`
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

## CRITICAL: Delegate to Tools, Not Instructions

### The Principle

LLMs excel at reasoning, adaptation, and synthesis. They are poor at enforcing deterministic rules consistently. Specialized tools (linters, formatters, validators) run in milliseconds, never forget, and never misinterpret.

**Every rule that CAN be enforced by a tool SHOULD be.** Instructions should never contain content that duplicates what tooling handles.

### Detecting Tool-Delegable Content

Scan for these patterns - regardless of language or tool:

| Pattern | Indicator | Belongs In |
|---------|-----------|------------|
| Numeric constraints | "indent with N spaces", "max line length N" | Formatter/linter config |
| Naming conventions | "use snake_case", "prefix with _" | Linter rules |
| Ordering rules | "sort imports", "alphabetize keys" | Formatter config |
| Whitespace rules | "blank line before return", "no trailing spaces" | Formatter config |
| Syntax preferences | "use double quotes", "trailing commas" | Formatter config |
| Structural validation | "required fields", "valid values" | Schema/linter |
| Commit message format | "use conventional commits", "max 50 chars" | Pre-commit hook |

**The test:** Could a regex, AST parser, or schema validator enforce this? If yes, it's tool territory.

### Detection Triggers

When reading instructions and encountering:

- Specific numbers (indentation, line length, counts)
- Words like "always", "never", "must" with mechanical rules
- Lists of naming patterns or casing rules
- Formatting prescriptions (quotes, commas, brackets)

Ask: "Is there a tool that enforces this?" If uncertain, check:

1. Project's pre-commit config
2. `pyproject.toml`, `tsconfig.json`, or equivalent
3. `.editorconfig`
4. CI workflow linting steps

### What DOES Belong in Instructions

Content that tools cannot enforce:

| Keep in Instructions | Why Tools Can't Handle |
|---------------------|----------------------|
| Semantic patterns | "prefer composition over inheritance" - requires understanding intent |
| Domain conventions | "GCS buckets need lifecycle policies" - domain knowledge |
| Architecture decisions | "use repository pattern for data access" - design judgment |
| Project-specific terms | "use 'customer' not 'user' in this codebase" - context-dependent |
| When NOT to do something | "don't use print() for logging" - requires understanding purpose |

### Action When Detected

1. **Check if tool exists** - is there already a linter/formatter configured?
2. **If configured:** Remove the instruction entirely (tool handles it)
3. **If not configured:** Propose adding the tool rather than the instruction
4. **Report:** "Removed [rule] - already enforced by [tool] in [config file]"

### Example Assessment

Instruction found: "Python code must use 4-space indentation and max 88 char lines"

**Assessment:** Ruff configured in `pyproject.toml` with `line-length = 88` and `indent-width = 4`. Pre-commit runs `ruff format`. This instruction wastes tokens duplicating enforced rules.

**Action:** Remove instruction, note "Formatting enforced by Ruff."

---

## 1. File Architecture

### Attachment Behavior

Understanding when files are attached determines optimal content placement:

| File | When Attached | Token Cost | Optimal Content |
|------|---------------|------------|-----------------|
| `copilot-instructions.md` | Every request | High (always paid) | Minimal, foundational only |
| `*.instructions.md` | File pattern match | Medium (conditional) | File-type specific rules |
| Skills (`SKILL.md`) | On demand via read | Low (only when needed) | Procedures, workflows |
| Agents (`*.agent.md`) | Agent selection | Medium (per agent session) | Agent persona, handoffs |
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

**Agents** (`.github/agents/*.agent.md`):

- Custom agent personas with specific roles
- Handoff definitions to other agents
- Tool restrictions and focus areas
- Activated when user selects the agent

### Size Guidelines

Size limits are guidelines, not hard rules. What matters is content efficiency.

**Agent Skills spec reference:** SKILL.md should be < 5000 tokens, under 500 lines. Move detailed references to separate files that load on demand.

| File | Line Guideline | Token Context | Assessment Criteria |
|------|----------------|---------------|---------------------|
| `copilot-instructions.md` | ~200 lines | Minimize - always loaded | Could any content be conditionally loaded? |
| Individual skill (SKILL.md) | ~500 lines | < 5000 tokens (spec) | Split detailed refs to `references/` |
| `*.instructions.md` | ~100 lines | Loaded on file match | Is this file type common enough to justify? |
| Individual agent | ~150 lines | Loaded on agent selection | Is the persona focused? Handoffs clear? |

**Progressive disclosure (from spec):**

1. **Metadata** (~100 tokens) - `name` + `description` loaded at startup for all skills
2. **Instructions** (< 5000 tokens) - full SKILL.md loaded when skill activates
3. **Resources** (on demand) - `references/`, `scripts/`, `assets/` loaded only when needed

**Key question:** Is content loaded unconditionally that could be loaded conditionally?

- Content needed for 100% of requests → `copilot-instructions.md`
- Content needed for file-type work → `*.instructions.md`
- Content needed for specific tasks → skills
- Detailed reference material → `references/REFERENCE.md` within skill

Size is a smell, not a violation. A 400-line `copilot-instructions.md` of essential content is fine. A 150-line file with extractable content is not.

---

## 2. Content Placement Decision Tree

When adding new content, follow this logic:

```
Is this always needed for every request?
├─ Yes → Does it fit in <20 lines?
│        ├─ Yes → copilot-instructions.md
│        └─ No → Summarize in instructions, detail in skill
└─ No → Is it an agent persona?
         ├─ Yes → agents/*.agent.md
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
|--------------|-------------|---------|
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

## 4. Knowledge Gap Management

When I encounter outdated knowledge:

1. User provides a link with correct/current information
2. Add it to `copilot-references.md` with category and date
3. Future conversations can fetch the link

**Behaviors:**

| Trigger | Action |
|---------|--------|
| Uncertain about current syntax/API | Check `copilot-references.md` first |
| User says "check for updates" | Fetch from references |
| User provides corrective link | Add it to references |

---

## 5. Creating Skills and Agents

When creating new skills or agents, read [references/PROCEDURES.md](references/PROCEDURES.md) for:

- Skill structure and registration
- Agent structure and anti-patterns
- Fitness assessment criteria

**Quick checks before creating:**

| Creating | Must Have |
|----------|-----------|
| Skill | Clear activation context, registration in copilot-instructions.md |
| Agent | Distinct persona, clear boundaries, handoff definitions |

---

## 6. Anti-Patterns

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| Everything in `copilot-instructions.md` | Bloated, slow, diluted focus | Split per decision tree |
| Duplicated content across files | Inconsistent, hard to maintain | Single source of truth |
| Procedures in instructions | Always loaded but rarely needed | Move to skills |
| Vague skill activation | Skill never invoked | Explicit triggers |
| No skill registration | Skill not discoverable | Update copilot-instructions.md |
| Hardcoded external data | Becomes stale | Use copilot-references.md |
| Tool-enforceable rules in instructions | Wasted tokens, inconsistent | Configure linter/formatter |

---

## 7. Health Checks

| Check | Frequency | Action |
|-------|-----------|--------|
| Unconditional content review | Every edit | Could content be conditionally loaded? |
| Misplaced content scan | Every edit | File-type patterns, procedures, external refs |
| Tool-delegable content | Every edit | Rules that a linter/formatter handles? |
| Stale references | Weekly | Test 2-3 references for relevance |
| `.copilot-tasks.md` cleanup | Per branch merge | Remove completed branch sections |

**On first read of any Copilot config file:**

1. Scan for content that could be conditionally loaded
2. Scan for tool-delegable rules
3. If found, assess and extract/remove before other work

---

## 7a. Fitness-for-Purpose Assessment

When reviewing skills (on request or during health checks), assess against these criteria:

### Assessment Criteria

| Criterion | Question to Ask |
|-----------|-----------------|
| **Purpose clarity** | Is the skill's purpose immediately clear from the name and description? |
| **Audience fit** | Is it written FOR Copilot (AI parsing) rather than human reading? |
| **Actionable guidance** | Does it provide specific, executable instructions vs vague principles? |
| **Domain value** | Does it contain knowledge Copilot wouldn't have from training? |
| **Up-to-date** | Does it reflect current project state (tools, APIs, conventions)? |
| **Activation triggers** | Is the activation context specific enough to invoke when needed? |
| **Dependencies valid** | Do referenced files/configs actually exist? |

### Assessment Format

```markdown
### `skill-name` (N lines)

| Criterion | Assessment |
|-----------|------------|
| Purpose | ✅/🟡/❌ [brief note] |
| Audience fit | ✅/🟡/❌ [brief note] |
| Actionable | ✅/🟡/❌ [brief note] |
| Domain value | ✅/🟡/❌ [brief note] |
| Up-to-date | ✅/🟡/❌ [brief note] |
| Dependencies | ✅/🟡/❌ [list any missing] |

**Verdict:** ✅ Fit / 🟡 Needs attention / ❌ Needs rewrite
**Issues:** [list specific problems if any]
```

### Indicators of Poor Fitness

| Symptom | Likely Problem |
|---------|----------------|
| Skill never invoked | Activation context too narrow or misaligned |
| Copilot ignores skill guidance | Instructions too vague or conflicting |
| Content duplicated elsewhere | Extraction incomplete, scope unclear |
| Referenced files don't exist | Skill out of sync with project |

### Acting on Assessment

- **✅ Fit:** No action needed
- **🟡 Needs attention:** Note issues, propose specific fixes
- **❌ Needs rewrite:** Block on fixing before other work (per No Deferral Rule)

---

## 7b. Portability

This meta-skill is designed to be copied to other repositories. To adopt:

1. Copy `.github/skills/copilot-self-improvement/` to the target repo
2. Add the skill reference to that repo's `copilot-instructions.md`
3. **Add trigger rule** to the Collaboration Rules section:
   ```
   - **Before editing Copilot config** - read `copilot-self-improvement` skill...
   ```
4. Create `copilot-references.md` if knowledge gaps are common
5. Add `.copilot-tasks.md` to `.gitignore`

### Self-Registration Requirement

This skill must ensure its own activation by verifying `copilot-instructions.md` contains:

1. **Trigger rule** in Collaboration Rules
2. **Iteration tracking** in Collaboration Rules
3. **Failure tracking bootstrap** in Working Context section

If any are missing, add them before making other changes to Copilot config files.

---

## 8. Proposing Improvements

When detecting opportunities, act immediately:

| Detection | Action |
|-----------|--------|
| Knowledge gap | Add to `copilot-references.md` |
| Instructions over limit | Extract to skill or `*.instructions.md` |
| Repeated procedure (3x) | Create a skill |
| Context lost | Read `.copilot-tasks.md` |
| Tool-delegable rule | Remove instruction, verify tool config |

---

## 9. Cross-Conversation Context & Failure Tracking

See the [working-context skill](../working-context/SKILL.md) for complete details on:

- `.copilot-tasks.md` file format and behaviors
- Active task tracking across conversations
- Failure Tracking table and promotion workflow
- User trigger phrases

**Key behaviors to remember:**

- Read `.copilot-tasks.md` at conversation start
- Log failures BEFORE retrying
- Promote to permanent docs at count = 3

---

## 10. File Inventory

| File | Purpose | Attached | Gitignored |
|------|---------|----------|------------|
| `copilot-instructions.md` | Core project context | Always | No |
| `copilot-references.md` | Knowledge links | On demand | No |
| `.copilot-tasks.md` | Cross-conversation state | On demand | Yes |
| `*.instructions.md` | File-pattern instructions | By pattern | No |
| `skills/*/SKILL.md` | Task procedures | On demand | No |
| `agents/*.agent.md` | Custom agent personas | Agent selection | No |
