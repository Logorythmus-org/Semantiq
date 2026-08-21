"""
Test Python package metadata and build structure.
"""
from pathlib import Path
import sys
try:
    import tomllib
except ModuleNotFoundError:
    import tomli as tomllib

src_dir = Path(__file__).resolve().parents[1] / "src"
if str(src_dir) not in sys.path:
    sys.path.insert(0, str(src_dir))

import semantiq


def test_package_metadata():
    pyproject_path = Path(__file__).resolve().parents[1] / "pyproject.toml"
    assert pyproject_path.exists()

    with open(pyproject_path, "rb") as f:
        data = tomllib.load(f)
    project = data["project"]
    assert project["name"] == "semantiq"
    assert project["version"] == semantiq.__version__
    assert project["license"] == "MIT"
    assert project["requires-python"] == ">=3.10"
    assert "semantiq" in project["scripts"]
    assert project["scripts"]["semantiq"] == "semantiq.cli:main"
    assert "tomli>=2.0.1; python_version < '3.11'" in project["optional-dependencies"]["dev"]


def test_package_all_exports_match():
    # Verify that every item declared in __all__ exists in the semantiq module namespace
    for name in semantiq.__all__:
        assert hasattr(semantiq, name), f"Missing exported symbol in semantiq module: {name}"


def test_package_structure():
    pkg_dir = Path(__file__).resolve().parents[1] / "src" / "semantiq"
    assert (pkg_dir / "__init__.py").exists()
    assert (pkg_dir / "client.py").exists()
    assert (pkg_dir / "contracts.py").exists()
    assert (pkg_dir / "controlled_language.py").exists()
    assert (pkg_dir / "errors.py").exists()
    assert (pkg_dir / "fixtures.py").exists()
    assert (pkg_dir / "runner.py").exists()
    assert (pkg_dir / "cli.py").exists()
