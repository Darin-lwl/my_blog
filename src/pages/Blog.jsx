import { useParams, Link } from 'react-router-dom'
import { ArrowRight, Loader } from 'lucide-react'
import PostCard from '../components/PostCard/PostCard'
import useFetch from '../hooks/useFetch'
import { getAllPosts, getAllCategories } from '../utils/api'
import styles from './Blog.module.css'

export default function Blog() {
  const { category, tag } = useParams()
  const { data: allPosts, loading: postsLoading } = useFetch(getAllPosts, [])
  const { data: categories, loading: catsLoading } = useFetch(getAllCategories, [])

  const loading = postsLoading || catsLoading

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

  // 如果是筛选某个分类或标签，显示筛选结果
  if (category || tag) {
    let pageTitle = category ? `分类：${category}` : `标签：${tag}`
    return (
      <div className="container">
        <div className={styles.page}>
          <Link to="/blog" className={styles.backLink}>
            <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} />
            返回拾光集
          </Link>
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
      </div>
    )
  }

  // 使用从 API 获取的分类信息
  const categoryList = (categories || []).filter(c => c.count > 0)

  return (
    <div className="container">
      <div className={styles.page}>
        <div className={styles.banner}>
          <h1 className={styles.pageTitle}>拾光集</h1>
          <p className={styles.pageDesc}>将时光碎片编织成诗，每一篇都是岁月的注脚</p>
        </div>

        {categoryList.length > 0 ? (
          <div className={styles.categoryGrid}>
            {categoryList.map((cat) => (
              <Link
                key={cat.name}
                to={`/categories/${cat.name}`}
                className={styles.categoryCard}
              >
                <div className={styles.cardIcon}>
                  <span className={styles.iconEmoji}>{cat.icon || '📄'}</span>
                </div>
                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>{cat.name}</h3>
                  <p className={styles.cardDesc}>
                    {cat.description || '记录生活的点点滴滴'}
                  </p>
                </div>
                <div className={styles.cardMeta}>
                  <span className={styles.cardCount}>{cat.count}</span>
                  <span className={styles.cardLabel}>篇文章</span>
                  <ArrowRight size={16} className={styles.cardArrow} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <p>暂无文章</p>
          </div>
        )}
      </div>
    </div>
  )
}
