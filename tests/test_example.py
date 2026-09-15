"""The compact visible constructors and optional checker match the CLI library."""
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
        default = html.unescape(re.search(
            r'<textarea id="python-code"[^>]*>(.*?)</textarea>', page, re.S
        ).group(1))
        def template(name):
            return html.unescape(re.search(
                rf'<template id="{name}">(.*?)</template>', page, re.S
            ).group(1)).strip()
        six = template("six-example")
        cls.sources = {"six": six, "return": default,
                       "check": six.split("\nfor point")[0] + "\n\n" + template("check-example")}
        cls.namespaces, cls.outputs = {}, {}
        for name, source in cls.sources.items():
            namespace, output = {}, io.StringIO()
            with contextlib.redirect_stdout(output):
                exec(compile(source, name + "-example.py", "exec"), namespace)
            cls.namespaces[name], cls.outputs[name] = namespace, output.getvalue()

    def test_short_and_import_free(self):
        self.assertLessEqual(len(self.sources["six"].splitlines()), 16)
        self.assertLessEqual(len(self.sources["return"].splitlines()), 16)
        for source in self.sources.values():
            tree = ast.parse(source)
            self.assertFalse(any(isinstance(node, (ast.Import, ast.ImportFrom))
                                 for node in ast.walk(tree)))
            self.assertNotIn("__import__", source)
        self.assertIn("finite-prefix-pass", self.outputs["check"])

    def test_constructors_agree_with_library(self):
        for steps in (0, 1, 16, 128, 2048):
            self.assertEqual(self.namespaces["six"]["basis_walk"](steps), walks.vertices(6, steps))
            for dimension in (3, 4, 5):
                self.assertEqual(self.namespaces["return"]["basis_walk"](steps, dimension),
                                 walks.vertices(dimension, steps))

    def test_optional_checker(self):
        namespace = self.namespaces["check"]
        for steps in (0, 1, 16, 128):
            result = namespace["check"](steps)
            reference = walks.check(6, steps)
            self.assertEqual(result["status"], reference["status"])
            self.assertEqual(result["vertices"], reference["vertices"])
        for steps in (-1, 513, 1.5):
            with self.assertRaises(ValueError):
                namespace["check"](steps)
        # Earliest-anchor checking includes triples with unequal spacings.
        original = namespace["basis_walk"]
        try:
            namespace["basis_walk"] = lambda n: [[0, 0], [1, 1], [3, 3]]
            self.assertEqual(namespace["check"](2),
                             {"status": "counterexample", "witness": [0, 1, 2]})
            namespace["basis_walk"] = lambda n: [[0, 0], [0, 0]]
            with self.assertRaises(ValueError):
                namespace["check"](1)
        finally:
            namespace["basis_walk"] = original


if __name__ == "__main__":
    unittest.main()
