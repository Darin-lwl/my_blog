// Simple frontmatter parser that works in the browser
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) {
    return { data: {}, content }
  }

  const yamlStr = match[1]
  const body = match[2]
  const data = {}

  yamlStr.split('\n').forEach((line) => {
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) return

    const key = line.slice(0, colonIndex).trim()
    let value = line.slice(colonIndex + 1).trim()

    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    // Parse arrays like ["tag1", "tag2"]
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1)
        .split(',')
        .map((item) => item.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean)
    }

    // Parse booleans
    if (value === 'true') value = true
    if (value === 'false') value = false

    data[key] = value
  })

  return { data, content: body }
}

// Use Vite's import.meta.glob to import all markdown files
const postFiles = import.meta.glob('../posts/*.md', { query: '?raw', import: 'default', eager: true })

function parsePosts() {
  const posts = Object.entries(postFiles).map(([path, content]) => {
    const { data, content: markdownContent } = parseFrontmatter(content)
    const slug = path.replace('../posts/', '').replace('.md', '')

    return {
      slug,
      frontmatter: {
        title: data.title || 'Untitled',
        date: data.date || '2024-01-01',
        category: data.category || '未分类',
        tags: Array.isArray(data.tags) ? data.tags : [],
        summary: data.summary || '',
        cover: data.cover || '',
        featured: data.featured || false,
        draft: data.draft || false,
      },
      content: markdownContent,
    }
  })

  return posts
    .filter((post) => !post.frontmatter.draft)
    .sort((a, b) => new Date(b.frontmatter.date) - new Date(a.frontmatter.date))
}

let cachedPosts = null

export function getAllPosts() {
  if (!cachedPosts) {
    cachedPosts = parsePosts()
  }
  return cachedPosts
}

export function getPostBySlug(slug) {
  return getAllPosts().find((post) => post.slug === slug)
}

export function getPostsByCategory(category) {
  return getAllPosts().filter((post) => post.frontmatter.category === category)
}

export function getPostsByTag(tag) {
  return getAllPosts().filter((post) =>
    post.frontmatter.tags.includes(tag)
  )
}

export function getAllCategories() {
  const posts = getAllPosts()
  const categoryMap = {}
  posts.forEach((post) => {
    const cat = post.frontmatter.category
    categoryMap[cat] = (categoryMap[cat] || 0) + 1
  })
  return Object.entries(categoryMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

export function getAllTags() {
  const posts = getAllPosts()
  const tagMap = {}
  posts.forEach((post) => {
    post.frontmatter.tags.forEach((tag) => {
      tagMap[tag] = (tagMap[tag] || 0) + 1
    })
  })
  return Object.entries(tagMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

export function getFeaturedPosts() {
  return getAllPosts().filter((post) => post.frontmatter.featured)
}

export function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
