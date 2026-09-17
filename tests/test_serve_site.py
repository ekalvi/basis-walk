import importlib.util
import os
from pathlib import Path
import tempfile
import threading
import unittest
from http.client import HTTPConnection
from http.server import ThreadingHTTPServer

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("serve_site", ROOT / "tools/serve_site.py")
serve = importlib.util.module_from_spec(spec)
spec.loader.exec_module(serve)


class DevServerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for name in serve.ASSETS:
            (self.root / name).write_text("raise RuntimeError('never execute')\n")
        fd = os.open(self.root, os.O_RDONLY | os.O_DIRECTORY)
        self.addCleanup(os.close, fd)
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), serve.handler_for(fd))
        thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        thread.start()
        self.addCleanup(self.server.server_close)
        self.addCleanup(thread.join)
        self.addCleanup(self.server.shutdown)

    def request(self, path, method="GET"):
        connection = HTTPConnection(*self.server.server_address, timeout=3)
        try:
            connection.request(method, path)
            response = connection.getresponse()
            return response.status, dict(response.getheaders()), response.read()
        finally:
            connection.close()

    def test_assets_and_head(self):
        for path in ["/", *["/" + name for name in serve.ASSETS]]:
            status, headers, body = self.request(path)
            self.assertEqual(status, 200, path)
            self.assertEqual(headers["X-Content-Type-Options"], "nosniff")
            self.assertIn(b"never execute", body)
        status, headers, body = self.request("/walks.py", "HEAD")
        self.assertEqual(status, 200)
        self.assertEqual(headers["Content-Type"], "text/plain; charset=utf-8")
        self.assertEqual(body, b"")
        self.assertEqual(self.request("/walks.py?download=1")[0], 200)
        status, headers, _ = self.request("/brown-gerver-ramsey-theorems.pdf", "HEAD")
        self.assertEqual(status, 200)
        self.assertEqual(headers["Content-Type"], "application/pdf")

    def test_unknown_and_traversal_paths(self):
        for path in ["/README.md", "/paper/reference/main.tex", "/.git/config",
                     "/.env", "/../README.md", "/%2e%2e/README.md", "/site/",
                     "/%77alks.py", "/other.py", "/walks.py/", "/x/../walks.py"]:
            self.assertEqual(self.request(path)[0], 404, path)
        self.assertEqual(self.request("/walks.py", "POST")[0], 501)

    def test_symlink_and_nonregular_rejected(self):
        source = self.root / "walks.py"
        source.unlink()
        source.symlink_to(ROOT / "verify.py")
        self.assertEqual(self.request("/walks.py")[0], 404)
        source.unlink()
        source.mkdir()
        self.assertEqual(self.request("/walks.py")[0], 404)
        source.rmdir()
        os.mkfifo(source)
        self.assertEqual(self.request("/walks.py")[0], 404)


if __name__ == "__main__":
    unittest.main()
