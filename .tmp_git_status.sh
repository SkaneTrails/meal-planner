#!/bin/bash
export GIT_PAGER=cat
export PAGER=cat
export TERM=dumb
cd /Users/caterina.bonazzi/git/meal-planner
echo "=== GIT STATUS ==="
git status --short
echo "=== GIT LOG ==="
git log --oneline -5
echo "=== REMOTE STATUS ==="
git rev-parse HEAD
git rev-parse origin/refactor/household-scoped-data 2>/dev/null || echo "no remote tracking"
echo "=== DONE ==="
