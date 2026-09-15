#!/usr/bin/env python3
"""Serve only reviewed browser assets; never execute the downloadable Python."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os
import stat
from urllib.parse import urlsplit

SITE = Path(__file__).resolve().parents[1] / "site"
ASSETS = {
    "index.html": "text/html; charset=utf-8",
    "app.js": "text/javascript; charset=utf-8",
    "walks.js": "text/javascript; charset=utf-8",
    "python-worker.js": "text/javascript; charset=utf-8",
    "style.css": "text/css; charset=utf-8",
    "icon.svg": "image/svg+xml",
    "logo-kulak.svg": "image/svg+xml",
    "logo-waterloo.svg": "image/svg+xml",
    "walks.py": "text/plain; charset=utf-8",
}


def handler_for(site):
    """Pin the root descriptor and open only exact single-component filenames."""
    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            self.respond(send_body=True)

        def do_HEAD(self):
            self.respond(send_body=False)

        def respond(self, send_body):
            path = urlsplit(self.path).path
            name = "index.html" if path == "/" else path.removeprefix("/")
            if name not in ASSETS:
                self.send_error(404)
                return
            try:
                fd = os.open(name, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK,
                             dir_fd=site)
                with os.fdopen(fd, "rb") as stream:
                    if not stat.S_ISREG(os.fstat(stream.fileno()).st_mode):
                        self.send_error(404)
                        return
                    content = stream.read()
            except OSError:
                self.send_error(404)
                return
            self.send_response(200)
            self.send_header("Content-Type", ASSETS[name])
            self.send_header("Content-Length", str(len(content)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            if send_body:
                self.wfile.write(content)

    return Handler


def main():
    # Loopback by default. Managed runners explicitly supply HOST and PORT.
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8000"))
    site = os.open(SITE, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try:
        with ThreadingHTTPServer((host, port), handler_for(site)) as server:
            server.serve_forever()
    finally:
        os.close(site)


if __name__ == "__main__":
    main()
