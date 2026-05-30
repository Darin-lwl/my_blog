import { Link } from 'react-router-dom'
import { Loader } from 'lucide-react'
import PostCard from '../components/PostCard/PostCard'
import useFetch from '../hooks/useFetch'
import { getAllPosts } from '../utils/api'
import styles from './Home.module.css'

export default function Home() {
  const { data: posts, loading } = useFetch(getAllPosts, [])

  if (loading) {
    return (
      <div className={styles.loading}>
        <Loader size={32} className={styles.spinner} />
        <p>加载中...</p>
      </div>
    )
  }

  const allPosts = posts || []
  const featuredPosts = allPosts.filter(p => p.featured && p.coverImage).slice(0, 3)
  const recentPosts = allPosts.slice(0, 5)

  return (
    <div>
      {/* Slogan */}
      <section className={styles.slogan}>
        <div className="container">
          <div className={styles.sloganInner}>
            <p className={styles.sloganText}>"入林，见雅，归苑"</p>
            <span className={styles.sloganLine} />
          </div>
        </div>
      </section>

      {/* Featured */}
      {featuredPosts.length > 0 && (
        <section className={styles.featured}>
          <div className="container">
            <div className={styles.featuredGrid}>
              {featuredPosts[0] && (
                <Link to={`/blog/${featuredPosts[0].slug}`} className={styles.featuredLarge}>
                  <img src={featuredPosts[0].coverImage} alt={featuredPosts[0].title} />
                  <h3 className={styles.featuredTitle}>{featuredPosts[0].title}</h3>
                </Link>
              )}
              <div className={styles.featuredRight}>
                {featuredPosts[1] && (
                  <Link to={`/blog/${featuredPosts[1].slug}`} className={styles.featuredSmall}>
                    <img src={featuredPosts[1].coverImage} alt={featuredPosts[1].title} />
                    <h3 className={styles.featuredTitle}>{featuredPosts[1].title}</h3>
                  </Link>
                )}
                {featuredPosts[2] && (
                  <Link to={`/blog/${featuredPosts[2].slug}`} className={styles.featuredSmall}>
                    <img src={featuredPosts[2].coverImage} alt={featuredPosts[2].title} />
                    <h3 className={styles.featuredTitle}>{featuredPosts[2].title}</h3>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Post List */}
      <section className={styles.postsSection}>
        <div className="container">
          {recentPosts.length > 0 ? (
            <>
              <div className={styles.postList}>
                {recentPosts.map((post) => (
                  <PostCard key={post.slug} post={post} />
                ))}
              </div>
              {allPosts.length > 5 && (
                <div className={styles.loadMore}>
                  <Link to="/blog" className={styles.loadMoreBtn}>
                    点击查看更多
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className={styles.empty}>
              <p>暂无文章，去管理后台写一篇吧！</p>
              <Link to="/admin" className={styles.emptyBtn}>
                写文章
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
