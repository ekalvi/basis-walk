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
        cls.page = page
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
        self.assertLessEqual(len(self.sources["six"].splitlines()), 18)
        self.assertLessEqual(len(self.sources["return"].splitlines()), 18)
        for name in ("six", "return"):
            self.assertIn("eⱼ =", self.sources[name])
            self.assertIn("Pₙ₊₁ = Pₙ + eⱼ", self.sources[name])
        for source in self.sources.values():
            tree = ast.parse(source)
            self.assertFalse(any(isinstance(node, (ast.Import, ast.ImportFrom))
                                 for node in ast.walk(tree)))
            self.assertNotIn("__import__", source)
        self.assertIn("finite-prefix-pass", self.outputs["check"])

    def test_visible_step_words_match_constructors(self):
        def code_text(element_id):
            return re.search(rf'<code id="{element_id}">([^<]+)</code>', self.page).group(1)

        source = code_text("source-word")
        substitution = dict(zip("ABCDE", ("AB", "AACA", "ADE", "AACCE", "ADCCA")))
        fixed_point = "A"
        while len(fixed_point) < len(source):
            fixed_point = "".join(substitution[a] for a in fixed_point)
        self.assertEqual(source, fixed_point[:len(source)])

        for element_id, dimension in (("step-word-3", 3), ("step-word-4", 4),
                                      ("step-word-6", 6)):
            prefix = code_text(element_id)
            self.assertEqual(prefix, "".join(map(str, walks.letters(dimension, len(prefix)))))
        self.assertEqual(walks.letters(4, 32), walks.letters(5, 32))

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
