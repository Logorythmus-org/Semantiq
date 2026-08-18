"""
Root pytest discovery bridge for SemantIQ SDK canonical contract tests.
"""
import sys
from pathlib import Path

# Add packages/python/src to python path
sdk_path = Path(__file__).resolve().parent.parent / "packages" / "python" / "src"
if str(sdk_path) not in sys.path:
    sys.path.insert(0, str(sdk_path))

from test_contracts import *  # noqa: F401, F403
