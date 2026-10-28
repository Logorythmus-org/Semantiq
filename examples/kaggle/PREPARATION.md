# Offline preparation integrity example

This standalone Python 3.10+ example verifies the two files listed in a
`preparation_metadata` manifest: `README.md` and `scenario-selection.json`.
It checks byte lengths, SHA-256 digests, exact inventory and the explicit
`not_run` / zero-results status. It does not import the SemantIQ core,
execute Gaia2, call a provider, upload data or modify its inputs.

```sh
python examples/kaggle/verify_preparation.py --self-test
python examples/kaggle/verify_preparation.py /path/to/manifest.json
```

The self-tests use synthetic temporary fixtures only. They cover repeatability,
changed bytes, duplicate records, missing files, executed-status mismatch and
symlinks. No benchmark evidence is shipped with this example.

## Evidence boundary

Matching hashes check consistency against the supplied manifest. The manifest
is not independently authenticated, unlisted files are not inspected, and this
example does not authenticate execution or upstream claims. Its output is not
a benchmark score, independent replication, certification or production claim.

A private Kaggle preparation notebook version 3 ran a prior verifier successfully:
https://www.kaggle.com/code/semantiq/semantiq-external-evidence-lab-001?scriptVersionId=362936545

The private preparation dataset is:
https://www.kaggle.com/datasets/semantiq/semantiq-external-evidence-001-preparation

These links require the owner's access. That notebook version does not yet pin
this repository implementation and lacks its additional duplicate/symlink guards.
No real Gaia2 result is available. A Gaia2 normalizer, complete trace linkage,
provider budget, reviewed upstream redistribution terms and a real execution
remain separate work. Public Kaggle publication is not implied by this example.
