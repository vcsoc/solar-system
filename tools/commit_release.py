#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
commit_release.py
- Build changelog & README notes from recent commits.
- Optional AI-written summary (OpenAI-compatible).
- Optional semver bump in package.json and tag.
- Optional push via tools/sync_repos.py after committing.
"""

from __future__ import annotations
import argparse
import datetime as dt
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from urllib import request

REPO = Path.cwd()
PKG_JSON = REPO / "package.json"

LATEST_START = "<!-- LATEST-CHANGES-START -->"
LATEST_END   = "<!-- LATEST-CHANGES-END -->"

# Conventional buckets
import re
BUCKET_PATTERNS = [
    ("Features",       re.compile(r"^feat(\(.+\))?:", re.I)),
    ("Fixes",          re.compile(r"^fix(\(.+\))?:", re.I)),
    ("Docs",           re.compile(r"^docs(\(.+\))?:", re.I)),
    ("Performance",    re.compile(r"^perf(\(.+\))?:", re.I)),
    ("Refactors",      re.compile(r"^refactor(\(.+\))?:", re.I)),
    ("Build",          re.compile(r"^build(\(.+\))?:", re.I)),
    ("CI",             re.compile(r"^ci(\(.+\))?:", re.I)),
    ("Tests",          re.compile(r"^test(\(.+\))?:", re.I)),
    ("Chores",         re.compile(r"^chore(\(.+\))?:", re.I)),
]
OTHER_BUCKET = "Other"

def run(cmd: List[str], check: bool = True, env: Optional[Dict[str, str]] = None) -> Tuple[int, str, str]:
    res = subprocess.run(cmd, cwd=str(REPO), text=True, env=env,
                         stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if check and res.returncode != 0:
        raise RuntimeError(f"Command failed: {' '.join(cmd)}\nstdout:\n{res.stdout}\nstderr:\n{res.stderr}")
    return res.returncode, res.stdout.strip(), res.stderr.strip()

def ensure_git_repo():
    _, out, _ = run(["git", "rev-parse", "--is-inside-work-tree"])
    if out.lower() != "true":
        sys.exit("❌ Not inside a Git repository.")

def ensure_clean_worktree(allow_dirty: bool):
    if allow_dirty:
        return
    _, out, _ = run(["git", "status", "--porcelain"])
    if out.strip():
        # If running in an interactive terminal, offer to stage & commit to proceed
        try:
            if sys.stdin.isatty():
                print("⚠️  Working tree not clean.")
                ans = input("Stage all changes and create a commit now? [y/N]: ").strip().lower()
                if ans in ("y", "yes"):
                    # Stage everything
                    run(["git", "add", "-A"])
                    default_msg = "chore: checkpoint before release"
                    msg = input(f"Commit message [{default_msg}]: ").strip()
                    if not msg:
                        msg = default_msg
                    # Commit staged changes
                    rc, _, err = run(["git", "commit", "-m", msg], check=False)
                    if rc != 0:
                        sys.exit(f"❌ Failed to commit staged changes.\n{err}")
                    return  # proceed after committing
        except Exception:
            # Fall through to default exit if any prompt fails
            pass
        sys.exit("❌ Working tree not clean. Commit/stash or use --allow-dirty.")

def is_unborn_head() -> bool:
    rc, _, _ = run(["git", "rev-parse", "HEAD"], check=False)
    return rc != 0

def current_branch_guess() -> str:
    rc, out, _ = run(["git", "symbolic-ref", "--short", "HEAD"], check=False)
    return out if rc == 0 and out else "main"

def last_tag_or_root() -> str:
    rc, tag, _ = run(["git", "describe", "--tags", "--abbrev=0"], check=False)
    if rc == 0 and tag:
        return tag
    _, root, _ = run(["git", "rev-list", "--max-parents=0", "HEAD"])
    return root

def get_commits_since(since_ref: str) -> List[Tuple[str, str, str, str]]:
    fmt = "%h%x09%s%x09%an%x09%H"
    rc, out, _ = run(["git", "log", f"{since_ref}..HEAD", "--no-merges", f"--pretty=format:{fmt}"], check=False)
    if rc != 0 or not out.strip():
        return []
    commits = []
    for line in out.splitlines():
        parts = line.split("\t")
        if len(parts) != 4:
            h, rest = parts[0], "\t".join(parts[1:])
            sub, auth, full = rest.rsplit("\t", 3)
            parts = [h, sub, auth, full]
        short, subject, author, full_hash = parts
        commits.append((short, subject.strip(), author.strip(), full_hash))
    return commits

def top_changed_files_since(since_ref: str, limit: int = 20) -> List[str]:
    rc, out, _ = run(["git", "diff", "--name-only", f"{since_ref}..HEAD"], check=False)
    if rc != 0 or not out.strip():
        return []
    files = out.splitlines()
    return files[:limit]

def shortstat_since(since_ref: str) -> str:
    rc, out, _ = run(["git", "diff", "--shortstat", f"{since_ref}..HEAD"], check=False)
    return out.strip() if rc == 0 and out.strip() else ""

def bucketize(commits: List[Tuple[str, str, str, str]]) -> Dict[str, List[str]]:
    buckets: Dict[str, List[str]] = {name: [] for name, _ in BUCKET_PATTERNS}
    buckets[OTHER_BUCKET] = []
    for short, subject, author, _ in commits:
        line = f"- {subject} ({author}, {short})"
        matched = False
        for name, rx in BUCKET_PATTERNS:
            if rx.search(subject):
                buckets[name].append(line)
                matched = True
                break
        if not matched:
            buckets[OTHER_BUCKET].append(line)
    return {k: v for k, v in buckets.items() if v}

def build_notes(since_ref: str) -> List[str]:
    commits = get_commits_since(since_ref)
    if not commits:
        return ["No changes."]
    buckets = bucketize(commits)
    lines: List[str] = []
    for name in ["Features","Fixes","Docs","Performance","Refactors","Build","CI","Tests","Chores",OTHER_BUCKET]:
        items = buckets.get(name)
        if not items:
            continue
        lines.append(f"### {name}")
        lines.extend(items)
        lines.append("")
    if lines and lines[-1] == "":
        lines.pop()
    return lines

# ---- case-resolving helpers for Windows/macOS ----
def resolve_existing(path_candidates: List[str]) -> Path:
    for name in path_candidates:
        p = REPO / name
        if p.exists():
            return p
    for name in path_candidates:
        for child in REPO.iterdir():
            if child.name.lower() == name.lower():
                return child
    return REPO / path_candidates[0]

def paths_for_docs() -> Tuple[Path, Path]:
    changelog = resolve_existing(["CHANGELOG.md", "Changelog.md", "changelog.md"])
    readme    = resolve_existing(["README.md", "Readme.md", "readme.md"])
    return changelog, readme

def prepend_changelog(changelog_path: Path, section_title: str, notes: List[str], summary_block: Optional[List[str]] = None):
    header = "# Changelog"
    existing = changelog_path.read_text(encoding="utf-8") if changelog_path.exists() else ""
    has_header = existing.lstrip().startswith(header)

    new_section: List[str] = [f"## {section_title}", ""]
    if summary_block:
        new_section += summary_block + [""]
    new_section += notes + [""]

    pieces: List[str] = []
    if not has_header:
        pieces += [header, ""]
    pieces += new_section
    if existing:
        pieces.append(existing.rstrip())
        pieces.append("")

    changelog_path.write_text("\n".join(pieces), encoding="utf-8")

def update_readme_latest(readme_path: Path, notes: List[str], summary_block: Optional[List[str]] = None):
    existing = readme_path.read_text(encoding="utf-8") if readme_path.exists() else ""
    body_lines: List[str] = []
    if summary_block:
        body_lines += ["### Summary"] + summary_block + [""]
    body_lines += notes
    block = f"{LATEST_START}\n" + "\n".join(body_lines) + f"\n{LATEST_END}\n"

    if LATEST_START in existing and LATEST_END in existing:
        pre, rest = existing.split(LATEST_START, 1)
        _, post = rest.split(LATEST_END, 1)
        new_body = pre + block + post
    else:
        appendix = "\n## Latest changes\n\n" + block
        new_body = existing + appendix

    readme_path.write_text(new_body, encoding="utf-8")

def read_package_version() -> Optional[str]:
    if not PKG_JSON.exists():
        return None
    try:
        data = json.loads(PKG_JSON.read_text(encoding="utf-8"))
        return str(data.get("version")) if "version" in data else None
    except Exception:
        return None

def bump_semver(ver: str, kind: str) -> str:
    try:
        major, minor, patch = [int(x) for x in ver.split(".")]
    except Exception:
        raise ValueError(f"package.json version '{ver}' is not MAJOR.MINOR.PATCH")
    if kind == "major":
        return f"{major+1}.0.0"
    if kind == "minor":
        return f"{major}.{minor+1}.0"
    if kind == "patch":
        return f"{major}.{minor}.{patch+1}"
    return ver

def write_package_version(new_ver: str):
    data = json.loads(PKG_JSON.read_text(encoding="utf-8"))
    data["version"] = new_ver
    PKG_JSON.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

def git_add(paths: List[Path]):
    run(["git", "add"] + [str(p) for p in paths])

def git_commit(message: str) -> bool:
    rc, _, _ = run(["git", "diff", "--cached", "--quiet"], check=False)
    if rc == 0:
        return False
    run(["git", "commit", "-m", message])
    return True

def git_tag(tag: str):
    run(["git", "tag", tag])

# ---------- AI summary (OpenAI-compatible) ----------
def resolve_ai_defaults(args) -> Tuple[str, str, str]:
    model = args.summary_model or os.environ.get("OPENAI_SUMMARY_MODEL", "gpt-5")
    base = args.summary_base_url or os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1")
    key = args.summary_api_key or os.environ.get("OPENAI_API_KEY") or ""
    if not key:
        key = os.environ.get("OPENROUTER_API_KEY", "")
        if key and not args.summary_base_url:
            base = "https://openrouter.ai/api/v1"
    if not key:
        key = os.environ.get("GROQ_API_KEY", "")
        if key and not args.summary_base_url:
            base = "https://api.groq.com/openai/v1"
    if not key:
        key = os.environ.get("AZURE_OPENAI_API_KEY", "")
    if not key:
        key = os.environ.get("OLLAMA_API_KEY", "ollama")
        if not args.summary_base_url:
            base = "http://localhost:11434/v1"
    return model, base, key

def ai_chat_completion(model: str, base_url: str, api_key: str, system_msg: str, user_msg: str, max_tokens: int = 400) -> str:
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_msg},
            {"role": "user", "content": user_msg}
        ],
        "temperature": 0.3,
        "max_tokens": max_tokens,
        "stream": False
    }
    data = json.dumps(payload).encode("utf-8")
    req = request.Request(
        url=base_url.rstrip("/") + "/chat/completions",
        data=data, method="POST",
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}" if api_key else ""}
    )
    with request.urlopen(req, timeout=60) as resp:
        body = resp.read().decode("utf-8")
        obj = json.loads(body)
        return obj["choices"][0]["message"]["content"].strip()

def build_summary_prompt(repo_name: str, branch: str, since_ref: Optional[str],
                         commits: List[Tuple[str, str, str, str]], files: List[str],
                         shortstat: str) -> Tuple[str, str]:
    sys_msg = (
        "You are a precise release-notes writer. Produce a terse, executive summary for developers and PMs. "
        "Focus on capabilities, fixes, and potential user-visible changes. Avoid marketing fluff."
    )
    commit_lines = "\n".join(f"- {s} ({a}, {h})" for h, s, a, _ in commits[:100])
    files_lines = "\n".join(f"- {f}" for f in files[:30])
    user_msg = (
        f"Repository: {repo_name}\n"
        f"Branch: {branch}\n"
        f"Range start: {since_ref or 'N/A (initial)'}\n"
        f"Changes shortstat: {shortstat or 'n/a'}\n\n"
        f"Top changed files:\n{files_lines or '- n/a'}\n\n"
        f"Commit subjects:\n{commit_lines or '- Initial release'}\n\n"
        "Write 3–6 bullet points. Each bullet should be one sentence and start with an action verb. "
        "If there are breaking changes, include a final bullet starting with 'BREAKING:'. Do not invent details."
    )
    return sys_msg, user_msg

# ---------- Args ----------
def parse_args():
    ap = argparse.ArgumentParser(description="Update CHANGELOG.md & README.md; optional AI summary, version bump, tag, and push.")
    ap.add_argument("--bump", choices=["major", "minor", "patch", "none"], default="none", help="Semver bump in package.json")
    ap.add_argument("--tag", action="store_true", help="Create a git tag after bump (vX.Y.Z)")
    ap.add_argument("--since", help="Start ref (tag/hash). Default: last tag or root")
    ap.add_argument("--allow-dirty", action="store_true", help="Skip clean worktree check")
    ap.add_argument("--section-title", help="Changelog section title (default: YYYY-MM-DD)")

    # AI summary
    ap.add_argument("--summarize", action="store_true", help="Generate an AI-written summary section")
    ap.add_argument("--summary-model", help="OpenAI-compatible model name (default: env or 'gpt-5')")
    ap.add_argument("--summary-base-url", help="Base URL for OpenAI-compatible API")
    ap.add_argument("--summary-api-key", help="API key (OPENAI_API_KEY/OPENROUTER_API_KEY/etc.)")
    ap.add_argument("--summary-max-tokens", type=int, default=400, help="Max tokens for summary")

    # Push options (uses sync_repos.py v4)
    ap.add_argument("--push-private", action="store_true", help="After commit, push to private using sync_repos.py")
    ap.add_argument("--push-public", action="store_true", help="After commit, push to public using sync_repos.py")
    ap.add_argument("--push", action="store_true", help="After commit, push to private and public (shortcut)")

    ap.add_argument("--private-remote", default="private", help="Private remote name for sync_repos.py")
    ap.add_argument("--public-remote",  default="public",  help="Public remote name for sync_repos.py")
    ap.add_argument("--public-branch",  default="main",    help="Public branch name for sync_repos.py")
    ap.add_argument("--public-mode",    choices=["cherry-pick", "snapshot"], default="cherry-pick",
                    help="Public push mode (sync_repos.py)")

    ap.add_argument("--sync-script", default=str(REPO / "tools" / "sync_repos.py"),
                    help="Path to sync_repos.py (default: tools/sync_repos.py)")
    ap.add_argument("--sync-verbose", action="store_true", help="Pass --verbose to sync_repos.py")
    return ap.parse_args()

# ---------- Main ----------
def main():
    ensure_git_repo()
    args = parse_args()
    ensure_clean_worktree(args.allow_dirty)

    unborn = is_unborn_head()
    branch = current_branch_guess()
    repo_name = REPO.name

    since = args.since if args.since else (None if unborn else last_tag_or_root())
    today = dt.date.today().isoformat()
    section_title = args.section_title or today

    if unborn:
        commits, notes, files, stat = [], ["Initial release."], [], ""
    else:
        commits = get_commits_since(since)
        notes   = build_notes(since)
        files   = top_changed_files_since(since)
        stat    = shortstat_since(since)

    # Optional AI summary (soft-fail)
    summary_lines: Optional[List[str]] = None
    if args.summarize:
        model, base, key = resolve_ai_defaults(args)
        try:
            if not key and not (args.summary_base_url or "").startswith("http://localhost"):
                raise RuntimeError("No API key found for remote provider.")
            sys_msg, user_msg = build_summary_prompt(repo_name, branch, since, commits, files, stat)
            summary = ai_chat_completion(model=model, base_url=base, api_key=key,
                                         system_msg=sys_msg, user_msg=user_msg,
                                         max_tokens=args.summary_max_tokens)
            bullets = [ln.strip(" •-") for ln in summary.splitlines() if ln.strip()]
            summary_lines = [f"- {b}" for b in bullets[:8]] if bullets else [summary]
        except Exception as e:
            print(f"⚠️  Summary generation skipped: {e}")

    # Resolve doc paths & write
    changelog_path, readme_path = paths_for_docs()
    prepend_changelog(changelog_path, section_title, notes, summary_block=summary_lines)
    update_readme_latest(readme_path, notes, summary_block=summary_lines)

    # Optional version bump
    bumped = None
    if args.bump != "none" and PKG_JSON.exists():
        current = read_package_version()
        if not current:
            print("⚠️  package.json exists but has no 'version'; skipping bump.")
        else:
            bumped = bump_semver(current, args.bump)
            if bumped != current:
                write_package_version(bumped)
                print(f"Version: {current} → {bumped}")

    # Stage & commit (only if something changed)
    commit_msg = f"chore(release): {today}"
    if bumped:
        commit_msg += f", bump version to {bumped}"
    if summary_lines:
        commit_msg += " [summary]"

    to_stage = [changelog_path, readme_path] + ([PKG_JSON] if bumped else [])
    # Stage updated docs and package.json, then ensure index reflects all generated changes
    git_add(to_stage)
    # On some platforms/casing/line-ending setups, be conservative and stage all
    try:
        run(["git", "add", "-A"], check=False)
    except Exception:
        pass
    committed = git_commit(commit_msg)

    # Tag (only if we actually committed and bumped)
    if committed and args.tag and bumped:
        tag_name = f"v{bumped}"
        git_tag(tag_name)
        print(f"Tagged {tag_name}")

    # ------- Optional push via sync_repos.py --------
    wants_private = args.push or args.push_private
    wants_public  = args.push or args.push_public

    def call_sync(push_private: bool, push_public: bool):
        sync = Path(args.sync_script)
        if not sync.exists():
            print(f"⚠️  Skipping push: sync script not found at {sync}")
            return
        cmd = [
            sys.executable, str(sync),
            "--private-remote", args.private-remote if False else args.private_remote,  # keep mypy quiet
            "--public-remote",  args.public_remote,
            "--public-branch",  args.public_branch,
            "--public-mode",    args.public_mode,
        ]
        if args.sync_verbose:
            cmd.append("--verbose")
        # We *always* want to push private full history after a release commit;
        # push_public is controlled by flags, but sync_repos handles both as one run.
        # If you only want one or the other, we still call sync once and let modes decide:
        # - private push always occurs (full history)
        # - public update obeys chosen mode
        # To support "only private" or "only public", we can add flags to sync_repos later.
        # For now, we run it once either way; if you truly want only one, use sync_repos directly.
        try:
            print("→ Running sync_repos.py …")
            res = subprocess.run(cmd, text=True)
            if res.returncode != 0:
                print("⚠️  sync_repos.py returned a non-zero exit code.")
        except Exception as e:
            print(f"⚠️  Failed to run sync_repos.py: {e}")

    if wants_private or wants_public:
        call_sync(wants_private, wants_public)

    # ------------------------------------------------

    print("✅ Done.")
    if unborn:
        print("   • Repo had no commits; wrote initial entries.")
    else:
        print("   • Changelog/README updated from recent commits.")
    if summary_lines:
        print("   • AI summary added.")
    if bumped:
        print(f"   • package.json bumped to {bumped}{' and tagged' if args.tag and committed else ''}.")
    if not committed:
        print("   • No changes detected after generation; nothing committed.")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        sys.exit(f"\n❌ Error: {e}\n")
