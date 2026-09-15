import itertools
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'site'))
from walks import vertices, letters, check, anchor_check


class WalkTests(unittest.TestCase):
    def test_published_prefixes(self):
        for d, prefix in [(4, '0100200101033010100200100200100223'),
                          (3, '010020001010212101010020001002000100202021021202')]:
            self.assertEqual(''.join(map(str, letters(d, len(prefix)))), prefix)

    def test_basis_invariant(self):
        for d in (3, 4, 5, 6):
            points = vertices(d, 256)
            for j, p in enumerate(points):
                self.assertEqual(sum(p), j)
                if j:
                    delta = [x-y for x, y in zip(p, points[j-1])]
                    self.assertEqual(sorted(delta), [0]*(d-1)+[1])
            self.assertEqual(check(d, 128)['status'], 'finite-prefix-pass')
        self.assertEqual(vertices(5, 256), [p+[0] for p in vertices(4, 256)])

    def test_independent_javascript_generator(self):
        code = "import {letters} from './site/walks.js'; console.log(JSON.stringify([3,4,5,6].map(d=>letters(d,4096))));"
        result = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', code], cwd=ROOT))
        self.assertEqual(result, [letters(d, 4096) for d in (3, 4, 5, 6)])

    def test_checker_unequal_spacing_and_bruteforce(self):
        self.assertEqual(anchor_check([[0,0],[1,1],[3,3]], 0, 3), [0,1,2])
        # Exhaust every binary walk of six steps against direct triple determinants.
        for word in itertools.product(range(2), repeat=6):
            points = [[0,0]]
            for a in word:
                p = points[-1].copy(); p[a] += 1; points.append(p)
            for anchor in range(len(points)):
                expected = any((points[b][0]-points[anchor][0])*(points[c][1]-points[anchor][1]) ==
                               (points[c][0]-points[anchor][0])*(points[b][1]-points[anchor][1])
                               for b, c in itertools.combinations(range(anchor+1, len(points)), 2))
                self.assertEqual(anchor_check(points, anchor, 3) is not None, expected)
        self.assertEqual(anchor_check([[j, 0] for j in range(7)], 0, 7), list(range(7)))

    def test_resume_and_corruption(self):
        with tempfile.TemporaryDirectory() as folder:
            folder = Path(folder)
            cmd = [sys.executable, str(ROOT/'verify.py'), '--dimension', '6', '--steps', '64',
                   '--checkpoint', str(folder/'state.json'), '--log', str(folder/'log.jsonl'),
                   '--output', str(folder/'result.json')]
            subprocess.run(cmd+['--max-anchors', '4'], check=True, capture_output=True)
            self.assertFalse((folder/'result.json').exists())
            subprocess.run(cmd, check=True, capture_output=True)
            result = json.loads((folder/'result.json').read_text())
            self.assertEqual(result['pairs'], 64*65//2)
            before = (folder/'result.json').read_bytes()
            subprocess.run(cmd, check=True, capture_output=True)
            self.assertEqual(before, (folder/'result.json').read_bytes())
            envelope = json.loads((folder/'state.json').read_text())
            envelope['state']['next_anchor'] = 0
            (folder/'state.json').write_text(json.dumps(envelope))
            self.assertNotEqual(subprocess.run(cmd, capture_output=True).returncode, 0)

    def test_invalid(self):
        for d, n in [(2, 10), (6, -1), (3, 1.5)]:
            with self.assertRaises(ValueError): letters(d, n)
        with self.assertRaises(ValueError): check(6, 513)


if __name__ == '__main__':
    unittest.main()
