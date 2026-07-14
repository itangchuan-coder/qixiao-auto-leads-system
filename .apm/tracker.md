---
title: 启效智联汽车销售线索管理系统
---

# APM Tracker

## Task Tracking

**Stage 1:**

| Task | Status | Agent | Branch |
|------|--------|-------|--------|
| 1.1 | Ready | architecture-agent | |
| 1.2 | Waiting: 1.1, 1.3 | architecture-agent | |
| 1.3 | Ready | quality-agent | |
| 1.4 | Ready | release-agent | |

**Stage 2:**

| Task | Status | Agent | Branch |
|------|--------|-------|--------|
| 2.1 | Waiting: 1.2, 1.3 | quality-agent | |
| 2.2 | Waiting: 1.2, 1.4 | release-agent | |

**Stage 3:**

| Task | Status | Agent | Branch |
|------|--------|-------|--------|
| 3.1 | Waiting: 2.1, 2.2 | release-agent | |

## Worker Tracking

| Agent | Instance | Notes |
|-------|----------|-------|
| architecture-agent | Uninitialized | |
| quality-agent | Uninitialized | |
| release-agent | Uninitialized | |

## Version Control

| Repository | Base Branch | Branch Convention | Commit Convention |
|-----------|-------------|-------------------|-------------------|
| qixiao-auto-leads-system | main | `codex/<type>/<short-description>` | `<type>: <description>` (`feat`, `fix`, `refactor`, `test`, `docs`, `chore`) |

## Working Notes

- The uncommitted business fixes, SOP updates, Vercel configuration, and APM initialization files are the valid baseline and must not be reverted or overwritten.
- Before parallel worktrees can safely start, the baseline needs a user-approved, traceable branch point because worktrees contain tracked files only.
