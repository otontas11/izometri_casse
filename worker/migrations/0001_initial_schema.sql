PRAGMA foreign_keys = ON;

CREATE TABLE profiles (
  auth0_user_id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  remaining_credits INTEGER NOT NULL DEFAULT 20 CHECK (remaining_credits >= 0),
  storage_limit_bytes INTEGER NOT NULL DEFAULT 1073741824 CHECK (storage_limit_bytes > 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  auth0_user_id TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0),
  mime_type TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('signature', 'timestamp')),
  status TEXT NOT NULL CHECK (status IN ('completed', 'failed', 'processing')),
  credit_cost INTEGER NOT NULL DEFAULT 0 CHECK (credit_cost >= 0),
  created_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (auth0_user_id) REFERENCES profiles(auth0_user_id) ON DELETE CASCADE
);

CREATE INDEX documents_user_created_at_index
  ON documents(auth0_user_id, created_at DESC);

CREATE INDEX documents_user_operation_index
  ON documents(auth0_user_id, operation, created_at DESC);

CREATE TRIGGER deduct_timestamp_credit_before_document_insert
BEFORE INSERT ON documents
WHEN NEW.operation = 'timestamp' AND NEW.credit_cost > 0
BEGIN
  SELECT (CASE
    WHEN NOT EXISTS (
      SELECT 1
      FROM profiles
      WHERE auth0_user_id = NEW.auth0_user_id
        AND remaining_credits >= NEW.credit_cost
    )
    THEN RAISE(ABORT, 'INSUFFICIENT_CREDITS')
  END);

  UPDATE profiles
  SET
    remaining_credits = remaining_credits - NEW.credit_cost,
    updated_at = NEW.created_at
  WHERE auth0_user_id = NEW.auth0_user_id;
END;
