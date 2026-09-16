# Exact finite-prefix reports

Each report records the dimension, step count, forbidden collinearity bound,
checked pair count, status, and SHA-256 identities of the generator and verifier.
Collinearity is checked in the original integer coordinates, not a projection.

| Steps | Vertices | Pairs per dimension | Dimensions | Status |
|---:|---:|---:|---|---|
| 512 | 513 | 131,328 | 3, 4, 5, 6 | finite-prefix-pass |
| 16,384 | 16,385 | 134,225,920 | 3, 4, 5, 6 | finite-prefix-pass |
| 100,000 | 100,001 | 5,000,050,000 | 3, 4, 5, 6 | finite-prefix-pass |

These passes found no 7 collinear vertices in the checked 3D prefix, no 4 in
4D and its 5D embedding, and no 3 in 6D. The 5D example uses only four directions.
**Finite evidence is not an infinite proof, an optimality claim, or independent
human or formal verification.**

Reproduce with `verify.py` as described in the main README, selecting the
corresponding dimension and step count and separate checkpoint/log/output paths.
The 16,384-step reports were produced sequentially with one worker/core. The
100,000-step reports were produced with four concurrent single-core workers,
one per dimension; each individual scan remained single-threaded.
