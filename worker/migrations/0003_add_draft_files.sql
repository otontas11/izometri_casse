CREATE TABLE draft_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  auth0_user_id TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0),
  mime_type TEXT NOT NULL,
  intended_operation TEXT NOT NULL CHECK (intended_operation IN ('signature', 'timestamp')),
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processed')),
  created_at TEXT NOT NULL,
  processed_at TEXT,
  FOREIGN KEY (auth0_user_id) REFERENCES profiles(auth0_user_id) ON DELETE CASCADE
);

CREATE INDEX draft_files_user_operation_status_created_index
  ON draft_files(
    auth0_user_id,
    intended_operation,
    status,
    created_at DESC
  );

ALTER TABLE documents
  ADD COLUMN draft_file_id INTEGER REFERENCES draft_files(id);

CREATE UNIQUE INDEX documents_draft_file_id_index
  ON documents(draft_file_id)
  WHERE draft_file_id IS NOT NULL;

CREATE TRIGGER validate_draft_file_before_document_insert
BEFORE INSERT ON documents
WHEN NEW.draft_file_id IS NOT NULL
BEGIN
  SELECT (CASE
    WHEN NOT EXISTS (
      SELECT 1
      FROM draft_files
      WHERE id = NEW.draft_file_id
        AND auth0_user_id = NEW.auth0_user_id
        AND object_key = NEW.object_key
        AND intended_operation = NEW.operation
        AND status = 'uploaded'
    )
    THEN RAISE(ABORT, 'DRAFT_FILE_NOT_AVAILABLE')
  END);
END;
