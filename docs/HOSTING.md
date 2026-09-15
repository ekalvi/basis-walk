# Hosting preparation

Requested canonical URL: https://basis-walk.q5m.ai on q5m-n01, following
Erdős 193's static-container / dedicated Cloudflare Tunnel model.

`q5m.yaml` declares the intended target and local development command. The pinned
Nginx image copies only an explicit browser-asset allowlist from `site/`;
`.dockerignore` excludes manuscript sources, Python bytecode, Git metadata,
tests and private files even from the build context. `walks.py`
is served as plain text, not executed. The image records its exact Git revision
at `/.q5m-release`, uses an unprivileged user and a read-only filesystem.

## Blocked: new production origin and route

This is preparation, **not a deployable canonical production contract yet**.
The installed canonical Compose adapter adopts existing routes; it cannot
provision a new origin port, DNS record or Cloudflare Tunnel. No route or port
has been assigned for this project. `auto/tcp` in `q5m/app.env` explicitly leaves
allocation pending; Compose exposes only container port 8080, with no host
binding. Do not borrow Erdős 193's port or use `--adopt-existing` to invent an
existing service. This is not a supported staging deployment either until its
platform placement contract is completed.

Required next steps:

1. Obtain supported platform onboarding for the new canonical route and origin.
2. Record the assigned fixed origin port in `q5m/app.env` and the matching
   platform-approved Compose binding; retain tunnel-only ingress.
3. Resolve the publication gates in README.md and docs/PROVENANCE.md. The hosting
   request authorizes the requested URL, not invented collaborator or license approval.
4. Validate the complete contract, build and test the container, and commit.
5. Run the supported production plan/deploy from the clean exact revision on
   the declared node, retaining operation and rollback receipts.
6. Check public HTTPS, exact `/.q5m-release`, static assets and `walks.py`, and
   confirm manuscript, private and Git paths return 403/404.

`python3 tools/test_container.py` builds a disposable image and tests it with no
network or published host ports. It checks the exact asset inventory and bytes,
release marker, plain-text Python MIME type and private-path rejection, then
removes only its own container and image tag. CI runs this alongside `npm test`.

No production Actions writer is installed before onboarding. No public route,
provider resources or existing services were modified during preparation.
