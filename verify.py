#!/usr/bin/env python3
"""Single-core exact scan with atomic, integrity-checked checkpoints and JSONL logs."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import signal
import sys
import time
from datetime import datetime, timezone

sys.path.insert(0, str(Path(__file__).parent / "site"))
from walks import BOUNDS, vertices, anchor_check

ROOT = Path(__file__).resolve().parent


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True).encode()).hexdigest()


def atomic(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".tmp")
    with temp.open("w") as stream:
        json.dump(value, stream, indent=2)
        stream.write("\n")
        stream.flush()
        os.fsync(stream.fileno())
    os.replace(temp, path)


def main():
    parser = argparse.ArgumentParser(description=__doc__, epilog=
        "Resume: repeat the identical command. Checkpoints bind parameters and code hashes; "
        "incompatible/corrupt progress is rejected. SIGINT/TERM stop after the current anchor. "
        "Use distinct checkpoint/log paths for concurrent runs. O(N² d) time, O(N d) memory.")
    parser.add_argument("--dimension", type=int, choices=BOUNDS, required=True)
    parser.add_argument("--steps", type=int, default=256)
    parser.add_argument("--checkpoint", type=Path, required=True)
    parser.add_argument("--log", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--max-anchors", type=int, help="Stop cleanly after this many anchors (resume test/budget)")
    args = parser.parse_args()
    if args.steps < 0 or (args.max_anchors is not None and args.max_anchors < 1):
        parser.error("steps must be nonnegative; max-anchors must be positive")
    if len({p.resolve() for p in (args.checkpoint, args.log, args.output)}) != 3:
        parser.error("checkpoint, log and output must be different files")
    identity = {"schema": 1, "dimension": args.dimension, "steps": args.steps,
                "forbidden": BOUNDS[args.dimension], "code": {
                    p: hashlib.sha256((ROOT / p).read_bytes()).hexdigest()
                    for p in ("site/walks.py", "verify.py")}}
    state = {"identity": identity, "next_anchor": 0, "pairs": 0, "witness": None}
    if args.checkpoint.exists():
        envelope = json.loads(args.checkpoint.read_text())
        state = envelope["state"]
        if envelope["sha256"] != digest(state) or state["identity"] != identity:
            raise ValueError("Corrupt or incompatible checkpoint; use a new path for a new run")
        if not 0 <= state["next_anchor"] <= args.steps + 1:
            raise ValueError("Invalid checkpoint progress")
    args.log.parent.mkdir(parents=True, exist_ok=True)
    started = time.monotonic()
    base_pairs = state["pairs"]
    stop = False
    def request_stop(*_):
        nonlocal stop
        stop = True
    for sig in (signal.SIGINT, signal.SIGTERM):
        signal.signal(sig, request_stop)
    total = args.steps * (args.steps + 1) // 2
    def log(event, **extra):
        elapsed = time.monotonic() - started
        rate = (state["pairs"] - base_pairs) / max(elapsed, 1e-9)
        record = {"time": datetime.now(timezone.utc).isoformat(), "event": event,
                  "identity": identity, "next_anchor": state["next_anchor"],
                  "pairs": state["pairs"], "total_pairs": total, "elapsed_seconds": elapsed,
                  "pairs_per_second": rate, "eta_seconds": (total-state["pairs"])/rate if rate else None,
                  "checkpoint": str(args.checkpoint), "threads": 1, **extra}
        with args.log.open("a") as stream:
            stream.write(json.dumps(record) + "\n")
            stream.flush()
        print(json.dumps(record), flush=True)
    def save():
        atomic(args.checkpoint, {"state": state, "sha256": digest(state)})
    log("resume" if args.checkpoint.exists() else "start")
    try:
        points = vertices(args.dimension, args.steps)
        done = 0
        last_save = time.monotonic()
        if not state["witness"]:
            for anchor in range(state["next_anchor"], len(points)):
                witness = anchor_check(points, anchor, BOUNDS[args.dimension])
                state["pairs"] += (witness[-1] - anchor) if witness else len(points) - anchor - 1
                state["next_anchor"] = anchor + 1
                state["witness"] = witness
                done += 1
                if time.monotonic() - last_save >= 2:
                    save()
                    log("progress")
                    last_save = time.monotonic()
                if witness or stop or (args.max_anchors and done >= args.max_anchors):
                    break
        save()
        complete = state["next_anchor"] == len(points) or state["witness"] is not None
        if complete:
            result = {**state, "status": "counterexample" if state["witness"] else "finite-prefix-pass",
                      "vertices": len(points), "note": "Finite evidence only, not an infinite proof"}
            atomic(args.output, result)
            log("complete", status=result["status"], output=str(args.output))
            return 1 if state["witness"] else 0
        log("paused")
        return 130 if stop else 0
    except Exception as error:
        save()
        log("error", error=str(error))
        raise


if __name__ == "__main__":
    sys.exit(main())
