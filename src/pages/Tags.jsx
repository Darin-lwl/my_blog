import { Link } from 'react-router-dom'
import { Tag, Loader } from 'lucide-react'
import useFetch from '../hooks/useFetch'
import { getAllTags } from '../utils/api'
import styles from './Tags.module.css'

export default function Tags() {
  const { data: tags, loading } = useFetch(getAllTags, [])

  if (loading) {
    return (
      <div className={styles.loading}>
        <Loader size={32} className={styles.spinner} />
        <p>加载中...</p>
      </div>
    )
  }

  return (
    <div className="container">
      <div className={styles.page}>
        <h1 className={styles.pageTitle}>标签</h1>
        <p className={styles.pageDesc}>按标签浏览所有文章</p>
        <div className={styles.cloud}>
          {(tags || []).map((tag) => (
            <Link
              key={tag.name}
              to={`/tags/${tag.name}`}
              className={styles.tagItem}
            >
              <Tag size={16} />
              <span className={styles.tagName}>{tag.name}</span>
              <span className={styles.tagCount}>{tag.count}</span>
            </Link>
          ))}
        </div>
        {(tags || []).length === 0 && (
          <div className={styles.empty}>暂无标签</div>
        )}
      </div>
    </div>
  )
}
