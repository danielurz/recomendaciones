CREATE TABLE IF NOT EXISTS comment_votes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote       SMALLINT NOT NULL CHECK (vote IN (1, -1)),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);
