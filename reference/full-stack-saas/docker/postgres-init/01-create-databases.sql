-- Bootstrap the extra Postgres databases zero-cache needs.
-- `spark` is created automatically by the Postgres image via POSTGRES_DB.
-- The two below are CVR + change-log stores Zero owns separately.

CREATE DATABASE spark_cvr;
CREATE DATABASE spark_change;
CREATE DATABASE spark_e2e;
