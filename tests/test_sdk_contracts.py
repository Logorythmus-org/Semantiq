"""
Root pytest discovery bridge for SemantIQ SDK canonical contract tests.
"""
import sys
from pathlib import Path

# Add packages/python/src and packages/python/tests to python path
root_dir = Path(__file__).resolve().parent.parent
sdk_path = root_dir / "packages" / "python" / "src"
tests_path = root_dir / "packages" / "python" / "tests"

if str(sdk_path) not in sys.path:
    sys.path.insert(0, str(sdk_path))
if str(tests_path) not in sys.path:
    sys.path.insert(0, str(tests_path))

from test_contracts import *  # noqa: F401, F403
