/**
 * The info table is used to store the version of the database.
 *
 * The application start up process will check the version of the database and skip the execution
 * of queries that are tagged with a version that is older or equal to the current version of the database.
 *
 * Note: The version tag is read from top to bottom. If a version tag is omitted, it will be assumed to be equal to the previous version tag.
 * Each file starts with a default version tag of "0.0.1".
 *
 * @version 0.0.0
 */
CREATE TABLE IF NOT EXISTS info (
  updated_at TIMESTAMP,
  major NUMERIC,
  minor NUMERIC,
  patch NUMERIC,
  label TEXT
);

/**
 * Raise an exception if the database version is newer than the application version.
 * @version ${always}
 */
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM info
    WHERE
      major > ${major}
      OR (major = ${major} AND minor > ${minor})
      OR (major = ${major} AND minor = ${minor} AND patch > ${patch})
  )
  THEN
    RAISE EXCEPTION 'Database version is newer than application version. Please update the application.';
  END IF;
END $$;

/**
 * Insert the current version of the database.
 * @version ${packageJson.version}
 */
INSERT INTO info (
  updated_at,
  major,
  minor,
  patch,
  label
) VALUES (
  '${new Date().toISOString()}',
  ${major},
  ${minor},
  ${patch},
  '${label}'
);
