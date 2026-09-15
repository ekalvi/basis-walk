"""Exact finite-prefix tools for Basis Walks. Python standard library only.

Constructions: Cambie, Kalviainen and Shallit, Brown-Gerver-Ramsey
Theorems in Small Dimensions, supplied Overleaf snapshot (September 2026).
Finite checks do not prove infinite avoidance. See docs/PROVENANCE.md.
"""
from math import gcd
from functools import reduce

BOUNDS = {3: 7, 4: 4, 5: 4, 6: 3}


def letters(dimension, steps):
    """Generate exactly steps output letters, indexed from zero."""
    if dimension not in BOUNDS or not isinstance(steps, int) or steps < 0:
        raise ValueError("dimension must be 3, 4, 5 or 6; steps a nonnegative integer")
    if dimension == 6:
        # sigma(2n)=-sigma(n), sigma(2n+1)=1-sigma(n), modulo 4.
        states = [0] * (steps + 1)
        for n in range(1, steps + 1):
            states[n] = ((n % 2) - states[n // 2]) % 4
        coding = {(0, 1): 0, (1, 2): 1, (2, 3): 2, (3, 0): 3,
                  (0, 2): 4, (1, 3): 4, (2, 0): 5, (3, 1): 5}
        return [coding[states[n], states[n + 1]] for n in range(steps)]
    # Return-word construction, expanded directly from the five-letter morphism.
    tau = dict(zip("ABCDE", ("AB", "AACA", "ADE", "AACCE", "ADCCA")))
    code = dict(zip("ABCDE", ("0", "1", "20", "21", "21") if dimension == 3
                    else ("0", "1", "2", "3", "3")))
    word = "A"
    while len(word) < steps:
        word = "".join(tau[a] for a in word)
    return [int(a) for a in "".join(code[a] for a in word)[:steps]]


def vertices(dimension, steps):
    points = [[0] * dimension]
    for a in letters(dimension, steps):
        point = points[-1].copy()
        point[a] += 1
        points.append(point)
    return points


def anchor_check(points, anchor, forbidden):
    """All lines from one anchor to later points, exact primitive directions.

    A forbidden collinear set has an earliest vertex, so scanning every anchor
    covers unequal spacings too. Returns indices of one witness, or None.
    """
    directions = {}
    for j in range(anchor + 1, len(points)):
        delta = [b - a for a, b in zip(points[anchor], points[j])]
        divisor = reduce(gcd, delta)
        if not divisor:
            raise ValueError("duplicate vertices are not supported")
        key = tuple(x // divisor for x in delta)
        group = directions.setdefault(key, [])
        group.append(j)
        if len(group) >= forbidden - 1:
            return [anchor] + group[:forbidden - 1]
    return None


def check(dimension=6, steps=128):
    """Small bounded browser/example check; use verify.py for resumable runs."""
    if not 0 <= steps <= 512:
        raise ValueError("Interactive check limited to 512 steps; use verify.py for larger runs")
    points = vertices(dimension, steps)
    for anchor in range(len(points)):
        witness = anchor_check(points, anchor, BOUNDS[dimension])
        if witness:
            return {"dimension": dimension, "steps": steps, "forbidden": BOUNDS[dimension],
                    "status": "counterexample", "witness": witness}
    return {"dimension": dimension, "steps": steps, "vertices": len(points),
            "forbidden": BOUNDS[dimension], "status": "finite-prefix-pass",
            "note": "Not an infinite proof"}
