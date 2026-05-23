-- Bootstrap the extra Postgres databases zero-cache needs.
-- `anvil` is created automatically by the Postgres image via POSTGRES_DB.
-- The two below are CVR + change-log stores Zero owns separately.

CREATE DATABASE anvil_cvr;
CREATE DATABASE anvil_change;
CREATE DATABASE anvil_e2e;
