import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'blog-secret-key-change-in-production';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const DATA_FILE = join(__dirname, 'data', 'posts.json');
const UPLOADS_DIR = join(__dirname, 'uploads');
const SITE_START_DATE = new Date('2024-01-01');
let visitCount = 0;

// Ensure directories exist
if (!fs.existsSync(join(__dirname, 'data'))) {
  fs.mkdirSync(join(__dirname, 'data'));
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ posts: [] }, null, 2));
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

// Multer config for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = extname(file.originalname);
    cb(null, `img-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
    if (allowed.test(extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('只支持图片文件 (jpg, png, gif, webp, svg)'));
    }
  }
});

function readPosts() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function writePosts(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-|-$/g, '') || `post-${Date.now()}`;
}

// Middleware
app.use(express.json({ limit: '10mb' }));

// Auth middleware
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录' });
  }
  try {
    jwt.verify(header.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: '登录已过期' });
  }
}

// ===== Auth Routes =====
app.post('/api/auth/login', (req, res) => {
  if (req.body.password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: '密码错误' });
  }
  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

// ===== Public Routes =====
app.get('/api/posts', (req, res) => {
  const data = readPosts();
  const posts = data.posts
    .filter(p => !p.draft)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(posts);
});

app.get('/api/posts/:slug', (req, res) => {
  const data = readPosts();
  const post = data.posts.find(p => p.slug === req.params.slug);
  if (!post) return res.status(404).json({ error: '文章不存在' });
  res.json(post);
});

app.get('/api/categories', (req, res) => {
  const data = readPosts();
  const map = {};
  data.posts.filter(p => !p.draft).forEach(p => {
    const cat = p.category || '未分类';
    map[cat] = (map[cat] || 0) + 1;
  });
  res.json(Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count));
});

app.get('/api/tags', (req, res) => {
  const data = readPosts();
  const map = {};
  data.posts.filter(p => !p.draft).forEach(p => {
    (p.tags || []).forEach(t => { map[t] = (map[t] || 0) + 1; });
  });
  res.json(Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count));
});

app.get('/api/stats', (req, res) => {
  const data = readPosts();
  const posts = data.posts.filter(p => !p.draft);
  const totalWords = posts.reduce((sum, p) => sum + (p.content?.length || 0), 0);
  const daysSince = Math.floor((Date.now() - SITE_START_DATE.getTime()) / 86400000);
  visitCount++;
  res.json({ totalWords, daysSince, todayVisits: visitCount });
});

// ===== Admin Routes (Protected) =====
app.get('/api/admin/posts', auth, (req, res) => {
  const data = readPosts();
  res.json(data.posts.sort((a, b) => new Date(b.updatedAt || b.date) - new Date(a.updatedAt || a.date)));
});

app.post('/api/admin/posts', auth, (req, res) => {
  const data = readPosts();
  const { title, date, category, tags, summary, content, featured, draft } = req.body;

  let slug = generateSlug(title);
  const existing = data.posts.map(p => p.slug);
  let finalSlug = slug, i = 1;
  while (existing.includes(finalSlug)) { finalSlug = `${slug}-${i++}`; }

  const post = {
    slug: finalSlug,
    title: title || '未命名',
    date: date || new Date().toISOString().split('T')[0],
    category: category || '未分类',
    tags: Array.isArray(tags) ? tags : [],
    summary: summary || '',
    content: content || '',
    featured: featured || false,
    draft: draft !== false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  data.posts.push(post);
  writePosts(data);
  res.status(201).json(post);
});

app.put('/api/admin/posts/:slug', auth, (req, res) => {
  const data = readPosts();
  const idx = data.posts.findIndex(p => p.slug === req.params.slug);
  if (idx === -1) return res.status(404).json({ error: '文章不存在' });

  const { title, date, category, tags, summary, content, featured, draft } = req.body;
  data.posts[idx] = {
    ...data.posts[idx],
    ...(title !== undefined && { title }),
    ...(date !== undefined && { date }),
    ...(category !== undefined && { category }),
    ...(tags !== undefined && { tags }),
    ...(summary !== undefined && { summary }),
    ...(content !== undefined && { content }),
    ...(featured !== undefined && { featured }),
    ...(draft !== undefined && { draft }),
    updatedAt: new Date().toISOString(),
  };

  writePosts(data);
  res.json(data.posts[idx]);
});

app.delete('/api/admin/posts/:slug', auth, (req, res) => {
  const data = readPosts();
  const idx = data.posts.findIndex(p => p.slug === req.params.slug);
  if (idx === -1) return res.status(404).json({ error: '文章不存在' });
  data.posts.splice(idx, 1);
  writePosts(data);
  res.json({ message: '已删除' });
});

// ===== Image Upload =====
const uploadHandler = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: '请选择图片' });
    }
    const url = `/uploads/${req.file.filename}`;
    res.json({ url, filename: req.file.filename });
  });
};
app.post('/api/upload', auth, uploadHandler);
app.post('/api/admin/upload', auth, uploadHandler);

// ===== Serve Static Files =====
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(join(__dirname, 'dist')));

// SPA fallback - serve index.html for all non-API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  博客已启动`);
  console.log(`  访问地址: http://localhost:${PORT}`);
  console.log(`  管理后台: http://localhost:${PORT}/admin`);
  console.log(`  默认密码: ${ADMIN_PASSWORD}\n`);
});
