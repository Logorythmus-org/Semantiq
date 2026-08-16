# Prompt 5 Secret Inventory

| Secret name                     | Purpose                             | Owner             | Required profiles                                   | Source                        | Rotation guidance                              | Exposure risk               |
| ------------------------------- | ----------------------------------- | ----------------- | --------------------------------------------------- | ----------------------------- | ---------------------------------------------- | --------------------------- |
| `DATABASE_URL` password         | Local PostgreSQL authentication     | Persistence       | development/docker/migration; test uses isolated DB | environment or local env file | Rotate local credentials when shared or copied | High if logged or committed |
| `NEO4J_PASSWORD`                | Optional local graph authentication | Graph adapter     | only when graph enabled                             | environment                   | Rotate with local graph reset                  | High                        |
| `MINIO_SECRET_KEY`              | Optional local object storage       | Storage adapter   | only when object storage enabled                    | environment                   | Rotate with local MinIO reset                  | High                        |
| `GITHUB_TOKEN`                  | Optional GitHub integration         | Optional provider | only when explicitly enabled                        | environment                   | Revoke and replace through provider            | Critical if exposed         |
| `OPENAI_API_KEY`                | Optional external provider          | Optional provider | only when explicitly enabled                        | environment                   | Revoke and replace through provider            | Critical if exposed         |
| local signing/encryption secret | Reserved future local security use  | Security settings | development/test only until implemented             | untracked local file          | Regenerate on suspected exposure               | High                        |

No secret values are stored in this inventory.
