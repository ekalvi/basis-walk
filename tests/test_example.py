"""Keep the import-free displayed example in agreement with the CLI library."""
import ast
import contextlib
import html
import io
from pathlib import Path
import re
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "site"))
import walks


class InlineExampleTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        page = (ROOT / "site/index.html").read_text()
        cls.source = html.unescape(re.search(
            r'<textarea id="python-code"[^>]*>(.*?)</textarea>', page, re.S
        ).group(1))
        cls.namespace = {}
        cls.output = io.StringIO()
        with contextlib.redirect_stdout(cls.output):
            exec(compile(cls.source, "displayed-example.py", "exec"), cls.namespace)

    def test_standalone_without_imports(self):
        tree = ast.parse(self.source)
        self.assertFalse(any(isinstance(node, (ast.Import, ast.ImportFrom))
                             for node in ast.walk(tree)))
        self.assertNotIn("__import__", self.source)
        self.assertIn("finite-prefix-pass", self.output.getvalue())

    def test_agrees_with_library(self):
        for dimension in (3, 4, 5, 6):
            for steps in (0, 1, 16, 128):
                with self.subTest(dimension=dimension, steps=steps):
                    self.assertEqual(self.namespace["vertices"](dimension, steps),
                                     walks.vertices(dimension, steps))
                    self.assertEqual(self.namespace["check"](dimension, steps),
                                     walks.check(dimension, steps))

    def test_checker_and_bounds(self):
        # Collinear vertices at unequal distances from the earliest anchor.
        points = [[0, 0, 0], [1, 1, 0], [3, 3, 0], [6, 6, 0]]
        self.assertEqual(self.namespace["anchor_check"](points, 0, 4), [0, 1, 2, 3])
        self.assertEqual(self.namespace["anchor_check"](points, 0, 4),
                         walks.anchor_check(points, 0, 4))
        for dimension, steps in ((2, 16), (6, -1), (6, 513), (6, 1.5)):
            with self.assertRaises(ValueError):
                self.namespace["check"](dimension, steps)


if __name__ == "__main__":
    unittest.main()
