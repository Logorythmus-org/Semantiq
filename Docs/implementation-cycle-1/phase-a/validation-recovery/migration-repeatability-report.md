# Migration Repeatability Report

Passed. Migration runner applied the foundation migration from zero and re-ran successfully. History remained exactly `[{"version":1,"name":"foundation"}]`; no duplicate head was present. A first migration command attempt failed only because the host `tsx -e` invocation used unsupported top-level await; the corrected IIFE command passed.
