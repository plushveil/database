# @plushveil/database

> A simple database wrapper for PostgreSQL.

- [Prerequisites](#prerequisites)
- [Setting up the Database](#setting-up-the-database)
- [Environment Variables](#environment-variables)
- [Installation](#installation)
- [Getting Started](#getting-started)
  - [Versioning queries](#versioning-queries)
  - [Procedures](#procedures)



## Prerequisites

- [Node](https://nodejs.org/en/)
- [PostgreSQL](https://www.postgresql.org/)



## Setting up the Database

To create an application user and a database you need a superuser. You should have created a superuser during the installation of PostgreSQL.

| Name              | Description               | Example Value      |
| ----------------- | ------------------------- |------------------- |
| `PGUSER`          | The superusers user name. | `admin`            |
| `PGPASSWORD`      | The superusers password.  | `admin`            |

If you have not created a superuser, you can do so by assuming the role of the postgres user and then running the createuser command:

```bash
sudo -u postgres createuser --superuser \"$PGUSER\"
sudo -u postgres psql -c "ALTER USER \"${PGUSER}\" WITH PASSWORD '${PGPASSWORD}';"
```

That superuser can now create a new application user and a database.
The template literals `${PGUSER}` and `${PGDATABASE}` should be replaced with the desired values.

```bash
psql -c "CREATE USER \"${PGUSER}\";"
psql -c "CREATE DATABASE \"${PGDATABASE}\";"
psql -c "GRANT ALL PRIVILEGES ON DATABASE \"${PGDATABASE}\" TO \"${PGUSER}\";"
```



## Environment Variables

The code samples in this document assume that the following environment variables are set:

| Name         | Description                        | Example           |
| ------------ | ---------------------------------- | ----------------- |
| `PGHOST`     | The host of the PostgreSQL server. | `localhost`       |
| `PGPORT`     | The port of the PostgreSQL server. | `5432`            |
| `PGDATABASE` | The database name.                 | `@${org}`         |
| `PGSCHEMA`   | The schema name.                   | `${repo}`         |
| `PGUSER`     | The user name.                     | `@${org}/${repo}` |
| `PGPASSWORD` | The password.                      | `@${org}/${repo}` |



## Installation

This package available in the NPM registry can be installed using the following command:

```bash
npm install @plushveil/database
```


## Getting Started

Importing the package will automatically connect to the database using the [environment variables](#environment-variables).

```js
import pool from '@plushveil/database'
```

The database will be set up by running all `.psql` files in the `./database` directory (not recursive).

If you want the app to exit `pool.end()` needs to be called, otherwise the connection will be kept alive.

```js
import pool from '@plushveil/database'
pool.end()
```

To run a query, you need to get a connection from the pool and then release it after the connection is no longer needed.

```js
const db = await pool.connect()
console.log(await db.query('SELECT NOW()'))
db.release()
```


### Versioning queries

Queries in the `./database` directory can be prefixed with the `/** @version ${version} */` DOC comment.
This allows the package to only run the queries that have not been run yet.

Please take a look at [./database/info.sql](../database/info.sql) for an advanced usage example.

This makes it possible to run the database setup at application startup and only run the queries that have not been run yet.

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


### Procedures

Procedures are stored in the [./database/procedures](../database/procedures) directory (not recursive).
When the database is set up, all queries in this directory will be available as functions in the `procedures` property.

```js
import pool from '@plushveil/database'
const db = await pool.connect()

// this will call the default function of database/procedures/get_user_by_id.mjs
// available extensions are .mjs, .js, .sql, .psql, .pgsql
db.procedures.get_user_by_id(1)
```
