import { Feed } from 'feed';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// 读取文章数据
const dataFile = path.join(rootDir, 'data', 'posts.json');
const publicDir = path.join(rootDir, 'public');

// 博客配置
const blogConfig = {
  title: '林子的博客',
  description: '记录技术与生活的点滴',
  id: 'https://your-blog.com',
  link: 'https://your-blog.com',
  language: 'zh-CN',
  image: 'https://your-blog.com/logo.png',
  favicon: 'https://your-blog.com/favicon.ico',
  copyright: `© ${new Date().getFullYear()} 林子`,
  feedLinks: {
    rss2: 'https://your-blog.com/rss.xml',
  },
  author: {
    name: '林子',
    link: 'https://your-blog.com/about',
  },
};

function generateRSS() {
  // 读取文章
  let posts = [];
  try {
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    posts = data.posts
      .filter(p => !p.draft)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (err) {
    console.error('读取文章数据失败:', err);
    return;
  }

  // 创建 Feed
  const feed = new Feed({
    title: blogConfig.title,
    description: blogConfig.description,
    id: blogConfig.id,
    link: blogConfig.link,
    language: blogConfig.language,
    image: blogConfig.image,
    favicon: blogConfig.favicon,
    copyright: blogConfig.copyright,
    feedLinks: blogConfig.feedLinks,
    author: blogConfig.author,
    updated: posts.length > 0 ? new Date(posts[0].date) : new Date(),
  });

  // 添加文章
  posts.forEach(post => {
    feed.addItem({
      title: post.title,
      id: `${blogConfig.link}/blog/${post.slug}`,
      link: `${blogConfig.link}/blog/${post.slug}`,
      description: post.summary || '',
      content: post.content || '',
      author: [blogConfig.author],
      date: new Date(post.date),
      category: post.category ? [{ name: post.category }] : [],
    });
  });

  // 写入文件
  const rssPath = path.join(publicDir, 'rss.xml');
  fs.writeFileSync(rssPath, feed.rss2());
  console.log(`✅ RSS 已生成: ${rssPath}`);
  console.log(`   共 ${posts.length} 篇文章`);
}

generateRSS();
