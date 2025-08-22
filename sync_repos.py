#!/usr/bin/env python3
"""
sync_repos.py (v4)

Goals:
- Push full history to the private remote.
- Push only the latest change to the public remote by default (no history rewrite, no full history).
- Avoid switching the current working branch; use a temporary worktree when needed.
- Handle empty repos (unborn HEAD) safely.

Modes for public push:
- cherry-pick (default):
  Fetch public tip into a detached worktree, cherry-pick the latest local commit onto it, and push that single commit.
  If the public branch does not exist, falls back to snapshot mode for first-time initialization.
- snapshot: Create a single commit from the HEAD tree (or from the working tree if unborn) and force-push it to public.
"""

import argparse
import os
import subprocess
import sys
import tempfile
from textwrap import dedent
import shutil
from datetime import datetime

# Log file path
LOG_PATH = os.path.join(os.getcwd(), "sync_repos.log")
LOG_FH = None

# Global verbose flag toggled by --verbose
VERBOSE = False

def open_log():
    global LOG_FH
    LOG_FH = open(LOG_PATH, "a", encoding="utf-8", buffering=1)
    header = f"\n=== sync_repos run @ {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC ===\n"
    LOG_FH.write(header)

def close_log():
    global LOG_FH
    try:
        if LOG_FH:
            LOG_FH.flush()
            LOG_FH.close()
    finally:
        LOG_FH = None

def log(msg: str = ""):
    # Mirror output to console and to log file
    try:
        print(msg)
    except Exception:
        # Best-effort if printing fails
        pass
    try:
        if LOG_FH:
            LOG_FH.write(str(msg) + ("" if str(msg).endswith("\n") else "\n"))
    except Exception:
        pass

def run(cmd, env=None):
    if VERBOSE:
        try:
            log("$ " + " ".join(cmd))
        except Exception:
            # Fallback if non-str items exist in cmd list
            log(f"$ {cmd}")
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, env=env)
    if VERBOSE:
        if res.stdout.strip():
            log("stdout:\n" + res.stdout.strip())
        if res.stderr.strip():
            log("stderr:\n" + res.stderr.strip())
    return res

def must(cmd, msg=None, env=None):
    r = run(cmd, env=env)
    if r.returncode != 0:
        raise RuntimeError(dedent(f"""
            {msg or 'Command failed'}: {' '.join(cmd)}
            stdout:
            {r.stdout.strip()}

            stderr:
            {r.stderr.strip()}
        """).strip())
    return r.stdout.strip()

def ensure_repo():
    out = must(["git", "rev-parse", "--is-inside-work-tree"])
    if out.lower() != "true":
        sys.exit("❌ Not inside a Git repository.")

def git_top_level():
    return must(["git", "rev-parse", "--show-toplevel"])

def is_unborn_head():
    # true if rev-parse HEAD fails (no commits yet)
    r = run(["git", "rev-parse", "HEAD"])
    return r.returncode != 0

def current_branch_guess():
    # Works even on unborn HEAD
    r = run(["git", "symbolic-ref", "--short", "HEAD"])
    if r.returncode == 0 and r.stdout.strip():
        return r.stdout.strip()
    # Fallback
    return "main"

def last_commit_msg_or(default="snapshot"):
    r = run(["git", "log", "-1", "--pretty=%B"])
    return r.stdout.strip() if r.returncode == 0 and r.stdout.strip() else default

def ensure_remote(name, url_opt_flag, url_value):
    r = run(["git", "remote"])
    if r.returncode != 0:
        sys.exit("❌ Cannot list remotes.")
    remotes = r.stdout.split()
    if name in remotes:
        return
    if url_value:
        must(["git", "remote", "add", name, url_value], f"Adding remote {name}")
    else:
        sys.exit(f"❌ Remote '{name}' not found. Provide --{url_opt_flag}.")

def remote_url(name):
    r = run(["git", "remote", "get-url", name])
    return r.stdout.strip() if r.returncode == 0 else None

def author_env(preserve=False):
    if not preserve:
        return None
    # Use HEAD author if available; else fallback to local config
    a_name  = run(["git", "log", "-1", "--pretty=%an"]).stdout.strip()
    a_email = run(["git", "log", "-1", "--pretty=%ae"]).stdout.strip()
    if not a_name:
        a_name = run(["git", "-c", "user.useConfigOnly=true", "config", "--get", "user.name"]).stdout.strip() or "Public Snapshot"
    if not a_email:
        a_email = run(["git", "-c", "user.useConfigOnly=true", "config", "--get", "user.email"]).stdout.strip() or "noreply@example.com"
    # use same for committer
    return {
        "GIT_AUTHOR_NAME": a_name,
        "GIT_AUTHOR_EMAIL": a_email,
        "GIT_COMMITTER_NAME": a_name,
        "GIT_COMMITTER_EMAIL": a_email
    }

def push_full_history(private_remote, branch):
    log(f"→ Pushing full history: {branch} → {private_remote}/{branch}")
    must(["git", "push", private_remote, f"{branch}:{branch}"])

def make_root_commit_from_head_tree(message, env_overrides=None):
    tree = must(["git", "rev-parse", "HEAD^{tree}"], "Getting HEAD tree")
    return make_commit_from_tree(tree, message, env_overrides)

def make_root_commit_from_worktree(message, repo_root, env_overrides=None):
    # Use a temporary index so we don't touch the real index
    with tempfile.NamedTemporaryFile(prefix="public_index_", delete=False) as tmp:
        temp_index = tmp.name
    try:
        env = os.environ.copy()
        env["GIT_INDEX_FILE"] = temp_index
        env["GIT_WORK_TREE"] = repo_root
        # Stage everything currently in the working tree (including untracked)
        must(["git", "add", "-A"], "Staging working tree into temp index", env=env)
        # Write the tree from the temp index
        tree = must(["git", "write-tree"], "Writing tree from temp index", env=env)
        return make_commit_from_tree(tree, message, env_overrides)
    finally:
        try:
            os.remove(temp_index)
        except OSError:
            pass

def make_commit_from_tree(tree_sha, message, env_overrides=None):
    env = os.environ.copy()
    if env_overrides:
        env.update(env_overrides)
    # Create a commit with NO parents from the given tree
    r = run(["git", "commit-tree", tree_sha, "-m", message], env=env)
    if r.returncode != 0:
        raise RuntimeError(f"commit-tree failed:\n{r.stderr}")
    return r.stdout.strip()

def push_public_snapshot(public_remote, public_branch, commit_sha):
    log(f"→ Force-pushing snapshot commit {commit_sha[:7]} → {public_remote}/{public_branch}")
    # Some Git versions require fully-qualified destination ref
    must(["git", "push", public_remote, f"{commit_sha}:refs/heads/{public_branch}", "--force"])

def fetch_public_tip(public_remote, public_branch):
    r = run(["git", "fetch", public_remote, public_branch])
    if r.returncode != 0:
        return False
    return True

def cherry_pick_last_to_public(public_remote, public_branch, last_commit):
    # Create a temporary worktree at FETCH_HEAD and cherry-pick the last commit
    worktree_dir = tempfile.mkdtemp(prefix="public_sync_")
    try:
        must(["git", "worktree", "add", "--detach", worktree_dir, "FETCH_HEAD"], "Adding temporary worktree at FETCH_HEAD for public sync")
        # Perform operations inside the worktree
        def wt(*args):
            return must(["git", "-C", worktree_dir, *args])

        try:
            wt("cherry-pick", last_commit)
        except Exception as e:
            # Attempt to abort cherry-pick on failure to leave worktree clean
            run(["git", "-C", worktree_dir, "cherry-pick", "--abort"])  # best effort
            raise

        # Push only this one commit (HEAD in worktree) to public branch
        wt("push", public_remote, f"HEAD:refs/heads/{public_branch}")
        log("✓ Pushed one cherry-picked commit to public.")
    finally:
        # Clean up worktree directory
        try:
            must(["git", "worktree", "remove", "--force", worktree_dir], "Removing temporary worktree")
        except Exception:
            # If git fails to remove, try filesystem removal
            shutil.rmtree(worktree_dir, ignore_errors=True)

def parse_args():
    p = argparse.ArgumentParser(description="Push full history to private and single-commit snapshot to public.")
    p.add_argument("--private-remote", default="private")
    p.add_argument("--private-url", help="URL if 'private' remote is missing")
    p.add_argument("--public-remote", default="public")
    p.add_argument("--public-url", help="URL if 'public' remote is missing")
    p.add_argument("--branch", help="Branch to push to private (default: current)")
    p.add_argument("--public-branch", default="main")
    p.add_argument("--public-message", help="Public commit message override")
    p.add_argument("--preserve-author", action="store_true", help="Preserve author/committer from HEAD or git config")
    p.add_argument("--public-mode", choices=["cherry-pick", "snapshot"], default="cherry-pick",
                   help="How to update public: cherry-pick latest commit (default) or snapshot from HEAD tree")
    p.add_argument("--verbose", action="store_true", help="Print commands and outputs for debugging")
    return p.parse_args()

def main():
    ensure_repo()
    repo_root = git_top_level()
    args = parse_args()

    global VERBOSE
    VERBOSE = bool(args.verbose)

    ensure_remote(args.private_remote, "private-url", args.private_url)
    ensure_remote(args.public_remote,  "public-url",  args.public_url)

    priv_url = remote_url(args.private_remote)
    pub_url  = remote_url(args.public_remote)
    if not priv_url: sys.exit(f"❌ Remote '{args.private_remote}' missing URL.")
    if not pub_url:  sys.exit(f"❌ Remote '{args.public_remote}' missing URL.")

    unborn = is_unborn_head()
    branch = args.branch or current_branch_guess()

    log("✅ Remotes:")
    log(f"   {args.private_remote}: {priv_url}")
    log(f"   {args.public_remote}: {pub_url}")
    log(f"✅ Branch (private full history): {branch} ({'unborn' if unborn else 'ok'})")
    log(f"✅ Public branch (single commit): {args.public_branch}")
    log("")

    # 1) Private push (only if we have history)
    if unborn:
        log("ℹ️ Repo has no commits yet; skipping private push (nothing to push).")
    else:
        push_full_history(args.private_remote, branch)

    # 2) Public update
    if args.public_mode == "snapshot":
        # Keep existing behavior (force replace with a single commit)
        msg = args.public_message or f"Public version: {last_commit_msg_or('snapshot')}"
        env = author_env(args.preserve_author)
        if unborn:
            log("→ Building public snapshot from WORKING TREE (temporary index)…")
            pub_commit = make_root_commit_from_worktree(msg, repo_root, env_overrides=env)
        else:
            log("→ Building public snapshot from HEAD tree…")
            pub_commit = make_root_commit_from_head_tree(msg, env_overrides=env)
        push_public_snapshot(args.public_remote, args.public_branch, pub_commit)
    else:
        # Cherry-pick only the latest local commit onto the public tip
        if unborn:
            # No local commits to cherry-pick; publish a snapshot commit (first-time init)
            log("ℹ️ Unborn HEAD locally; falling back to snapshot for public initialization.")
            msg = args.public_message or "Public version: initial snapshot"
            env = author_env(args.preserve_author)
            pub_commit = make_root_commit_from_worktree(msg, repo_root, env_overrides=env)
            push_public_snapshot(args.public_remote, args.public_branch, pub_commit)
        else:
            # Fetch public tip; if missing, initialize via snapshot to avoid pushing full history
            if not fetch_public_tip(args.public_remote, args.public_branch):
                log(f"ℹ️ Public branch '{args.public_branch}' not found. Initializing with snapshot (one commit).")
                msg = args.public_message or f"Public version: {last_commit_msg_or('snapshot')}"
                env = author_env(args.preserve_author)
                pub_commit = make_root_commit_from_head_tree(msg, env_overrides=env)
                push_public_snapshot(args.public_remote, args.public_branch, pub_commit)
            else:
                # Determine last local commit
                last_local = must(["git", "rev-parse", "HEAD"], "Getting last local commit")
                cherry_pick_last_to_public(args.public_remote, args.public_branch, last_local)

    log("\n🎉 Done.")
    if unborn:
        log("   • Private: skipped (no commits yet).")
    else:
        log("   • Private: full history updated.")
    if args.public_mode == "snapshot":
        log("   • Public: replaced with exactly one commit (fresh snapshot).")
    else:
        log("   • Public: updated by cherry-picking the latest commit onto public tip (or initialized via snapshot if missing).")

if __name__ == "__main__":
    try:
        open_log()
        main()
    except Exception as e:
        log(f"\n❌ Error: {e}\n")
        sys.exit(1)
    finally:
        close_log()
