import { Link } from 'react-router-dom'
import { Folder, FileText, Loader } from 'lucide-react'
import useFetch from '../hooks/useFetch'
import { getAllCategories } from '../utils/api'
import styles from './Categories.module.css'

export default function Categories() {
  const { data: categories, loading } = useFetch(getAllCategories, [])

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
        <h1 className={styles.pageTitle}>分类</h1>
        <p className={styles.pageDesc}>按分类浏览所有文章</p>
        <div className={styles.grid}>
          {(categories || []).map((cat) => (
            <Link
              key={cat.name}
              to={`/categories/${cat.name}`}
              className={styles.card}
            >
              <Folder size={32} className={styles.icon} />
              <h3 className={styles.name}>{cat.name}</h3>
              <span className={styles.count}>
                <FileText size={14} />
                {cat.count} 篇文章
              </span>
            </Link>
          ))}
        </div>
        {(categories || []).length === 0 && (
          <div className={styles.empty}>暂无分类</div>
        )}
      </div>
    </div>
  )
}
