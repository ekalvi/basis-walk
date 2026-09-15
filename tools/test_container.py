#!/usr/bin/env python3
"""Build and smoke-test the static image without publishing any host port."""
import json
from pathlib import Path
import subprocess
import time
import uuid
from serve_site import ASSETS

ROOT = Path(__file__).resolve().parents[1]


def run(*args, check=True):
    return subprocess.run(args, cwd=ROOT, check=check, text=True, capture_output=True, timeout=180)


def main():
    revision = run('git', 'rev-parse', 'HEAD').stdout.strip()
    tag = 'basis-walks-test:' + uuid.uuid4().hex
    container = None
    try:
        run('docker', 'build', '--build-arg', 'Q5M_RELEASE=' + revision,
            '-f', 'q5m/Dockerfile', '-t', tag, '.')
        container = run('docker', 'run', '-d', '--network', 'none', '--read-only',
                        '--user', '1000:1000', '--cap-drop', 'ALL', '--security-opt',
                        'no-new-privileges', '--cpus', '.5', '--memory', '128m',
                        '--pids-limit', '128', '--tmpfs',
                        '/tmp:rw,nosuid,nodev,noexec,size=32m,mode=1777', tag).stdout.strip()
        def fetch(path):
            return run('docker', 'exec', container, 'wget', '-qO-',
                       'http://127.0.0.1:8080' + path, check=False)
        for attempt in range(20):
            marker = fetch('/.q5m-release')
            if marker.returncode == 0:
                break
            time.sleep(.25)
        assert marker.returncode == 0 and marker.stdout.strip() == revision
        run('docker', 'exec', container, 'nginx', '-t')
        inventory = run('docker', 'exec', container, 'ls', '-A',
                        '/usr/share/nginx/html').stdout.splitlines()
        assert set(inventory) == set(ASSETS) | {'.q5m-release'}, inventory
        for name in sorted(ASSETS):
            path = ROOT / 'site' / name
            assert path.is_file() and not path.is_symlink(), 'Site assets must be regular files'
            result = fetch('/' + path.name)
            assert result.returncode == 0 and result.stdout == path.read_text(), path.name
        assert fetch('/').stdout == (ROOT / 'site/index.html').read_text()
        headers = run('docker', 'exec', container, 'wget', '-S', '-O', '/dev/null',
                      'http://127.0.0.1:8080/walks.py').stderr
        assert 'Content-Type: text/plain' in headers
        assert 'X-Content-Type-Options: nosniff' in headers
        for path in ('/.git/config', '/paper/reference/main.tex', '/README.md',
                     '/.local/', '/q5m/app.env', '/q5m.yaml', '/site/', '/unknown.py', '/__pycache__/walks.cpython-312.pyc'):
            assert fetch(path).returncode != 0, path
        print(json.dumps({'ok': True, 'release_marker': revision,
                          'network': 'none', 'host_ports': [],
                          'tests': 'exact asset bytes, static Python MIME, private-path rejection'}))
    finally:
        if container:
            run('docker', 'rm', '-f', container)
        run('docker', 'image', 'rm', tag, check=False)


if __name__ == '__main__':
    main()
