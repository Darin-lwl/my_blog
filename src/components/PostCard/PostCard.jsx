import { Link } from 'react-router-dom'
import { Calendar, Eye, MessageCircle, Pin } from 'lucide-react'
import { formatDate } from '../../utils/posts'
import styles from './PostCard.module.css'

export default function PostCard({ post }) {
  const slug = post.slug
  const title = post.title || post.frontmatter?.title
  const date = post.date || post.frontmatter?.date
  const summary = post.summary || post.frontmatter?.summary
  const featured = post.featured || post.frontmatter?.featured
  const coverImage = post.coverImage || post.frontmatter?.coverImage
  const views = post.views ?? 0
  const comments = post.comments ?? 0

  return (
    <article className={styles.item}>
      <Link to={`/blog/${slug}`} className={styles.link}>
        <div className={styles.body}>
          <h3 className={styles.title}>
            {featured && (
              <span className={styles.pinned}>
                <Pin size={12} />
              </span>
            )}
            {title}
          </h3>
          {summary && <p className={styles.summary}>{summary}</p>}
          <div className={styles.meta}>
            <span className={styles.metaItem}>
              <Calendar size={14} />
              {formatDate(date)}
            </span>
            <span className={styles.metaItem}>
              <Eye size={14} />
              {views} 阅读
            </span>
            <span className={styles.metaItem}>
              <MessageCircle size={14} />
              {comments} 评论
            </span>
          </div>
        </div>
        {coverImage && (
          <div className={styles.cover}>
            <img src={coverImage} alt={title} />
          </div>
        )}
      </Link>
    </article>
  )
}
