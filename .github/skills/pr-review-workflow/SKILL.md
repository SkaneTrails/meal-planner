---
## name: pr-review-workflow description: Handle post-push PR workflows: review comments, feedback, and CI status using GitHub CLI and APIs. license: MIT

# Skill: PR Review Workflow

This skill defines how to handle pull request review workflows after pushing changes.
---

## Activation context

This skill activates when:

- The agent has just pushed commits to a PR branch.
- The developer asks about PR comments, review feedback, or CI status.
- The developer mentions "check comments", "review feedback", "CI status", or "workflow status".

---

## 1. Post-push workflow

After successfully pushing changes to a PR branch, **automatically fetch and present review comments**. Do not ask whether to check - assume there are comments and check them.

**Always run BOTH of these commands:**

1. Top-level PR comments: `gh pr view --json comments,reviews`
1. **Inline code review comments**: `gh api repos/<OWNER>/<REPO>/pulls/<PR>/comments --paginate`

The inline comments API call is where Copilot and human reviewers leave code-level feedback. **Never skip it.**

After fetching comments, summarize them (see section 3) and ask which to address.

For CI status, offer to check:

> CI passed. Would you like me to check the workflow details?

**Completion checklist for each comment (all boxes required):**

- [ ] Code fix implemented
- [ ] Committed with descriptive message
- [ ] Pushed to remote
- [ ] Replied to comment with commit SHA
- [ ] Thread resolved via GraphQL API (inline review comments only - top-level PR comments cannot be resolved)

Do not consider a comment "handled" until ALL steps are complete. After fixing and pushing, return to sections 4 and 6 to reply and resolve.

---

## 2. Fetching PR comments

> **CRITICAL:** You MUST check BOTH top-level comments AND inline review comments.
> The `gh pr view --json comments,reviews` command **does NOT return inline code comments**.
> Always run `gh api repos/<OWNER>/<REPO>/pulls/<PR>/comments --paginate` to get inline comments.
> Skipping this step means missing Copilot's code suggestions and human review feedback.

### 2.1 Identify PR context

Determine the PR number and repository from:

1. The current branch name and `gh pr view` output.
1. Repository information from git remote.

Propose running the following commands (or use a shell tool if available and the developer agrees):

```bash
# Get current PR number
gh pr view --json number -q '.number'

# Get repo owner/name
gh repo view --json owner,name -q '"\(.owner.login)/\(.name)"'
```

### 2.2 Fetch conversation comments

Propose running `gh pr view` for top-level conversation comments:

```bash
gh pr view <PR> --json comments -q '.comments[] | {author: .author.login, body: .body, createdAt: .createdAt}'
```

### 2.3 Fetch inline review comments

**Critical:** `gh pr view --json comments` and `gh pr view --json reviews` do NOT return inline code review comments. They only return PR-level conversation comments and review summaries. You MUST use the REST API to fetch inline comments:

```bash
gh api repos/<OWNER>/<REPO>/pulls/<PR>/comments
```

This returns an array of review comments with:

- `path`: File path the comment is on.
- `line` / `original_line`: Line number.
- `body`: Comment text.
- `user.login`: Author.
- `id`: Comment ID (needed for replies/resolution).
- `in_reply_to_id`: If this is a reply to another comment.

### 2.4 Fetch review summaries

Propose fetching overall review status:

```bash
gh pr view <PR> --json reviews -q '.reviews[] | {author: .author.login, state: .state, body: .body}'
```

---

## 3. Assessing and summarizing comments

After fetching comments, provide a structured summary:

### 3.1 Categorize comments

Group comments into:

1. **Actionable**: Suggestions for code changes, bug fixes, or improvements.
1. **Questions**: Clarifications needed from the author.
1. **Informational**: FYI comments, praise, or general observations.
1. **Blocking**: Changes requested that must be addressed before merge.

### 3.2 Summary format

Present a summary like:

> **PR #123 Review Summary**
>
> **Actionable (3):**
>
> - [file.py#L42](file.py#L42): @reviewer suggests using `pathlib` instead of `os.path`
> - [config.json#L15](config.json#L15): @reviewer: Missing required field `timeout`
> - [tests/test_api.py#L88](tests/test_api.py#L88): @reviewer: Add test for error case
>
> **Questions (1):**
>
> - [README.md#L20](README.md#L20): @reviewer asks: Why was this section removed?
>
> **Informational (1):**
>
> - General: @reviewer: "Nice refactoring of the database module!"

### 3.3 Critically assess automated suggestions

When comments are from `copilot-pull-request-reviewer`, `github-actions`, or other bots:

1. **Do not blindly apply suggestions.** Bots lack full codebase and domain context.
1. **Verify correctness:** Check if the suggestion applies to this project's conventions and APIs.
1. **Watch for false positives:**
   - API payload format suggestions (e.g., Jira field names, REST body structure) - the bot may not know the actual API.
   - Security warnings that don't apply to the deployment context.
   - Style suggestions that conflict with project conventions or tooling.
1. **When uncertain:** Present the suggestion to the developer with your assessment. Do not auto-apply.
1. **When the suggestion is wrong:** Point out why it's incorrect rather than silently skipping it.

Example assessment:

> **Bot suggestion:** "Use `{"name": "username"}` instead of `{"assignee": "email"}`"

### 3.4 Present before acting

Before making any changes based on review comments:

1. **Present all comments to the developer** with your assessment of each (agree, disagree, need clarification).
1. **Wait for developer confirmation** on which comments to address.
1. **Do not proceed to commit/push** until the developer explicitly confirms the plan.

This prevents silently skipping valid feedback or applying incorrect suggestions.

---

## 4. Responding to comments

### 4.1 When agreeing with a comment

1. **Make the fix**: Edit the file to address the feedback.
1. **Stage and commit**: Use a descriptive commit message referencing the feedback.
1. **Push the changes**.
1. **Reply to the comment** - propose running:

```bash
gh api repos/<OWNER>/<REPO>/pulls/<PR>/comments/<COMMENT_ID>/replies \
  -X POST -f body="Fixed in <COMMIT_SHA>. Thanks for catching this!"
```

5. **Resolve the conversation** (if the comment is on a review thread) - propose running:

> **WARNING:** Replying does NOT resolve the thread. You MUST call the GraphQL mutation separately to resolve it.

```bash
gh api graphql -f query='
  mutation {
    resolveReviewThread(input: {threadId: "<thread_id>"}) {
      thread { isResolved }
    }
  }
'
```

**Note:** The `threadId` is a GraphQL node ID, not the REST API `comment_id`. To obtain it, first fetch review threads:

```bash
gh api graphql -f query='
  query($owner: String!, $repo: String!, $pr: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $pr) {
        reviewThreads(first: 100) {
          nodes { id isResolved comments(first: 1) { nodes { body } } }
        }
      }
    }
  }
' -f owner="<OWNER>" -f repo="<REPO>" -F pr=<PR>
```

Match the thread by its first comment body, then use the `id` field as `threadId`.

### 4.2 When disagreeing with a comment

1. **Analyze the suggestion** against the codebase context.
1. **Reply with reasoning** - propose running:

```bash
gh api repos/<OWNER>/<REPO>/pulls/<PR>/comments/<COMMENT_ID>/replies \
  -X POST -f body="I considered this, but <REASONING>. The current approach <JUSTIFICATION>."
```

3. **Resolve the conversation** after explaining the disagreement (see thread resolution in 4.1).

### 4.3 Batch processing

When multiple comments need addressing:

1. Group related fixes into logical commits.
1. Push all changes at once.
1. **Reply to all comments in a loop** - collect comment IDs and iterate:
   ```bash
   for id in ID1 ID2 ID3; do
     gh api repos/<OWNER>/<REPO>/pulls/comments/$id/replies \
       -X POST -f body="Fixed in <COMMIT_SHA>."
   done
   ```
1. **Resolve all threads in a loop** - fetch thread IDs, then iterate:
   ```bash
   for thread_id in THREAD1 THREAD2 THREAD3; do
     gh api graphql -f query="mutation { resolveReviewThread(input: {threadId: \"$thread_id\"}) { thread { isResolved } } }"
   done
   ```

> **REMINDER:** Replying and resolving are separate operations. Never skip the resolve loop.

---

## 5. Checking CI/workflow status

### 5.1 Fetch workflow runs

Propose running the following commands (or use a shell tool if available and the developer agrees):

```bash
# List recent workflow runs for the current branch
gh run list --branch <branch_name> --limit 5

# Get detailed status of a specific run
gh run view <run_id>

# Get failed jobs and their logs
gh run view <run_id> --log-failed
```

### 5.2 Assess workflow failures

When a workflow fails:

1. **Identify the failing job** from the run output.
1. **Fetch the logs** for the failed step.
1. **Analyze the error**:
   - Is it a test failure? → Identify which test and why.
   - Is it a lint/format issue? → Run the linter locally and fix.
   - Is it an infrastructure issue? → Check if it's a flaky test or transient error.
1. **Suggest or implement a fix**.

### 5.3 Status summary format

Present CI status like:

> **CI Status for PR #123**
>
> | Workflow     | Status | Duration | Details           |
> | ------------ | ------ | -------- | ----------------- |
> | test.yml     | Pass   | 3m 42s   |                   |
> | lint.yml     | Fail   | 1m 15s   | ruff check failed |
> | security.yml | Pass   | 2m 08s   |                   |
>
> **Failure Analysis:**
> `lint.yml` failed due to unused import in `src/api/routes.py:15`.
> Would you like me to fix this?

---

## 6. Iterative workflow

After addressing comments and fixing CI issues:

1. **Push the fixes**.
1. **Reply to each addressed comment** explaining how it was fixed (see section 4.1).
1. **Resolve the review threads** for comments that were addressed.
1. **Offer to re-check**: "Changes pushed. Want me to check for new comments or CI status?"
1. **Repeat** until the PR is ready for merge.

**Critical:** Do not consider a comment "handled" just because you pushed a commit that addresses it. The review thread remains open until explicitly replied to and resolved.

**The workflow is incomplete if you stop after pushing.** Reviewers see unresolved threads as outstanding issues. Always complete the reply→resolve loop before moving on or reporting completion to the developer.

---

## 7. Command reference

| Task                                      | Command                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------- |
| Get PR number                             | `gh pr view --json number -q '.number'`                                         |
| Get PR comments (top-level only)          | `gh pr view <PR> --json comments`                                               |
| **Get inline review comments (REQUIRED)** | `gh api repos/<OWNER>/<REPO>/pulls/<PR>/comments --paginate`                    |
| Get review status                         | `gh pr view <PR> --json reviews`                                                |
| Reply to inline comment                   | `gh api repos/<OWNER>/<REPO>/pulls/comments/<ID>/replies -X POST -f body="..."` |
| List workflow runs                        | `gh run list --branch <branch> --limit 5`                                       |
| View failed workflow logs                 | `gh run view <run_id> --log-failed`                                             |
| Re-run failed workflow                    | `gh run rerun <run_id> --failed`                                                |

---

## 8. Creating PRs with multi-line bodies

When creating PRs with `gh pr create`, avoid passing complex body text directly via `--body` as quotes and special characters cause shell parsing errors.

**Robust solution - pipe to stdin (PowerShell):**

````powershell
@"
## Summary
Description with "quotes" and special characters.

The `--body-file -` flag reads the body from stdin, avoiding all quoting issues. This works reliably with:

- Multi-line content
- Quotes and special characters
- Markdown formatting
- URLs and links

**Alternative - open in editor:**

```bash
gh pr create --editor
````

This opens the system editor for title and body input.

---

## 9. Multi-repo workflow

When working across multiple repositories with the same or similar files (e.g., shared skills, copilot-instructions):

1. **Fetch comments from ALL repos first.** Do not assume identical files receive identical feedback. Different reviewers or bots may flag different issues.
1. **Aggregate and deduplicate comments.** Group similar feedback across repos to avoid redundant work.
1. **Apply fixes to the source-of-truth repo first.** Make changes in one place, then sync to others.
1. **Sync files before committing.** Ensure all repos have identical content for shared files.
1. **Commit and push to all repos.** Use a loop to ensure consistency.
1. **Reply to and resolve comments in ALL repos.** Each repo's PR has its own review threads that must be addressed individually.

---

## 10. Skåne Trails project context

For this project (Skåne Trails Streamlit app on GCP free tier):

- **Streamlit multi-page app**: Many PRs change UI behavior and page interactions (`app/_Home_.py`, `app/pages/`). When reviewing, consider both code quality and user experience impacts.
- **Firestore + Cloud Run on GCP free tier**: All data persistence uses Firestore and the app runs on Cloud Run. PR changes must respect free-tier limits (reads/writes, requests, CPU/memory) and avoid introducing costly polling or chatty database patterns.
- **Infrastructure via Terraform only**: Any change that affects GCP resources must be implemented in `infra/` with Terraform. Do not suggest or approve manual console or `gcloud`-only changes.
- **Security and CI workflows**: CI runs Trivy scans, SBOM and license checks, and tests via GitHub Actions. When reviewing PRs, ensure new dependencies, workflows, or patterns align with these existing checks and keep the project zero-cost and public-repo safe.
- **Pre-commit hooks** may auto-format files—always run `git diff` after committing to verify the actual changes.
- **mdformat** can alter markdown structure—be aware that deeply indented markdown after code blocks may be reformatted.
