**Purpose**
- Save the built output from CI as downloadable files so reviewers or later jobs can fetch and run the exact build produced by your workflow.

**When Useful**
- PR review: share a ready-to-run build without committing `dist/`.
- Multi-job pipelines: a later job (e.g., deploy) downloads the same build.
- Reproducibility: “what CI built” is preserved for the run.

**What Gets Uploaded**
- Web build: contents of `dist/` from `npm run build`.
- Optional desktop build: Electron packages in `release/` from `npm run dist` (Windows/macOS/Linux runners).

**How To Add (Web `dist/`)**
- Add an upload step after the build in `.github/workflows/node-ci.yml`:
```
- name: Upload web build artifact
  uses: actions/upload-artifact@v4
  with:
    name: web-dist-${{ github.run_number }}
    path: dist/**
    if-no-files-found: error
    retention-days: 7
```
- To consume in another job:
```
- name: Download web build
  uses: actions/download-artifact@v4
  with:
    name: web-dist-${{ github.run_number }}
```

**Optional: Electron Packages**
- Add a job on Windows that builds and uploads the installer:
```
package-electron:
  runs-on: windows-latest
  needs: build-and-test
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with: { node-version: 18, cache: npm }
    - run: npm ci
    - run: npm run dist
    - name: Upload electron release
      uses: actions/upload-artifact@v4
      with:
        name: electron-release-${{ github.run_number }}
        path: release/**
        if-no-files-found: error
        retention-days: 7
```

**Caveats**
- Keep artifacts small; don’t upload unnecessary files.
- Reduce retention if storage is a concern.
- Electron packaging can be slower; consider running only on tagged releases.

Should I add the `dist/` upload to your existing CI now, and optionally a Windows Electron packaging job?
