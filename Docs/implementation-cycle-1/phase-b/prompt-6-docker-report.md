# Prompt 6 Docker Report

Dedicated project: `techclub-prompt6`. PostgreSQL 16 Alpine and rebuilt API became healthy. A live flow created Question/source/report/case/action and enforced public 404 plus moderator 200.

An initial simultaneous API/database restart exposed an API startup race. `restart: unless-stopped` was added to API and PostgreSQL. The exact simultaneous restart then passed with both healthy. Question, one source, one report, and five audits survived; restricted public access remained 404.

Dedicated containers and volumes are removed at sprint completion.
