# Question Runtime API Catalog

Base: `/api/v1/questions` (also configured base path and local compatibility path).

| Method/path                                                               | Purpose                         |
| ------------------------------------------------------------------------- | ------------------------------- | ----------------- |
| `POST /questions`; `GET /questions`; `GET/PATCH /questions/{id}`          | Create, discover, read, update  |
| `POST /questions/{id}/archive                                             | restore`; `GET .../revisions`   | Lifecycle/history |
| `POST/GET /questions/{id}/relations`; `DELETE .../relations/{relationId}` | Relation lifecycle              |
| `GET /questions/{id}/graph`                                               | Bounded graph                   |
| `PUT/GET .../semantic-structure`; `GET .../revisions`                     | Frame write/read/history        |
| `GET /questions/{id}/semantic-snapshot`                                   | Strict Semantiq-safe snapshot   |
| `GET /questions/{id}/detail`                                              | Bounded detail model            |
| `POST/GET/DELETE .../sources/{sourceId}`                                  | Provenance                      |
| `POST/GET/DELETE .../reports/{reportId}`                                  | Reporting                       |
| `POST .../moderation-cases`; `POST .../{caseId}/actions`                  | Moderation                      |
| `GET .../audit`; `GET .../trust-signals`                                  | Internal audit/observable trust |
| `GET /health`; `GET /ready`                                               | Process/dependency health       |
