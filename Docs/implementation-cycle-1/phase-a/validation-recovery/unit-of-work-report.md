# Unit of Work Report

Passed against real PostgreSQL. `PostgresUnitOfWork` committed a record visible to a new session and rolled back a record that remained absent. Client release and pool reuse completed without observed leak.
