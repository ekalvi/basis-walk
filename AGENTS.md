# Basis Walks

Read README.md and docs/PROVENANCE.md first.

- Companion to Cambie, Kalviainen and Shallit's joint manuscript, not the original Erdős 193 paper.
- Preserve full author credit. Software assistance/maintenance is separate from paper authorship.
- Claims: manuscript infinite constructions (3D, no 7), (4D, no 4), (6D, no 3). 5D is the 4D embedding with one unused direction. Do not imply optimality or all five directions used.
- Finite exact scans are not infinite proofs. Do not claim independent human review, peer review or formal verification.
- Validate collinearity in original integer coordinates, not projections. Label illustrative projections.
- Keep .local/ private and ignored. Do not publish manuscript sources or private email without permission. Do not invent a joint-paper arXiv URL.
- Lean static site, no framework/build dependency needed. Keep Python lazy and worker-isolated; no backend code execution.
- Use at most four aggregate CPU cores; scans default to one. Substantive Python scans need durable atomic checkpoints, code/config identity, resume, signal handling and timestamped progress logs. Use verify.py rather than ad-hoc long scripts.
- npm test before commits. Commit focused logical units. Do not deploy publicly or change DNS without authorization.
- Serve only site/, never the repository root. Follow the hosting environment's security policies.
