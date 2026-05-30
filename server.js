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
const COMMENTS_FILE = join(__dirname, 'data', 'comments.json');
const LINKS_FILE = join(__dirname, 'data', 'links.json');
const CATEGORIES_FILE = join(__dirname, 'data', 'categories.json');
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
if (!fs.existsSync(COMMENTS_FILE)) {
  fs.writeFileSync(COMMENTS_FILE, JSON.stringify([], null, 2));
}
if (!fs.existsSync(LINKS_FILE)) {
  fs.writeFileSync(LINKS_FILE, JSON.stringify([], null, 2));
}
if (!fs.existsSync(CATEGORIES_FILE)) {
  fs.writeFileSync(CATEGORIES_FILE, JSON.stringify([], null, 2));
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

function readComments() {
  return JSON.parse(fs.readFileSync(COMMENTS_FILE, 'utf-8'));
}

function writeComments(data) {
  fs.writeFileSync(COMMENTS_FILE, JSON.stringify(data, null, 2));
}

function readLinks() {
  return JSON.parse(fs.readFileSync(LINKS_FILE, 'utf-8'));
}

function writeLinks(data) {
  fs.writeFileSync(LINKS_FILE, JSON.stringify(data, null, 2));
}

function readCategories() {
  return JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf-8'));
}

function writeCategories(data) {
  fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(data, null, 2));
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
  const categories = readCategories();
  const data = readPosts();
  const posts = data.posts.filter(p => !p.draft);

  // 统计每个分类的文章数量
  const countMap = {};
  posts.forEach(p => {
    const cat = p.category || '未分类';
    countMap[cat] = (countMap[cat] || 0) + 1;
  });

  // 合并分类信息和文章数量
  const result = categories
    .filter(c => c.visible !== false)
    .map(c => ({
      ...c,
      count: countMap[c.name] || 0,
    }))
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // 添加未分类（如果有）
  if (countMap['未分类']) {
    result.push({ name: '未分类', icon: '📄', description: '未分类的文章', count: countMap['未分类'] });
  }

  res.json(result);
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
  const { title, date, category, tags, summary, content, coverImage, featured, draft } = req.body;

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
    coverImage: coverImage || '',
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

  const { title, date, category, tags, summary, content, coverImage, featured, draft } = req.body;
  data.posts[idx] = {
    ...data.posts[idx],
    ...(title !== undefined && { title }),
    ...(date !== undefined && { date }),
    ...(category !== undefined && { category }),
    ...(tags !== undefined && { tags }),
    ...(summary !== undefined && { summary }),
    ...(content !== undefined && { content }),
    ...(coverImage !== undefined && { coverImage }),
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

// ===== Comment Routes =====
app.get('/api/comments', (req, res) => {
  const { slug } = req.query;
  if (!slug) return res.status(400).json({ error: '缺少 slug 参数' });

  const comments = readComments();
  const filtered = comments
    .filter(c => c.post_slug === slug && c.status === 1)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(filtered);
});

app.post('/api/comments', (req, res) => {
  const { slug, nickname, content, parentId = 0 } = req.body;

  if (!slug) return res.status(400).json({ error: '缺少文章 slug' });
  if (!nickname || nickname.trim().length === 0) return res.status(400).json({ error: '请输入昵称' });
  if (!content || content.trim().length < 2) return res.status(400).json({ error: '评论内容至少 2 个字符' });

  const data = readPosts();
  const post = data.posts.find(p => p.slug === slug && !p.draft);
  if (!post) return res.status(404).json({ error: '文章不存在' });

  const comments = readComments();
  const ip = req.ip || req.connection.remoteAddress || 'unknown';

  // 频率限制
  const recent = comments.find(c =>
    c.post_slug === slug && c.nickname === nickname.trim() &&
    new Date(c.created_at) > new Date(Date.now() - 30000)
  );
  if (recent) return res.status(429).json({ error: '请勿频繁提交评论' });

  const comment = {
    id: Date.now(),
    post_slug: slug,
    nickname: nickname.trim(),
    content: content.trim(),
    parent_id: parentId,
    status: 1, // 本地开发默认直接通过
    created_at: new Date().toISOString(),
  };

  comments.push(comment);
  writeComments(comments);
  res.status(201).json({ id: comment.id, message: '评论已提交' });
});

// Admin comment routes
app.get('/api/admin/comments', auth, (req, res) => {
  const comments = readComments();
  const data = readPosts();
  const enriched = comments.map(c => {
    const post = data.posts.find(p => p.slug === c.post_slug);
    return { ...c, post_title: post?.title || '未知文章' };
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(enriched);
});

app.put('/api/admin/comments/:id', auth, (req, res) => {
  const { status } = req.body;
  if (status !== 0 && status !== 1) return res.status(400).json({ error: '无效的状态值' });

  const comments = readComments();
  const idx = comments.findIndex(c => c.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: '评论不存在' });

  comments[idx].status = status;
  writeComments(comments);
  res.json({ message: '评论状态已更新' });
});

app.delete('/api/admin/comments/:id', auth, (req, res) => {
  const comments = readComments();
  const idx = comments.findIndex(c => c.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: '评论不存在' });

  comments.splice(idx, 1);
  writeComments(comments);
  res.json({ message: '评论已删除' });
});

// ===== Links Routes =====
app.get('/api/links', (req, res) => {
  const links = readLinks();
  res.json(links.filter(l => l.visible !== false).sort((a, b) => (a.order || 0) - (b.order || 0)));
});

app.get('/api/admin/links', auth, (req, res) => {
  const links = readLinks();
  res.json(links.sort((a, b) => (a.order || 0) - (b.order || 0)));
});

app.post('/api/admin/links', auth, (req, res) => {
  const links = readLinks();
  const { name, url, avatar, description } = req.body;

  if (!name || !url) {
    return res.status(400).json({ error: '名称和链接不能为空' });
  }

  const link = {
    id: Date.now(),
    name,
    url,
    avatar: avatar || '',
    description: description || '',
    visible: true,
    order: links.length,
    createdAt: new Date().toISOString(),
  };

  links.push(link);
  writeLinks(links);
  res.status(201).json(link);
});

app.put('/api/admin/links/:id', auth, (req, res) => {
  const links = readLinks();
  const idx = links.findIndex(l => l.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: '友链不存在' });

  const { name, url, avatar, description, visible, order } = req.body;
  links[idx] = {
    ...links[idx],
    ...(name !== undefined && { name }),
    ...(url !== undefined && { url }),
    ...(avatar !== undefined && { avatar }),
    ...(description !== undefined && { description }),
    ...(visible !== undefined && { visible }),
    ...(order !== undefined && { order }),
  };

  writeLinks(links);
  res.json(links[idx]);
});

app.delete('/api/admin/links/:id', auth, (req, res) => {
  const links = readLinks();
  const idx = links.findIndex(l => l.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: '友链不存在' });

  links.splice(idx, 1);
  writeLinks(links);
  res.json({ message: '已删除' });
});

// ===== Categories Routes =====
app.get('/api/admin/categories', auth, (req, res) => {
  const categories = readCategories();
  res.json(categories.sort((a, b) => (a.order || 0) - (b.order || 0)));
});

app.post('/api/admin/categories', auth, (req, res) => {
  const categories = readCategories();
  const { name, icon, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: '分类名称不能为空' });
  }

  // 检查名称是否重复
  if (categories.some(c => c.name === name)) {
    return res.status(400).json({ error: '分类名称已存在' });
  }

  const category = {
    id: Date.now(),
    name,
    icon: icon || '📄',
    description: description || '',
    visible: true,
    order: categories.length,
    createdAt: new Date().toISOString(),
  };

  categories.push(category);
  writeCategories(categories);
  res.status(201).json(category);
});

app.put('/api/admin/categories/:id', auth, (req, res) => {
  const categories = readCategories();
  const idx = categories.findIndex(c => c.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: '分类不存在' });

  const { name, icon, description, visible, order } = req.body;

  // 检查名称是否重复（排除自身）
  if (name && categories.some((c, i) => i !== idx && c.name === name)) {
    return res.status(400).json({ error: '分类名称已存在' });
  }

  categories[idx] = {
    ...categories[idx],
    ...(name !== undefined && { name }),
    ...(icon !== undefined && { icon }),
    ...(description !== undefined && { description }),
    ...(visible !== undefined && { visible }),
    ...(order !== undefined && { order }),
  };

  writeCategories(categories);
  res.json(categories[idx]);
});

app.delete('/api/admin/categories/:id', auth, (req, res) => {
  const categories = readCategories();
  const idx = categories.findIndex(c => c.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: '分类不存在' });

  categories.splice(idx, 1);
  writeCategories(categories);
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
