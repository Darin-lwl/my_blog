import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Tag, Folder, Loader } from 'lucide-react'
import PostCard from '../components/PostCard/PostCard'
import useFetch from '../hooks/useFetch'
import { getAllPosts, getAllTags, getAllCategories } from '../utils/api'
import styles from './Home.module.css'

export default function Home() {
  const { data: posts, loading } = useFetch(getAllPosts, [])
  const { data: tags } = useFetch(getAllTags, [])
  const { data: categories } = useFetch(getAllCategories, [])

  if (loading) {
    return (
      <div className={styles.loading}>
        <Loader size={32} className={styles.spinner} />
        <p>加载中...</p>
      </div>
    )
  }

  const allPosts = posts || []
  const allTags = tags || []
  const allCategories = categories || []
  const recentPosts = allPosts.slice(0, 6)

  return (
    <div>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroContent}>
            <div className={styles.avatar}>
              <img src="/头像1.png" alt="头像" className={styles.avatarImg} />
            </div>
            <h1 className={styles.heroTitle}>
              你好，我是 <span className="gradient-text">林子</span>
            </h1>
            <p className={styles.heroSubtitle}>
              记录技术与生活的点滴，分享学习与成长的感悟
            </p>
            <div className={styles.heroActions}>
              <Link to="/blog" className={styles.btnPrimary}>
                <BookOpen size={18} />
                阅读博客
              </Link>
              <Link to="/about" className={styles.btnSecondary}>
                了解更多
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className={styles.stats}>
        <div className="container">
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <BookOpen size={24} className={styles.statIcon} />
              <span className={styles.statNumber}>{allPosts.length}</span>
              <span className={styles.statLabel}>篇文章</span>
            </div>
            <div className={styles.statCard}>
              <Folder size={24} className={styles.statIcon} />
              <span className={styles.statNumber}>{allCategories.length}</span>
              <span className={styles.statLabel}>个分类</span>
            </div>
            <div className={styles.statCard}>
              <Tag size={24} className={styles.statIcon} />
              <span className={styles.statNumber}>{allTags.length}</span>
              <span className={styles.statLabel}>个标签</span>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Posts */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>最新文章</h2>
            <Link to="/blog" className={styles.viewAll}>
              查看全部 <ArrowRight size={16} />
            </Link>
          </div>
          <div className={styles.postsGrid}>
            {recentPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
          {allPosts.length === 0 && (
            <div className={styles.empty}>
              <p>暂无文章，去管理后台写一篇吧！</p>
              <Link to="/admin" className={styles.btnPrimary} style={{ marginTop: 16 }}>
                写文章
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Tags Cloud */}
      {allTags.length > 0 && (
        <section className={styles.section}>
          <div className="container">
            <h2 className={styles.sectionTitle}>热门标签</h2>
            <div className={styles.tagsCloud}>
              {allTags.map((tag) => (
                <Link
                  key={tag.name}
                  to={`/tags/${tag.name}`}
                  className={styles.tagChip}
                >
                  {tag.name}
                  <span className={styles.tagCount}>{tag.count}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
