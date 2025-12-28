-- ============================================
-- PERSONA MATCHING SYSTEM
-- Schema: core
-- PostgreSQL DDL
-- ============================================

CREATE SCHEMA IF NOT EXISTS core;

-- ============================================
-- USER REGISTRY
-- ============================================

CREATE TABLE IF NOT EXISTS core.registry_versions (
  id SERIAL PRIMARY KEY,
  version_name VARCHAR(255) NOT NULL UNIQUE,  -- e.g., "UserRegistry_V1_20241221_143022"
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS core.users (
  id BIGSERIAL PRIMARY KEY,
  root_id VARCHAR(10) NOT NULL,              -- "U00001" - fixed format, max 99,999 users
  public_id VARCHAR(10) NOT NULL,            -- "#001" - fixed format
  hash CHAR(11) NOT NULL,                    -- Always 11 chars from your generateHash()
  name VARCHAR(255) NOT NULL,                -- User display name
  template VARCHAR(10),                      -- "V1", "V2" etc - version marker
  persona_vector TEXT NOT NULL DEFAULT '',   -- Binary string "101010..." - variable length
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  version_id INTEGER REFERENCES core.registry_versions(id) ON DELETE SET NULL,
  timestamp TIMESTAMPTZ NOT NULL,            -- ISO format from code
  created VARCHAR(50) NOT NULL,              -- Formatted string: "Dec 21, 2024, 2:30 PM"
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_version_id ON core.users(version_id);
CREATE INDEX IF NOT EXISTS idx_users_archived ON core.users(archived) WHERE archived = FALSE;
CREATE INDEX IF NOT EXISTS idx_users_hash ON core.users(hash);

-- ============================================
-- USER PERSONA TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS core.persona_versions (
  id SERIAL PRIMARY KEY,
  version_name VARCHAR(255) NOT NULL UNIQUE,  -- e.g., "UserPersonaTable_V1_20241221_143022"
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS core.persona_users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  hash CHAR(11) NOT NULL,                     -- Matches users.hash
  public_id VARCHAR(10),                      -- Matches users.public_id
  persona_vector TEXT NOT NULL DEFAULT '',    -- Copy from registry user
  registry_version_id INTEGER REFERENCES core.registry_versions(id) ON DELETE SET NULL,
  persona_version_id INTEGER NOT NULL REFERENCES core.persona_versions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_persona_users_persona_version ON core.persona_users(persona_version_id);
CREATE INDEX IF NOT EXISTS idx_persona_users_hash ON core.persona_users(hash);

CREATE TABLE IF NOT EXISTS core.persona_columns (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,                 -- "C1", "C2", "Trait Name" etc
  persona_version_id INTEGER NOT NULL REFERENCES core.persona_versions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_persona_columns_version ON core.persona_columns(persona_version_id);

CREATE TABLE IF NOT EXISTS core.persona_cells (
  id BIGSERIAL PRIMARY KEY,
  persona_user_id BIGINT NOT NULL REFERENCES core.persona_users(id) ON DELETE CASCADE,
  column_id BIGINT NOT NULL REFERENCES core.persona_columns(id) ON DELETE CASCADE,
  value SMALLINT NOT NULL DEFAULT 0,          -- Only 0 or 1, SMALLINT is overkill but clear
  CONSTRAINT unique_persona_cell UNIQUE(persona_user_id, column_id),
  CONSTRAINT check_binary_value CHECK (value IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_persona_cells_user ON core.persona_cells(persona_user_id);
CREATE INDEX IF NOT EXISTS idx_persona_cells_column ON core.persona_cells(column_id);

-- ============================================
-- MATRIX TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS core.matrix_versions (
  id SERIAL PRIMARY KEY,
  version_name VARCHAR(255) NOT NULL UNIQUE,  -- e.g., "PersonaTable_V1_20241221_143022"
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS core.matrix_rows (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,                 -- Persona archetype name: "Explorer", "Achiever"
  matrix_version_id INTEGER NOT NULL REFERENCES core.matrix_versions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matrix_rows_version ON core.matrix_rows(matrix_version_id);

CREATE TABLE IF NOT EXISTS core.matrix_columns (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,                 -- "C1", "C2", "C3" etc
  matrix_version_id INTEGER NOT NULL REFERENCES core.matrix_versions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matrix_columns_version ON core.matrix_columns(matrix_version_id);

CREATE TABLE IF NOT EXISTS core.matrix_cells (
  id BIGSERIAL PRIMARY KEY,
  row_id BIGINT NOT NULL REFERENCES core.matrix_rows(id) ON DELETE CASCADE,
  column_id BIGINT NOT NULL REFERENCES core.matrix_columns(id) ON DELETE CASCADE,
  value SMALLINT NOT NULL DEFAULT 0,          -- Only 0 or 1
  CONSTRAINT unique_matrix_cell UNIQUE(row_id, column_id),
  CONSTRAINT check_matrix_binary CHECK (value IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_matrix_cells_row ON core.matrix_cells(row_id);
CREATE INDEX IF NOT EXISTS idx_matrix_cells_column ON core.matrix_cells(column_id);

-- ============================================
-- NOTES ON DESIGN DECISIONS
-- ============================================

-- VARCHAR vs TEXT:
--   - VARCHAR(n) for known/limited data (IDs, names)
--   - TEXT for persona_vector (unknown max length, could be 100+ bits)

-- CHAR(11) for hash:
--   - Fixed length, always 11 chars from generateHash()
--   - CHAR is slightly faster for fixed-length lookups

-- BIGSERIAL vs SERIAL:
--   - BIGSERIAL for user/row/column/cell IDs (could scale large)
--   - SERIAL for version IDs (unlikely to have millions of versions)

-- SMALLINT for binary values:
--   - Overkill (BOOLEAN would work) but makes intent crystal clear
--   - CHECK constraint enforces 0/1 only

-- ON DELETE CASCADE:
--   - Deleting a version should delete all related data
--   - Prevents orphaned records

-- ON DELETE SET NULL:
--   - Registry version deletion shouldn't delete users (historical data)
--   - But loses version reference (acceptable trade-off)

-- Indexes:
--   - Foreign keys (for JOIN performance)
--   - Filter columns (archived, version lookups)
--   - Partial index on archived (only index non-archived for faster queries)

-- TIMESTAMPTZ vs TIMESTAMP:
--   - Always use TIMESTAMPTZ for timezone awareness
--   - Node.js Date.toISOString() includes timezone

-- created_at vs timestamp vs created:
--   - kept both timestamp (ISO) and created (formatted) from your JSON
--   - can drop 'created' column if you format on frontend
