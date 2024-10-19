# @plushveil/database

> A simple database wrapper for PostgreSQL.

This package provides a simple and flexible way to interact with a PostgreSQL database in Node.js applications, featuring automatic versioned migrations and support for node procedures.



## Table of Contents

- [Prerequisites](#prerequisites)
- [Setting up the Database](#setting-up-the-database)
- [Environment Variables](#environment-variables)
- [Installation](#installation)
- [Getting Started](#getting-started)
  - [Running Queries](#running-queries)
  - [Versioning queries](#versioning-queries)
  - [Stored Procedures](#stored-procedures)



## Prerequisites

- [Node](https://nodejs.org/en/)
- [PostgreSQL](https://www.postgresql.org/)



## Setting up the Database

You’ll need a PostgreSQL superuser to create the necessary application users and databases. If you've installed PostgreSQL, you likely already created a superuser. The default user is usually `postgres`.

| Name              | Description               | Example Value      |
| ----------------- | ------------------------- |------------------- |
| `PGUSER`          | The superusers user name. | `postgres`         |
| `PGPASSWORD`      | The superusers password.  | `postgres`         |

If you haven't created a superuser, you can create one by running the following commands as the `postgres` user:

```bash
sudo -u postgres createuser --superuser \"$PGUSER\"
sudo -u postgres psql -c "ALTER USER \"${PGUSER}\" WITH PASSWORD '${PGPASSWORD}';"
```


### Creating the Application User and Database

Once your superuser is configured, you can create an application user and a database:

```bash
psql -c "CREATE USER \"${PGUSER}\";"
psql -c "CREATE DATABASE \"${PGDATABASE}\";"
psql -c "GRANT ALL PRIVILEGES ON DATABASE \"${PGDATABASE}\" TO \"${PGUSER}\";"
```

Replace the placeholders `${PGUSER}` and `${PGDATABASE}` with your desired values.


## Environment Variables

The package relies on environment variables to connect to your PostgreSQL database. Ensure the following variables are properly set:

| Name         | Description                        | Example           |
| ------------ | ---------------------------------- | ----------------- |
| `PGHOST`     | The host of the PostgreSQL server. | `localhost`       |
| `PGPORT`     | The port of the PostgreSQL server. | `5432`            |
| `PGDATABASE` | The database name.                 | `@${org}`         |
| `PGSCHEMA`   | The schema name.                   | `${repo}`         |
| `PGUSER`     | The user name.                     | `@${org}/${repo}` |
| `PGPASSWORD` | The password.                      | `@${org}/${repo}` |



## Installation

To install the package, use npm:

```bash
npm install @plushveil/database
```


## Getting Started

Once installed, importing the package automatically connects to the database using the [environment variables](#environment-variables) you set up earlier.

```js
import pool from '@plushveil/database'
```

The database setup will run all `.pgsql` files in the `./database` directory (not recursive).


### Running Queries

You can execute queries by obtaining a connection from the pool. Make sure to release the connection once you're done:

```js
const db = await pool.connect()
const result = await db.query('SELECT NOW()')
console.log(result.rows)
db.release()
```

Note: To gracefully close the connection pool and allow the app to exit, call pool.end().

```js
pool.end()
```


### Versioning queries

This package supports query versioning to automatically handle database migrations.
Queries stored in the `./database` directory can be prefixed with a special `@version` comment:

```sql
/** @version 1.0.0 */
CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(100));
```

When the database is set up, the package will only run queries that have not been run yet.


| Package Version | Database Version | `@version` annotation | Execute Query      | Throws Error       |
| --------------- | ---------------- | --------------------- | ------------------ | ------------------ |
| `0.0.1`         | < `0.0.1`        |                       | :heavy_check_mark: | :x:                |
| `0.0.1`         | = `0.0.1`        |                       | :x:                | :x:                |
| `0.0.1`         | > `0.0.1`        |                       | :x:                | :heavy_check_mark: |
| `0.0.2`         |                  | < `0.0.2`             | :heavy_check_mark: | :x:                |
| `0.0.2`         |                  | = `0.0.2`             | :heavy_check_mark: | :x:                |
| `0.0.2`         | = `0.0.2`        | = `0.0.2`             | :x:                | :x:                |
| `0.0.2`         |                  | > `0.0.2`             | :x:                | :x:                |
| `0.0.3-feat`    |                  | `0.0.3-bugfix`        | :x:                | :x:                |
| `0.0.3-feat`    |                  | `0.0.3-feat`          | :heavy_check_mark: | :x:                |
| `0.0.3-feat`    | `0.0.3-feat`     | `0.0.3-feat`          | :x:                | :x:                |

For more advanced usage, see the [./database/info.pgsql](../database/info.pgsql) file.


### Stored Procedures

Procedures are placed in the [./database/procedures](../database/procedures) directory.
When the database is initialized, these procedures become accessible as functions through the `procedures` property on the database connection.

```js
const db = await pool.connect()
await db.procedures.get_user_by_id(1)  // calls database/procedures/get_user_by_id.mjs
db.release()
```

> Supported Extensions: .mjs, .js, .sql, .psql, .pgsql

Stored procedures allow you to organize complex database logic into reusable functions that can be called easily from your application code.
