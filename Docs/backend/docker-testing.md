# Docker Testing

Compose syntax is checked by `pnpm verify`. Runtime Docker checks require `VERIFY_DOCKER=1` and a running Docker Desktop engine. Test volumes must be separately named and no development volume is removed by the verifier.
