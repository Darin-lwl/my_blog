import { useParams, Link } from 'react-router-dom'
import { Calendar, Folder, Tag, ArrowLeft, Loader } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import useFetch from '../hooks/useFetch'
import { getPostBySlug } from '../utils/api'
import { formatDate } from '../utils/posts'
import CommentSection from '../components/CommentSection/CommentSection'
import styles from './Post.module.css'

function normalizeContent(content) {
  if (!content) return ''
  return content.replace(/\n(?!\n)/g, '\n\n')
}

export default function Post() {
  const { slug } = useParams()
  const { data: post, loading, error } = useFetch(() => getPostBySlug(slug), [slug])

  if (loading) {
    return (
      <div className={styles.loading}>
        <Loader size={32} className={styles.spinner} />
        <p>加载中...</p>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="container">
        <div className={styles.notFound}>
          <h1>文章未找到</h1>
          <p>抱歉，你访问的文章不存在。</p>
          <Link to="/blog" className={styles.backLink}>
            <ArrowLeft size={18} />
            返回博客列表
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <article className={styles.article}>
        <Link to="/blog" className={styles.backLink}>
          <ArrowLeft size={18} />
          返回列表
        </Link>

        <header className={styles.header}>
          <h1 className={styles.title}>{post.title}</h1>
          <div className={styles.meta}>
            <span className={styles.metaItem}>
              <Calendar size={16} />
              {formatDate(post.date)}
            </span>
            <Link to={`/categories/${post.category}`} className={styles.metaItem}>
              <Folder size={16} />
              {post.category}
            </Link>
          </div>
          {(post.tags || []).length > 0 && (
            <div className={styles.tags}>
              <Tag size={16} />
              {post.tags.map((tag) => (
                <Link key={tag} to={`/tags/${tag}`} className={styles.tag}>
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </header>

        <div className={`${styles.content} markdown-body`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
            {normalizeContent(post.content)}
          </ReactMarkdown>
        </div>

        <CommentSection />
      </article>
    </div>
  )
}
