import { useParams, Link } from 'react-router-dom'
import { Folder, Tag, Loader } from 'lucide-react'
import PostCard from '../components/PostCard/PostCard'
import useFetch from '../hooks/useFetch'
import { getAllPosts, getAllCategories, getAllTags } from '../utils/api'
import styles from './Blog.module.css'

export default function Blog() {
  const { category, tag } = useParams()
  const { data: allPosts, loading } = useFetch(getAllPosts, [])
  const { data: categories } = useFetch(getAllCategories, [])
  const { data: tags } = useFetch(getAllTags, [])

  if (loading) {
    return (
      <div className={styles.loading}>
        <Loader size={32} className={styles.spinner} />
        <p>加载中...</p>
      </div>
    )
  }

  const posts = (allPosts || []).filter((post) => {
    if (category) return post.category === category
    if (tag) return (post.tags || []).includes(tag)
    return true
  })

  let pageTitle = '全部文章'
  if (category) pageTitle = `分类：${category}`
  if (tag) pageTitle = `标签：${tag}`

  return (
    <div className="container">
      <div className={styles.layout}>
        <div className={styles.main}>
          <h1 className={styles.pageTitle}>{pageTitle}</h1>
          <p className={styles.pageCount}>共 {posts.length} 篇文章</p>
          <div className={styles.postsGrid}>
            {posts.length > 0 ? (
              posts.map((post) => <PostCard key={post.slug} post={post} />)
            ) : (
              <div className={styles.empty}>
                <p>暂无文章</p>
              </div>
            )}
          </div>
        </div>

        <aside className={styles.sidebar}>
          {(categories || []).length > 0 && (
            <div className={styles.sidebarSection}>
              <h3 className={styles.sidebarTitle}>
                <Folder size={18} />
                分类
              </h3>
              <div className={styles.sidebarList}>
                {(categories || []).map((cat) => (
                  <Link
                    key={cat.name}
                    to={`/categories/${cat.name}`}
                    className={`${styles.sidebarItem} ${category === cat.name ? styles.sidebarActive : ''}`}
                  >
                    <span>{cat.name}</span>
                    <span className={styles.count}>{cat.count}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {(tags || []).length > 0 && (
            <div className={styles.sidebarSection}>
              <h3 className={styles.sidebarTitle}>
                <Tag size={18} />
                标签
              </h3>
              <div className={styles.tagsCloud}>
                {(tags || []).map((t) => (
                  <Link
                    key={t.name}
                    to={`/tags/${t.name}`}
                    className={`${styles.tagChip} ${tag === t.name ? styles.tagActive : ''}`}
                  >
                    {t.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
