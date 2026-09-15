# Basis Walks

A lean visual and computational companion to **Brown-Gerver-Ramsey Theorems in
Small Dimensions**, by **Stijn Cambie, Erik Kalviainen, and Jeffrey Shallit**.

Explore positive standard-basis walks, the proof mechanism, and exact finite
checks. The manuscript proves existence in **3D with no 7 collinear vertices**,
**4D with no 4**, and **6D with no 3**. The included 5D example embeds the 4D
walk using only four of five directions. No optimality or formal verification
is claimed. **Finite-prefix passes are not infinite proofs.**

## Start here

- [Sources, attribution, exact claim ledger](docs/PROVENANCE.md)
- `site/`: complete static site, no npm install or build required.
- `site/walks.py`: dependency-free Python generator and bounded checker.
- `site/walks.js`: independent JS generators and exact checker.
- `verify.py`: resumable single-core CLI checker.
- `results/`: reproducible, code-identified finite reports.

## Test

Requires Node.js 22+ and Python 3.10+. No Python packages required.

```sh
npm test
```

For browser tests only, install the pinned development dependency:

```sh
npm ci
npx playwright install chromium
npx playwright test
# Optional real CDN/Python integration:
TEST_PYODIDE=1 npx playwright test
```

Browser tests start and stop a temporary loopback-only fixture, not a hosted
preview.

Tests include published prefixes, basis invariants, 5D embedding, agreement of
independent Python/JavaScript generators, brute-force checker comparison,
unequal spacings, checkpoint resume/idempotence and corruption rejection.

## Preview

The site needs no build step. Configure a static web server with **`site/` as
its document root**, never the repository root. `site/walks.py` is an intentional
browser-consumed download, not server-side code; the host must support serving
it as a static file.

For local development on systems supporting POSIX file-descriptor operations:

```sh
python3 tools/serve_site.py
```

Open `http://127.0.0.1:8000`. The development server serves an exact allowlist of
browser assets, including `walks.py` as plain text. It rejects symlinks, unknown
paths and directory listings. Managed development runners can supply `HOST` and
`PORT`; no backend Python execution is enabled.

The site uses no analytics, external fonts or initial CDN requests.

The editor opens with a short, import-free 6D constructor. The example selector
also offers the 3D–5D constructor and a self-contained 6D exact checker. Every
selected example is fully visible and editable; tests compare it with
`site/walks.py`. The worker executes only the editor's code, without fetching or
injecting a helper module.
Python runs on explicit click using pinned Pyodide 0.27.7 from jsDelivr, in a
terminable worker. Its runtime needs internet. Code editing is not a security
sandbox. The optional exact checker is capped at 512 steps; stop or the 120-second timeout
terminates browser execution. The visualization displays up to 8,192 steps. Each browser run starts fresh; durable larger work uses the CLI.

## Reproduce finite reports

```sh
python3 verify.py --dimension 6 --steps 512 \
  --checkpoint .checkpoints/6d-512.json \
  --log .local/logs/6d-512.jsonl --output results/6d-512.json
```

Use dimensions 3,4,5,6 with separate paths. Repeat the identical command to
resume. SHA-256 checks bind checkpoints to parameters and code and detect
accidental corruption (not malicious tampering). Checkpoint replacement is
atomic. SIGINT/SIGTERM pause after the current anchor; progress persists every
two seconds between anchors. JSONL logs include identity, throughput, elapsed,
ETA, resource settings and completion/error. Output writes are idempotent.

Use `--max-anchors 4` to test a budgeted pause. Do not run two processes against
the same checkpoint/log/output paths. Complexity is O(N² d) time and O(N d)
memory; deliberately use bounded prefixes before scaling. Completed checkpoints
are rejected if either verifier or generator changes; use a fresh run path.

## Public release

This companion is based on an unpublished manuscript. A public link to the joint
paper is not yet available; the related Cambie–Kalviainen paper is linked
separately in [Sources and attribution](docs/PROVENANCE.md).

Author review of credit and mathematical wording, licensing decisions, and a
repository-wide privacy review remain prerequisites for public release. The
[reference TeX sources](paper/reference/README.md) are tracked for private use;
public release requires authors' permission or removal from Git history. No
software or manuscript license has been selected yet.
