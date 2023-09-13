# Database Setup (Postgres)

## We'll be using local postgres for development

- Install [Postgres > 15](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads)
- Install GUI for database management (optional but recommended) [PGAdmin](https://www.pgadmin.org/download/) or [DBeaver](https://dbeaver.io/download/) or use postgresql command line

## Create user/role

- Using PGAdmin or Sql query, create a new user spade_user
- If using terminal, become postgres user `sudo -u postgres -i`
- then `sudo -u postgres -i`
- Then run the following commands

- Create a new user

```
CREATE ROLE spade_user WITH
  LOGIN
  NOSUPERUSER
  INHERIT
  NOCREATEDB
  NOCREATEROLE
  NOREPLICATION;
```

- Set password for user

```
ALTER USER spade_user WITH PASSWORD 'new_password';
```

- Create Development Database

```
CREATE DATABASE spade_dev
    WITH
    OWNER = spade_user
    ENCODING = 'UTF8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1
    IS_TEMPLATE = False;
```

- Create Production Database

```
CREATE DATABASE spade
    WITH
    OWNER = spade_user
    ENCODING = 'UTF8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1
    IS_TEMPLATE = False;
```

- Create .env using .env.sample as template

If no password was set in database for spade_user, then remove the :<db_password> from db urls in api/.env i.e. `postgres://spade_user@127.0.0.1:5432/spade_dev_db`