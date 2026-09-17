# Manuscript reference snapshot

Reference sources for *Brown-Gerver-Ramsey Theorems in Small Dimensions*, by
**Stijn Cambie, Erik Kalviainen, and Jeffrey Shallit** (arXiv submission snapshot,
September 17, 2026). These files are preserved unchanged from the supplied source
archive:

- `shortversion.tex`: current primary manuscript and implementation reference.
- `main.tex`: older/longer exposition, including the return-word substitution.
- `dimensions3_4_compact.tex` and `dimensions_3_4_extended.tex`: supporting expositions.
- `unit_step_walk_N6.tex`: supporting 6D exposition.
- `Bin/dimension4_digit_parity_short.tex` and `Bin/dimension4_short_from_zero.tex`: supplementary short proofs for the 4D construction.

`SHA256SUMS` records the exact file identities. Verify from this directory with
`sha256sum -c SHA256SUMS`. This is a reference snapshot, not a claim that all
files form a complete, tested LaTeX build.

## Publication boundary

The authors authorized public release of the repository, and the September 17
arXiv submission metadata selects the
[Creative Commons Attribution 4.0 license](https://creativecommons.org/licenses/by/4.0/)
for the manuscript. That license does not automatically apply to this repository's
software. Keep this source directory outside the served static site; the reviewed
submitted PDF is the only manuscript artifact copied into `site/`.
Software maintenance and AI coding assistance are separate from paper authorship.
