CREATE TABLE IF NOT EXISTS posts (
  slug TEXT PRIMARY KEY,
  title TEXT DEFAULT '未命名',
  date TEXT,
  category TEXT DEFAULT '未分类',
  tags TEXT DEFAULT '[]',
  summary TEXT DEFAULT '',
  content TEXT DEFAULT '',
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

INSERT OR IGNORE INTO visits (id, count) VALUES (1, 0);
