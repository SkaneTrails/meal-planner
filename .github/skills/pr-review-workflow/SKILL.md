---
name: pr-review-workflow
description: Handle PR creation, review comments, feedback, and CI status using GitHub CLI and APIs
---

# Skill: PR Review Workflow

## Activation context

- Creating a PR (see section 5 for PowerShell quoting)
- After pushing commits to a PR branch
- Developer asks about PR comments, review feedback, or CI status

---

## 1. Post-push workflow

After every `git push`, do ALL in order:

1. Fetch review threads (section 2)
2. Summarize and present to developer (section 3)
3. Wait for developer confirmation on which to address
4. Fix, commit, push
5. Reply + resolve each thread (section 4) — these are **inseparable**

**Completion checklist per comment (all required):**

- [ ] Code fix implemented
- [ ] Committed and pushed
- [ ] Replied to comment with commit SHA
- [ ] Thread resolved via GraphQL — immediately after replying

---

## 2. Fetching PR comments

> **⚠️ NEVER use built-in IDE tools** (`github-pull-request_activePullRequest` etc.) — they return stale/cached data. Always use `gh api graphql` directly.

### Primary method: GraphQL reviewThreads

Returns all threads with resolution status, thread IDs, and comment bodies in one call:

```bash
gh api graphql -f query='
  query($owner: String!, $repo: String!, $pr: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $pr) {
        reviewThreads(first: 100) {
          nodes {
            id
            isResolved
            comments(first: 5) {
              nodes { body path author { login } }
            }
          }
        }
      }
    }
  }
' -f owner="<OWNER>" -f repo="<REPO>" -F pr=<PR>
```

The `id` field on each thread node is the `threadId` needed for resolution.

### REST fallback (only when you need comment IDs for replies)

```bash
gh api repos/<OWNER>/<REPO>/pulls/<PR>/comments --jq "[.[] | {id, path}]"
```

Returns `id` (needed for `in_reply_to` in replies) and `path`. Does NOT show resolution status.

### CI status

```bash
gh pr checks <PR>
```

On failure: `gh run view <run_id> --log-failed` to diagnose.

---

## 3. Assessing comments

### Categorize

Group into: **Actionable** | **Questions** | **Informational** | **Blocking**

Present as a table with file, author, and summary. Wait for developer confirmation before acting.

### Bot comments (`copilot-pull-request-reviewer`, `github-actions`)

- Do not blindly apply — verify against project conventions and codebase context
- Watch for false positives (API format assumptions, inapplicable security warnings, style conflicts with tooling)
- When uncertain, present with your assessment. When wrong, explain why

---

## 4. Responding to comments

### Reply (REST API)

```bash
# -F (not -f) for numeric in_reply_to
gh api repos/<OWNER>/<REPO>/pulls/<PR>/comments \
  -X POST -f body="Fixed in <SHA>." -F in_reply_to=<COMMENT_ID>
```

### Resolve (GraphQL — required after every reply)

```bash
gh api graphql -f query='
  mutation { resolveReviewThread(input: {threadId: "<THREAD_ID>"}) { thread { isResolved } } }
'
```

### Batch resolution

```bash
# Simple loop (copy-paste, replace IDs)
for thread_id in <ID1> <ID2> <ID3>; do
  gh api graphql -f query="mutation { resolveReviewThread(input: {threadId: \"$thread_id\"}) { thread { isResolved } } }"
done

# Or single call (faster for many threads)
gh api graphql -f query='mutation {
  t1: resolveReviewThread(input: {threadId: "<ID1>"}) { thread { isResolved } }
  t2: resolveReviewThread(input: {threadId: "<ID2>"}) { thread { isResolved } }
}'
```

### Disagreeing

Reply with reasoning, then resolve the thread. Do not leave threads open.

---

## 5. Creating PRs (PowerShell)

NEVER pass backtick-containing text via `--body` — PowerShell interprets backticks as escape characters.

```powershell
# Write body to temp file (use create_file tool), then:
gh pr create --title "feat: ..." --body-file tmp_pr_body.md
Remove-Item tmp_pr_body.md
```
