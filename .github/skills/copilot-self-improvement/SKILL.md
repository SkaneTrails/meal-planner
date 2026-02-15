---
name: copilot-self-improvement
description: Meta-skill for maintaining and improving Copilot configuration files, instructions, and skills
---

# Skill: Copilot Self-Improvement

## Activation Context

- Editing `copilot-instructions.md` or any `*.instructions.md`
- Creating or modifying skills in `.github/skills/` or agents in `.github/agents/`
- Knowledge gaps that external information resolves
- User asks about improving Copilot's effectiveness

---

## ⚠️ Repeatedly Overlooked — READ CAREFULLY

These rules have been violated multiple times. They exist because the default behavior is wrong.

### 1. You are the domain expert for these files

Do NOT ask "should I extract this?" or "what line limit do you prefer?" for Copilot config files. State "I'm doing X because Y." The user can override — but you decide by default. These files are FOR you, BY you. Human role is approval only.

### 2. Fix structural issues NOW, not later

When you detect a problem (size violation, misplaced content, tool-delegable rules): fix it immediately as the first action. Do not defer. Do not "note it for later." Deferring compounds the problem on every subsequent request.

### 3. Report ALL findings transparently

When scanning for misplaced content, report everything you considered — including things you assessed as not worth extracting. Silent dismissal means the user never knows you evaluated it.

> Wrong: _(silently dismisses python.instructions.md)_
> Right: "Created terraform.instructions.md. Also detected Python patterns but assessed as overhead since Ruff handles it."

---

## Context Window Awareness

Every line in `copilot-instructions.md`, `*.instructions.md`, and skills consumes context window space, leaving less room for code reasoning, file contents, and tool results. This directly causes earlier summarization and lost conversation state.

**Loading frequency matters:**

| File | Loading | Impact |
| ---- | ------- | ------ |
| `copilot-instructions.md` | Every request | Highest — competes with every interaction |
| `*.instructions.md` | When editing matching files | Medium — present during file-type work |
| Skills | On demand | Lowest — only when activated |

**Optimization priority:** Always-loaded > pattern-matched > on-demand. A 10-line reduction in `copilot-instructions.md` frees more reasoning capacity across a session than removing 50 lines from a skill.

**When reviewing any config file, ask:** "Does every line here earn its context window space?" Generic knowledge from training data does not. Project-specific decisions, gotchas, and patterns that contradict defaults do.

---

## Detect Misplaced Content

On every invocation, scan `copilot-instructions.md` for content that belongs elsewhere:

| Signal | Destination |
| ------ | ----------- |
| File-extension-specific conventions (`.tf`, `.py`, `.ts`) | `*.instructions.md` |
| Step-by-step procedures, "how to" sections, decision trees | Skills |
| URLs to external docs, version-specific info | `copilot-references.md` |

Extract BEFORE proceeding with other work.

---

## Delegate to Tools, Not Instructions

**Any rule that a linter, formatter, or validator can enforce MUST NOT appear in instructions.** Instructions duplicate what `ruff`, `prettier`, pre-commit hooks, or `tsconfig` already handle = wasted tokens.

**Test:** Could a regex, AST parser, or schema validator enforce this? → Tool territory.

When detected: check project's pre-commit config / `pyproject.toml` / `tsconfig.json`. If tool exists, remove the instruction. If not, propose adding the tool.

**Keep in instructions only:** semantic patterns, domain conventions, architecture decisions, project-specific terminology — things tools cannot enforce.

---

## File Architecture

| File | When Loaded | Context Impact | Content |
| ---- | ----------- | -------------- | ------- |
| `copilot-instructions.md` | Every request | High (always present) | Minimal: overview, stack, principles, skill registry |
| `*.instructions.md` | File pattern match | Medium (during edits) | File-type conventions |
| Skills (`SKILL.md`) | On demand | Low (only when needed) | Procedures, workflows |
| Agents (`*.agent.md`) | Agent selection | Medium (per session) | Persona, handoffs, tool restrictions |
| `copilot-references.md` | On demand | Low | External links, stale-prone data |
| `.copilot-tasks.md` | Conversation start | Low | Cross-conversation state |

### Placement Decision

| Question | Yes → |
| -------- | ----- |
| Always needed, fits in <20 lines? | `copilot-instructions.md` |
| Always needed, >20 lines? | Summarize in instructions, detail in skill |
| Triggered by file type? | `*.instructions.md` |
| Agent persona? | `agents/*.agent.md` |
| Procedure/workflow? | Skill |
| External reference data? | `copilot-references.md` |
| None of the above? | Probably doesn't need documenting |

### Size Guidelines

| File | Guideline | Key Question |
| ---- | --------- | ------------ |
| `copilot-instructions.md` | ~200 lines | Could any content be conditionally loaded? |
| Skill (SKILL.md) | <500 lines, <5000 tokens | Split refs to `references/`? |
| `*.instructions.md` | Comprehensive | Is file type common enough to justify? |
| Agent | ~150 lines | Focused persona? Clear handoffs? |

Size is a smell, not a violation. 400 lines of essential content is fine. 150 lines with extractable content is not.

---

## Creating Skills and Agents

Read [references/PROCEDURES.md](references/PROCEDURES.md) for structure, registration, and anti-patterns.

| Creating | Must Have |
| -------- | --------- |
| Skill | Clear activation context, registered in `copilot-instructions.md` |
| Agent | Distinct persona, clear boundaries, handoff definitions |

---

## Anti-Patterns

| Anti-Pattern | Solution |
| ------------ | -------- |
| Everything in `copilot-instructions.md` | Split per placement decision above |
| Duplicated content across files | Single source of truth |
| Procedures in always-loaded instructions | Move to skills |
| Skill not registered in `copilot-instructions.md` | Register it — unregistered = undiscoverable |
| Tool-enforceable rules in instructions | Remove instruction, verify tool config |
| Hardcoded external data | Use `copilot-references.md` |

---

## Health Checks

On every invocation of this skill:

1. Scan for content that could be conditionally loaded
2. Scan for tool-delegable rules
3. If found, assess and extract/remove before other work

| Periodic Check | Action |
| -------------- | ------ |
| Stale references | Test 2-3 for relevance |
| `.copilot-tasks.md` cleanup | After branch merge, remove branch section |

---

## Fitness Assessment

When reviewing skills (on request or during health checks):

| Criterion | Question |
| --------- | -------- |
| Purpose clarity | Immediately clear from name + description? |
| Audience fit | Written for Copilot, not humans? |
| Actionable | Specific instructions vs vague principles? |
| Domain value | Knowledge Copilot lacks from training? |
| Up-to-date | Reflects current project state? |
| Dependencies valid | Referenced files actually exist? |

**Verdict:** ✅ Fit / 🟡 Needs attention / ❌ Needs rewrite (fix structural issues NOW, not later)

---

## Knowledge Gaps

| Trigger | Action |
| ------- | ------ |
| Uncertain about current syntax/API | Check `copilot-references.md` |
| User provides corrective link | Add to `copilot-references.md` with category and date |
| Repeated procedure (3x) | Create a skill |
| Instructions over size limit | Extract to skill or `*.instructions.md` |

---

## Self-Registration

This skill must verify `copilot-instructions.md` contains:

1. Trigger rule in Collaboration Guidelines: "Before editing Copilot config — read copilot-self-improvement skill"
2. Skill entry in the skills table

If missing, add them before making other changes.
