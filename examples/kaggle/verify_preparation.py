"""Offline verifier for SemantIQ preparation metadata, not benchmark evidence.

Usage: python verify_preparation.py /path/to/manifest.json
       python verify_preparation.py --self-test
Checks listed files only. The manifest is not authenticated. No model/API calls.
"""
import argparse
import hashlib
import json
from pathlib import Path
import tempfile
import unittest


def verify_package(manifest_path):
    manifest_path = Path(manifest_path)
    if manifest_path.is_symlink():
        raise ValueError('Symlink manifest')
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    if manifest.get('package_kind') != 'preparation_metadata':
        raise ValueError('Unsupported package kind')
    if manifest.get('execution_status') != 'not_run' or manifest.get('benchmark_result_count') != 0:
        raise ValueError('Preparation status mismatch')
    base = manifest_path.parent.resolve()
    records = manifest['files']
    names = [r['path'] for r in records]
    if len(names) != 2 or set(names) != {'README.md', 'scenario-selection.json'}:
        raise ValueError('Unexpected file inventory')
    for record in records:
        source = base / record['path']
        target = source.resolve()
        if source.is_symlink() or not target.is_relative_to(base) or not target.is_file():
            raise ValueError('Unsafe or missing file')
        data = target.read_bytes()
        if len(data) != record['bytes'] or hashlib.sha256(data).hexdigest() != record['sha256']:
            raise ValueError('Integrity mismatch: ' + record['path'])
    return {'artifact_id': manifest['artifact_id'], 'integrity': 'PASS',
            'verified_files': len(records), 'benchmark_execution': 'NOT RUN',
            'benchmark_result_count': 0,
            'scope': 'Checks manifest-listed files only; does not authenticate execution or upstream claims.'}


class VerificationTests(unittest.TestCase):
    """Synthetic unit fixtures only; no benchmark results."""
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        records = []
        for name in ('README.md', 'scenario-selection.json'):
            data = b'synthetic unit fixture'
            (self.root / name).write_bytes(data)
            records.append(dict(path=name, bytes=len(data), sha256=hashlib.sha256(data).hexdigest()))
        self.manifest = dict(package_kind='preparation_metadata', execution_status='not_run',
                             benchmark_result_count=0, artifact_id='test-only', files=records)
        self.path = self.root / 'manifest.json'
        self.save()

    def save(self):
        self.path.write_text(json.dumps(self.manifest), encoding='utf-8')

    def test_repeatability(self):
        self.assertEqual(verify_package(self.path), verify_package(self.path))

    def test_tamper(self):
        (self.root / 'README.md').write_bytes(b'changed')
        with self.assertRaisesRegex(ValueError, 'Integrity mismatch'):
            verify_package(self.path)

    def test_duplicate_inventory(self):
        self.manifest['files'].append(self.manifest['files'][0])
        self.save()
        with self.assertRaisesRegex(ValueError, 'inventory'):
            verify_package(self.path)

    def test_missing_file(self):
        (self.root / 'README.md').unlink()
        with self.assertRaisesRegex(ValueError, 'missing'):
            verify_package(self.path)

    def test_executed_status(self):
        self.manifest['execution_status'] = 'success'
        self.save()
        with self.assertRaisesRegex(ValueError, 'status'):
            verify_package(self.path)

    def test_symlink(self):
        (self.root / 'README.md').unlink()
        (self.root / 'README.md').symlink_to(self.root / 'scenario-selection.json')
        with self.assertRaisesRegex(ValueError, 'Unsafe'):
            verify_package(self.path)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('manifest', nargs='?', type=Path)
    parser.add_argument('--self-test', action='store_true')
    args = parser.parse_args()
    if args.self_test:
        suite = unittest.defaultTestLoader.loadTestsFromTestCase(VerificationTests)
        result = unittest.TextTestRunner(verbosity=2).run(suite)
        raise SystemExit(0 if result.wasSuccessful() else 1)
    if args.manifest is None:
        parser.error('manifest is required unless --self-test is used')
    first = verify_package(args.manifest)
    if first != verify_package(args.manifest):
        raise ValueError('Repeatability mismatch')
    print(json.dumps(dict(first, repeatability='PASS'), indent=2, sort_keys=True))
