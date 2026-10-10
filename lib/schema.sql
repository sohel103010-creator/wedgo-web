-- WedGo Database Schema

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  mobile VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  password_hash VARCHAR(200),
  gender VARCHAR(10) NOT NULL DEFAULT 'male',
  role VARCHAR(20) NOT NULL DEFAULT 'member',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  suspended_until TIMESTAMP,
  referral_code VARCHAR(20) UNIQUE,
  referred_by INT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  age INT,
  height VARCHAR(20),
  address TEXT,
  district VARCHAR(60),
  blood_group VARCHAR(10),
  marital_status VARCHAR(20),
  ghar_jamai VARCHAR(10),
  education VARCHAR(100),
  occupation VARCHAR(100),
  religion VARCHAR(30),
  bio TEXT,
  photo1 TEXT,
  photo2 TEXT,
  verified BOOLEAN DEFAULT FALSE,
  online_status BOOLEAN DEFAULT TRUE,
  last_active TIMESTAMP DEFAULT NOW(),
  completion_pct INT DEFAULT 0,
  boost_until TIMESTAMP,
  featured BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS packages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(60) NOT NULL,
  price INT NOT NULL,
  duration_days INT NOT NULL DEFAULT 30,
  msg_days INT DEFAULT 0,
  msg_only BOOLEAN DEFAULT TRUE,
  audio_minutes INT DEFAULT 0,
  video_minutes INT DEFAULT 0,
  photo_share BOOLEAN DEFAULT FALSE,
  number_share BOOLEAN DEFAULT FALSE,
  link_share BOOLEAN DEFAULT FALSE,
  profile_views INT DEFAULT 0,
  unlimited_views BOOLEAN DEFAULT FALSE,
  unlimited_msg BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  package_id INT REFERENCES packages(id),
  activated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active',
  audio_used INT DEFAULT 0,
  video_used INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender_id INT REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INT REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  msg_type VARCHAR(20) DEFAULT 'text',
  seen BOOLEAN DEFAULT FALSE,
  deleted_by_sender BOOLEAN DEFAULT FALSE,
  deleted_by_receiver BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  package_id INT REFERENCES packages(id),
  amount INT NOT NULL,
  method VARCHAR(20) NOT NULL,
  sender_number VARCHAR(20),
  trx_id VARCHAR(60),
  screenshot TEXT,
  ai_check VARCHAR(20) DEFAULT 'pending',
  status VARCHAR(20) DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet (
  user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance INT DEFAULT 0,
  total_earned INT DEFAULT 0,
  total_withdrawn INT DEFAULT 0,
  bkash_number VARCHAR(20),
  nagad_number VARCHAR(20),
  rocket_number VARCHAR(20),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS withdrawals (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  method VARCHAR(20) NOT NULL,
  number VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  body TEXT,
  ntype VARCHAR(30) DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS likes (
  id SERIAL PRIMARY KEY,
  liker_id INT REFERENCES users(id) ON DELETE CASCADE,
  liked_id INT REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(liker_id, liked_id)
);

CREATE TABLE IF NOT EXISTS blocks (
  id SERIAL PRIMARY KEY,
  blocker_id INT REFERENCES users(id) ON DELETE CASCADE,
  blocked_id INT REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  reporter_id INT REFERENCES users(id) ON DELETE CASCADE,
  reported_id INT REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(50),
  details TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS call_history (
  id SERIAL PRIMARY KEY,
  caller_id INT REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INT REFERENCES users(id) ON DELETE CASCADE,
  call_type VARCHAR(10) NOT NULL,
  duration_sec INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'completed',
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS profile_views (
  id SERIAL PRIMARY KEY,
  viewer_id INT REFERENCES users(id) ON DELETE CASCADE,
  viewed_id INT REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS favorites (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  fav_user_id INT REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, fav_user_id)
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(200),
  message TEXT,
  status VARCHAR(20) DEFAULT 'open',
  admin_reply TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referrals (
  id SERIAL PRIMARY KEY,
  referrer_id INT REFERENCES users(id) ON DELETE CASCADE,
  referred_id INT REFERENCES users(id) ON DELETE CASCADE,
  bonus INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(60) PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  email VARCHAR(120) UNIQUE NOT NULL,
  mobile VARCHAR(20),
  is_main BOOLEAN DEFAULT FALSE,
  added_by INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Default settings
INSERT INTO settings (key, value) VALUES
  ('bkash_number', '01301275001'),
  ('nagad_number', '01301275001'),
  ('rocket_number', '013012750018'),
  ('site_tagline', 'সারা বিশ্বে একমাত্র ম্যাট্রিমনি যেখানে শর্ট টাইম রিলেশন করে, অডিও কল, ভিডিও কলে কথা বলে জেনে বুঝে তারপর বিয়ে করা যায়'),
  ('fb_page', 'https://www.facebook.com/profile.php?id=61594689478770'),
  ('main_admin_email', 'sj2114273@gmail.com'),
  ('main_admin_mobile', '01301275001')
ON CONFLICT (key) DO NOTHING;

-- Default packages
INSERT INTO packages (name, price, duration_days, msg_days, msg_only, audio_minutes, video_minutes, photo_share, number_share, link_share, profile_views, unlimited_views, unlimited_msg, sort_order) VALUES
  ('বেসিক', 100, 10, 10, TRUE, 0, 0, FALSE, FALSE, FALSE, 0, FALSE, FALSE, 1),
  ('স্ট্যান্ডার্ড', 500, 30, 30, TRUE, 0, 0, FALSE, FALSE, FALSE, 0, FALSE, FALSE, 2),
  ('গোল্ড', 2000, 30, 30, FALSE, 60, 30, TRUE, FALSE, FALSE, 20, FALSE, TRUE, 3),
  ('প্লাটিনাম', 5000, 30, 30, FALSE, 180, 120, TRUE, TRUE, TRUE, 0, TRUE, TRUE, 4)
ON CONFLICT DO NOTHING;

-- Main admin
INSERT INTO admins (email, mobile, is_main) VALUES
  ('sj2114273@gmail.com', '01301275001', TRUE)
ON CONFLICT (email) DO NOTHING;

CREATE TABLE IF NOT EXISTS calls (
  id SERIAL PRIMARY KEY,
  caller_id INT REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INT REFERENCES users(id) ON DELETE CASCADE,
  call_type VARCHAR(10) NOT NULL,
  status VARCHAR(20) DEFAULT 'ringing',
  offer_sdp TEXT,
  answer_sdp TEXT,
  duration_sec INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  answered_at TIMESTAMP,
  ended_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ice_candidates (
  id SERIAL PRIMARY KEY,
  call_id INT REFERENCES calls(id) ON DELETE CASCADE,
  sender_id INT REFERENCES users(id) ON DELETE CASCADE,
  candidate TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Performance indexes (2026-10-10): speed up frequent queries
CREATE INDEX IF NOT EXISTS idx_messages_participants ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id, created_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer ON profile_views(viewer_id, viewed_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status, created_at);
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_call_history_users ON call_history(caller_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_likes_users ON likes(liker_id, liked_id);
