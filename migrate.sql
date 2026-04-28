-- migrate.sql — Run once to set up the database
-- For local dev: psql $POSTGRES_URL -f migrate.sql
-- For production: run via Vercel Postgres console or psql

BEGIN;

CREATE TABLE IF NOT EXISTS participants (
  email       VARCHAR(255) PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  entry_fee   NUMERIC(10, 2) NOT NULL DEFAULT 20.00,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS entries (
  id                VARCHAR(100) PRIMARY KEY,
  email             VARCHAR(255) NOT NULL REFERENCES participants(email) ON DELETE CASCADE,
  participant_name  VARCHAR(255) NOT NULL,
  total_score       INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at      TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS entry_players (
  id          SERIAL PRIMARY KEY,
  entry_id    VARCHAR(100) NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  player_name VARCHAR(255) NOT NULL,
  position    SMALLINT NOT NULL,
  UNIQUE(entry_id, player_name),
  UNIQUE(entry_id, position)
);

CREATE TABLE IF NOT EXISTS scoring_events (
  id              VARCHAR(100) PRIMARY KEY,
  player_name     VARCHAR(255) NOT NULL,
  points          INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scoring_update_logs (
  id                VARCHAR(100) PRIMARY KEY,
  player_name       VARCHAR(255) NOT NULL,
  points            INTEGER NOT NULL DEFAULT 0,
  entries_affected  INTEGER NOT NULL DEFAULT 0,
  success           BOOLEAN NOT NULL DEFAULT TRUE,
  reason            TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticker_messages (
  id          VARCHAR(100) PRIMARY KEY,
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS eliminated_teams (
  team_code       VARCHAR(10) PRIMARY KEY,
  eliminated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE entry_players ADD COLUMN IF NOT EXISTS team VARCHAR(10) DEFAULT NULL;
ALTER TABLE scoring_events ADD COLUMN IF NOT EXISTS team VARCHAR(10) DEFAULT NULL;

COMMIT;
