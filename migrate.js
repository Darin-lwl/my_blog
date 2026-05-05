import { readFileSync, readdirSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

const data = JSON.parse(readFileSync(join(process.cwd(), 'data/posts.json'), 'utf-8'));
const uploadsDir = join(process.cwd(), 'uploads');
const CHUNK_SIZE = 50000;

console.log('=== 数据迁移脚本 ===\n');

// Posts SQL
const lines = ['-- D1 数据迁移 SQL', ''];

for (const post of data.posts) {
  const tags = JSON.stringify(post.tags || []);
  const escape = (s) => (s || '').replace(/'/g, "''");

  lines.push(`INSERT OR REPLACE INTO posts (slug, title, date, category, tags, summary, content, featured, draft, createdAt, updatedAt) VALUES (`);
  lines.push(`  '${escape(post.slug)}',`);
  lines.push(`  '${escape(post.title)}',`);
  lines.push(`  '${escape(post.date)}',`);
  lines.push(`  '${escape(post.category || '未分类')}',`);
  lines.push(`  '${escape(tags)}',`);
  lines.push(`  '${escape(post.summary)}',`);
  lines.push(`  '${escape(post.content)}',`);
  lines.push(`  ${post.featured ? 1 : 0},`);
  lines.push(`  ${post.draft ? 1 : 0},`);
  lines.push(`  '${escape(post.createdAt)}',`);
  lines.push(`  '${escape(post.updatedAt)}'`);
  lines.push(`);`);
  lines.push('');
}

lines.push('INSERT OR IGNORE INTO visits (id, count) VALUES (1, 0);');
writeFileSync('migration.sql', lines.join('\n'));
console.log(`✅ migration.sql（${data.posts.length} 篇文章 + 计数器）`);

// Images - split into chunked SQL files
try {
  const files = readdirSync(uploadsDir);
  const imageFiles = files.filter(f => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f));

  if (imageFiles.length > 0) {
    const sqlDir = join(process.cwd(), 'migration_images');
    try { rmSync(sqlDir, { recursive: true }); } catch {}
    mkdirSync(sqlDir, { recursive: true });

    console.log(`\n📁 发现 ${imageFiles.length} 个图片，按分块生成 SQL：`);

    for (const file of imageFiles) {
      const filePath = join(uploadsDir, file);
      const buffer = readFileSync(filePath);
      const ext = file.split('.').pop().toLowerCase();
      const mime = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml' }[ext] || 'image/png';
      const now = new Date().toISOString();
      const escape = (s) => s.replace(/'/g, "''");

      const totalChunks = Math.ceil(buffer.length / CHUNK_SIZE);
      console.log(`   ${file} (${(buffer.length / 1024).toFixed(1)} KB) → ${totalChunks} 块`);

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, buffer.length);
        const chunk = buffer.slice(start, end);
        const base64 = chunk.toString('base64');

        const sql = `INSERT INTO images (filename, chunk_index, data, contentType, createdAt) VALUES ('${escape(file)}', ${i}, '${escape(base64)}', '${mime}', '${now}');`;
        const sqlFile = join(sqlDir, `${file}_chunk${i}.sql`);
        writeFileSync(sqlFile, sql);
      }
    }

    console.log(`\n执行图片迁移命令：`);
    for (const file of imageFiles) {
      const buffer = readFileSync(join(uploadsDir, file));
      const totalChunks = Math.ceil(buffer.length / CHUNK_SIZE);
      for (let i = 0; i < totalChunks; i++) {
        console.log(`   npx wrangler d1 execute blog-db --remote --file=migration_images/${file}_chunk${i}.sql`);
      }
    }
  }
} catch {
  console.log('\n📁 uploads/ 目录不存在，跳过图片迁移');
}

console.log('\n=== 完整步骤 ===');
console.log('1. npx wrangler d1 execute blog-db --remote --file=schema.sql');
console.log('2. npx wrangler d1 execute blog-db --remote --file=migration.sql');
console.log('3. 逐个执行上面列出的图片分块 SQL');
