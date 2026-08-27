DROP TRIGGER IF EXISTS deduct_timestamp_credit_before_document_insert;

CREATE TRIGGER deduct_document_credit_before_document_insert
BEFORE INSERT ON documents
WHEN NEW.credit_cost > 0
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
