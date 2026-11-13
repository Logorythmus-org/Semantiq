"""Build/install outside the checkout and exercise the packaged fixed worker."""

import subprocess
import sys
import tempfile
import venv
from pathlib import Path


def main() -> None:
    package = Path(__file__).resolve().parents[1]
    with tempfile.TemporaryDirectory(prefix="lite-worker-wheel-") as directory:
        root = Path(directory)
        subprocess.run(
            [sys.executable, "-m", "build", str(package), "--outdir", str(root / "dist")],
            check=True,
        )
        venv.EnvBuilder(with_pip=True).create(root / "env")
        python = root / "env" / ("Scripts/python.exe" if sys.platform == "win32" else "bin/python")
        wheel = next((root / "dist").glob("*.whl"))
        subprocess.run([str(python), "-m", "pip", "install", str(wheel)], check=True)
        subprocess.run(
            [
                str(python),
                "-I",
                "-c",
                """
import json
from semantiq_lite import snapshot, ReviewResult, validate_review
from semantiq_lite.worker import (
    WorkerSupervisor, capture_bytes, run_untrusted_document, WorkerError,
)
validate_review(ReviewResult([snapshot('s', b'ok')]), {'s': b'ok'})
supervisor = WorkerSupervisor()
result = supervisor.run_synthetic(capture_bytes('s', b'ok'))
assert result.raw_sha256 == capture_bytes('s', b'ok').raw_sha256
assert not supervisor.capabilities().untrusted_documents_enabled
try:
    run_untrusted_document('unused')
except WorkerError as error:
    assert error.code == 'ISOLATION_UNAVAILABLE'
else:
    raise AssertionError('untrusted processing enabled')
print(json.dumps(supervisor.capabilities().to_dict(), sort_keys=True))
""",
            ],
            cwd=root,
            check=True,
        )


if __name__ == "__main__":
    main()
