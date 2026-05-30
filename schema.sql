CREATE TABLE IF NOT EXISTS posts (
  slug TEXT PRIMARY KEY,
  title TEXT DEFAULT '未命名',
  date TEXT,
  category TEXT DEFAULT '未分类',
  tags TEXT DEFAULT '[]',
  summary TEXT DEFAULT '',
  content TEXT DEFAULT '',
  coverImage TEXT DEFAULT '',
  featured INTEGER DEFAULT 0,
  draft INTEGER DEFAULT 1,
  createdAt TEXT,
  updatedAt TEXT
);

CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY DEFAULT 1,
  count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  data TEXT NOT NULL,
  contentType TEXT DEFAULT 'image/png',
  createdAt TEXT
);

CREATE INDEX IF NOT EXISTS idx_images_filename ON images(filename);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_slug TEXT NOT NULL,
  nickname TEXT NOT NULL,
  content TEXT NOT NULL,
  status INTEGER DEFAULT 1,
  parent_id INTEGER DEFAULT 0,
  created_at TEXT,
  FOREIGN KEY (post_slug) REFERENCES posts(slug)
);

CREATE INDEX IF NOT EXISTS idx_comments_slug ON comments(post_slug);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT '📄',
  description TEXT DEFAULT '',
  visible INTEGER DEFAULT 1,
  "order" INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  avatar TEXT DEFAULT '',
  description TEXT DEFAULT '',
  visible INTEGER DEFAULT 1,
  "order" INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO visits (id, count) VALUES (1, 0);
