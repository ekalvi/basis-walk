# Sources and claim ledger

## Primary source

**Stijn Cambie, Erik Kalviainen, Jeffrey Shallit.**
*Brown-Gerver-Ramsey Theorems in Small Dimensions.*
Unpublished manuscript, September 2026. Manuscript sources are not distributed
with this repository. A public link will be added when available and approved.

This is a manuscript snapshot, not proof of publication or collaborator approval
of this software. Do not assign the original paper's arXiv ID to this joint paper.

## Results used

| Dimension | Directions used | Infinite manuscript theorem | Implementation |
|---|---:|---|---|
| 3 | 3 | No 7 collinear vertices | Five-letter return substitution, coding A→0, B→1, C→20, D/E→21 |
| 4 | 4 | No 4 collinear vertices | Same substitution, coding A→0, B→1, C→2, D/E→3 |
| 5 | 4 | No 4, by embedding the 4D theorem | Append one zero coordinate; not a separate five-direction theorem |
| 6 | 6 | No 3 collinear vertices | Signed binary digit state; eight transitions collapse to six labels |

The Python return-word substitution is A→AB, B→AACA, C→ADE, D→AACCE,
E→ADCCA, fixed point starting at A, as given in the manuscript.
JavaScript independently enumerates ternary digit-parity returns and uses their
half-gaps 1,2,3,4. Tests compare 4,096 output letters in every dimension.
Python's 6D state uses the recursive formula; JavaScript uses alternating binary
digit sums. Label order is 01,12,23,30,(02 or 13),(20 or 31).

The manuscript's 6D auxiliary space is C² × R (five real coordinates),
not literally R³. Our rendered 6D→3D map is only illustrative. It must not inherit
the theorem for the separately constructed finite-step 3D walk.

## Proof status and checks

- The snapshot includes written infinite proofs for 3D, 4D, 6D; this repo does not
  supply independent human certification or a formal proof.
- Exact checker: at each anchor, reduce every later displacement by its coordinate
  gcd. A bucket with k−1 later vertices witnesses k collinear vertices. Every
  forbidden set has an earliest anchor. Positive-basis walks have strictly
  increasing coordinate sums, hence distinct vertices and positive orientation.
  Unequal block lengths are fully included.
- Passing a prefix is finite evidence only. Reports bind exact source hashes,
  parameters, checked pair counts and witness/status. Logs/checkpoints are separate.
- Open here: no-three in 4D/5D; no-four in 3D. No optimality asserted.
- 5D testing is an embedding sanity check, not a new result.

## Attribution

Original related paper: **Stijn Cambie and Erik Kalviainen**, *An infinite
small-step Z³-walk with no collinear triple*, arXiv:2609.01766. Historical
background includes Brown, Montgomery, Gerver, Ramsey and Lidbetter.
Follow the joint manuscript's byline for these constructions. Do not silently
reattribute all stages to the companion maintainer.

The site/code are maintained by Erik Kalviainen with AI coding assistance.
The manuscript's own AI declaration is separate; this repo does not audit it.

Code consistently uses zero-based direction labels. The saved finite reports
cover only the prefixes identified in those reports, not all manuscript examples.

## Publication gates

Author review of wording/credit; joint-paper public link; licensing agreement;
independent mathematical review; explicit public repo and hosting authorization.
This repository does not grant a license to the manuscript content.
