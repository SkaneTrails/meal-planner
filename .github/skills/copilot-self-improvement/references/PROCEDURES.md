# Copilot Self-Improvement Procedures

Detailed procedural content for the copilot-self-improvement skill. Read these when creating skills, agents, or assessing fitness.

---

## Skill Creation

### When to Create

- Procedure is used repeatedly
- Procedure has clear activation context
- Procedure is complex enough to warrant documentation (>20 lines)

### Structure

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

After creating a skill, update `copilot-instructions.md`:

```markdown
Available skills in `.github/skills/`:

- **new-skill** - Brief description. Use when [activation context].
```

**Registration format:** `- **skill-name** - Description. Use when [trigger].`

Skills not registered may not be invoked.

---

## Agent Creation

### When to Create

- Task requires a distinct persona with specific focus
- Workflow benefits from handoffs between specialized roles
- Agent has clear boundaries (what it does and doesn't do)

### Structure

```markdown
---
name: agent-name
description: One-line description
tools: []  # Optional: restrict available tools
---

# Agent Name

Brief persona description.

## Role

What this agent does and its boundaries.

## Instructions

Specific behavioral instructions for this agent.

## Handoffs

- **Next Agent** - When to trigger and what context to pass
```

### Registration

After creating an agent, update `copilot-instructions.md` to register it in the Available Agents table.

### Agent Anti-Patterns

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| Agent does everything | No clear handoff points | Split by distinct phases |
| Overlapping agents | Confusion about which to use | Clear boundaries in Role section |
| No handoff context | Next agent starts blind | Pass summary of decisions made |
| Too many tools | Agent unfocused | Restrict tools to what's needed |

---

## Optimal `copilot-instructions.md` Template

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
