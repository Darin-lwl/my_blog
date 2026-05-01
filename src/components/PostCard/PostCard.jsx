import { Link } from 'react-router-dom'
import { Calendar, Folder, Tag, Pin, Clock } from 'lucide-react'
import { formatDate } from '../../utils/posts'
import styles from './PostCard.module.css'

function getReadingTime(content) {
  if (!content) return '1 分钟'
  const chars = content.length
  const minutes = Math.max(1, Math.ceil(chars / 400))
  return `${minutes} 分钟`
}

export default function PostCard({ post }) {
  const slug = post.slug
  const title = post.title || post.frontmatter?.title
  const date = post.date || post.frontmatter?.date
  const category = post.category || post.frontmatter?.category
  const tags = post.tags || post.frontmatter?.tags || []
  const summary = post.summary || post.frontmatter?.summary
  const featured = post.featured || post.frontmatter?.featured
  const content = post.content || post.frontmatter?.content
  const readingTime = getReadingTime(content)

  return (
    <article className={styles.card}>
      {featured && (
        <span className={styles.pinned}>
          <Pin size={12} /> 置顶
        </span>
      )}
      <Link to={`/blog/${slug}`} className={styles.link}>
        <div className={styles.meta}>
          <span className={styles.category}>
            <Folder size={14} />
            {category}
          </span>
          <span className={styles.readingTime}>
            <Clock size={14} />
            {readingTime}
          </span>
          <span className={styles.date}>
            <Calendar size={14} />
            {formatDate(date)}
          </span>
        </div>
        <h3 className={styles.title}>{title}</h3>
        {summary && <p className={styles.summary}>{summary}</p>}
        <div className={styles.footer}>
          <div className={styles.author}>
            <img src="/头像1.png" alt="作者" className={styles.authorAvatar} />
            <span className={styles.authorName}>Blogger</span>
          </div>
          <span className={styles.footerDate}>{formatDate(date)}</span>
        </div>
      </Link>
    </article>
  )
}
