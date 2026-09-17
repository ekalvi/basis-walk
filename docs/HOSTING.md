# Canonical hosting

Canonical URL: https://basis-walk.q5m.ai. `q5m.yaml` owns the release target:
q5m-n01, a stateless Nginx container behind a dedicated Cloudflare Tunnel,
following the Erdős 193 hosting model. No per-project homelab registration is
needed. The origin port **20000** was assigned by the platform bootstrap plan;
Compose's internal Nginx port is 8080. Only tunnel ingress is permitted.

## Artifact boundary

The pinned Nginx image copies an explicit browser-asset allowlist from `site/`.
`.dockerignore` excludes manuscript sources, Python bytecode, Git metadata,
tests and private files even from the build context. The allowlist includes the
reviewed PDF rendering of the submitted paper, but not the TeX source directory. `walks.py` is
plain text, never executed by the server. The image records its exact Git revision at
`/.q5m-release`, runs unprivileged with a read-only filesystem, and has bounded
CPU, memory, PID and log resources. There is no backend or server-side editor.

`python3 tools/test_container.py` builds a disposable image and tests it with no
network or published host ports. It checks the exact asset inventory and bytes,
release marker, plain-text Python MIME type and private-path rejection, then
removes only its own container and image tag. CI runs this alongside `npm test`.

## Initial provisioning and release

The generic bootstrap is supplied by homelab PR #218 (integration
`0ec4029a0ea326b2c7ab178e19f0ca4843664c27`), separately installed on q5m-n01.
It validates exact clean committed project source, refuses existing ownership,
starts the guarded image with tunnel-only ingress, and provisions new DNS only
after local release and connector health. This is not preview hosting or a
legacy-writer fallback. Provider credentials never enter the project/container.

Initial operation, from the clean release checkout on q5m-n01:

```sh
q5m-production-bootstrap create --revision FULL_COMMIT --json
```

Retain its exact service/operation ID and status receipt. A timeout or lost
client is not cancellation: inspect the returned operation unit and retained
status before any explicit resume. Never blindly repeat provisioning.

Subsequent deployments use the normal project-owned lifecycle, not bootstrap:

```sh
q5m-lab project production plan --revision FULL_COMMIT --json
q5m-lab project production deploy --revision FULL_COMMIT --json
q5m-lab project production status --service basis-walks --json
q5m-lab project production rollback --service basis-walks --json
```

Rollback requires an actual prior release and preserves the hostname/tunnel.
A first deployment has no previous app release. Route retirement requires a
separately authorized exact-owner operation; there is no generic down/purge.
No production Actions runner is installed: releases are explicit operator
operations, while GitHub Actions runs non-deploying validation.

Verify HTTPS `/.q5m-release` equals the intended full integration SHA, asset
responses, PDF and Python MIME, and rejection of TeX/private/Git paths. Keep
live success receipts distinct from unit tests or manifest validation.

Public hosting serves the reviewed PDF rendering, not the manuscript source
archive. It does not assert collaborator review of the companion software.
Credit, submission status, licensing boundaries and mathematical qualifications
remain as documented in README.md and PROVENANCE.md.
