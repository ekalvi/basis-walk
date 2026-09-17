# Sources and claim ledger

## Primary source

**Stijn Cambie, Erik Kalviainen, Jeffrey Shallit.**
*Brown-Gerver-Ramsey Theorems in Small Dimensions.*
Submitted to arXiv on September 17, 2026, under the Creative Commons
Attribution 4.0 license. A permanent public arXiv identifier has not yet been
assigned. A PDF rendered from the submitted primary TeX source is hosted at
[`site/brown-gerver-ramsey-theorems.pdf`](../site/brown-gerver-ramsey-theorems.pdf),
and the supplied TeX snapshot is tracked in
[`paper/reference/`](../paper/reference/README.md) with file hashes. The hosted
PDF was built from `shortversion.tex` with Tectonic 0.17.0; the obsolete
`breakurl` package was omitted for XeTeX compatibility without changing the
manuscript text.

Submission is not an announcement or proof of publication, and manuscript
coauthorship does not imply review of this software. Do not assign the related
paper's arXiv ID to this joint paper.

## Results used

| Dimension | Directions used | Infinite manuscript theorem | Implementation |
|---|---:|---|---|
| 3 | 3 | No 7 collinear vertices | Five-letter return substitution, coding A→0, B→1, C→20, D/E→21 |
| 4 | 4 | No 4 collinear vertices | Same substitution, coding A→0, B→1, C→2, D/E→3 |
| 5 | 4 | No 4, by embedding the 4D theorem | Append one zero coordinate; not a separate five-direction theorem |
| 6 | 6 | No 3 collinear vertices | Signed binary digit state; eight transitions collapse to six labels |

The site's table shows <7, <4, <4, <3 vertices per line in
3D, 4D, embedded 5D, 6D, matching the manuscript's “no k collinear” convention. Equivalently, these are upper bounds of 6, 3, 3, 2
vertices per line, not claims about the smallest attainable bounds. The updated
manuscript exhibits six collinear vertices in its particular 3D construction
and three collinear vertices in its 4D construction, so both constructions attain
their stated bounds. These are not optimality results across all possible walks.

The Python return-word substitution is A→AB, B→AACA, C→ADE, D→AACCE,
E→ADCCA, fixed point starting at A, as given in the manuscript.
JavaScript independently enumerates ternary digit-parity returns and uses their
half-gaps 1,2,3,4. Tests compare 4,096 output letters in every dimension.
Python's 6D state uses the recursive formula; JavaScript uses alternating binary
digit sums. Label order is 01,12,23,30,(02 or 13),(20 or 31).

The manuscript's 6D auxiliary space is C² × R (five real coordinates),
not literally R³. Our rendered 6D→3D map is only illustrative. It must not inherit
the theorem for the separately constructed finite-step 3D walk.

The explorer lists the exact columns used by its linear display map, sourced
from the same JavaScript function as the renderer. In 6D, the six basis vectors
map to the vertices of a regular hexagon in the display XY-plane, each with
Z-component 1. Thus Z = Σxⱼ is the step index, while all six directions have
distinct, evenly spaced display vectors. This balanced map replaces a thin
contrast projection that made the rendered walk appear nearly planar. It is for
visualization, not a new theorem.
An optional longitudinal
compression shortens only the component parallel to the projected prefix's
endpoint displacement; it does not subtract the walk's trend vertex by vertex.
The factor stays positive (1–512), so this extra 3D transformation is invertible,
but changes lengths and angles. It is fixed for the whole selected prefix,
independent of reveal position. Original integer vertices and checking routines
are unchanged. A fixed center and bounding sphere of that displayed 3D prefix
set the camera pivot and scale. Rotation is rigid: it does not re-fit screen
bounds or re-center at each angle. Resizing the viewport and explicit zoom may
change screen scale; ordinary 2D foreshortening remains. The subsequent
rotation, screen zoom and 2D projection are illustrative. The default 4,096-step view colors by vertex order; an optional
palette identifies step directions. Neither color nor depth shading is a test
of collinearity.

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
- The updated manuscript records a separate five-direction 5D candidate checked
  for 600,000 terms, but gives no infinite proof. This site does not implement or
  claim that candidate.
- 5D testing here is an embedding sanity check, not a new result.

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

## Publication status

The authors authorized making this repository public. The manuscript submission
selects CC BY 4.0; the repository does not apply that license to the software.
The permanent arXiv identifier remains pending, and neither independent
mathematical review nor formal verification is claimed.
