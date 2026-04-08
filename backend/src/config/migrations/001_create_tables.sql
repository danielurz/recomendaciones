-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username         VARCHAR(50) NOT NULL,
  email            VARCHAR(255) NOT NULL UNIQUE,
  password_hash    VARCHAR NOT NULL,
  avatar_url       VARCHAR,
  bio              TEXT,
  reputation_score INTEGER DEFAULT 0,
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMP DEFAULT NOW()
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_name           VARCHAR(255) NOT NULL,
  product_price          NUMERIC(10,2) NOT NULL,
  content                TEXT NOT NULL,
  is_recommended         BOOLEAN NOT NULL,
  business_name          VARCHAR(255) NOT NULL,
  business_location_text VARCHAR(500) NOT NULL,
  google_place_id        VARCHAR(255),
  google_place_name      VARCHAR(255),
  latitude               NUMERIC(9,6),
  longitude              NUMERIC(9,6),
  place_confirmed        BOOLEAN DEFAULT false,
  score                  NUMERIC(3,1),
  embedding              VECTOR(1536),
  created_at             TIMESTAMP DEFAULT NOW(),
  updated_at             TIMESTAMP DEFAULT NOW()
);

-- Review photos
CREATE TABLE IF NOT EXISTS review_photos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id   UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  url         VARCHAR NOT NULL,
  order_index SMALLINT,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Review votes
CREATE TABLE IF NOT EXISTS review_votes (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote      SMALLINT NOT NULL CHECK (vote IN (1, -1)),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content   TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Business accounts
CREATE TABLE IF NOT EXISTS business_accounts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR NOT NULL,
  ai_avg_score  NUMERIC(3,1),
  total_reviews INTEGER DEFAULT 0,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Ad campaigns
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id    UUID NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
  keywords       TEXT[],
  daily_budget   NUMERIC(10,2) NOT NULL,
  cost_per_click NUMERIC(6,2) NOT NULL,
  is_active      BOOLEAN DEFAULT false,
  start_date     DATE,
  end_date       DATE
);

-- Ad impressions
CREATE TABLE IF NOT EXISTS ad_impressions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  user_id     UUID,
  search_query TEXT,
  was_clicked  BOOLEAN DEFAULT false,
  cost_charged NUMERIC(6,2),
  created_at   TIMESTAMP DEFAULT NOW()
);
