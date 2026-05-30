import { Link } from 'react-router-dom'
import { Calendar, Loader } from 'lucide-react'
import useFetch from '../hooks/useFetch'
import { getAllPosts } from '../utils/api'
import styles from './Categories.module.css'

export default function Categories() {
  const { data: allPosts, loading } = useFetch(getAllPosts, [])

  if (loading) {
    return (
      <div className={styles.loading}>
        <Loader size={32} className={styles.spinner} />
        <p>加载中...</p>
      </div>
    )
  }

  const posts = allPosts || []

  // 按年分组
  const postsByYear = {}
  posts.forEach(post => {
    const year = new Date(post.date).getFullYear()
    if (!postsByYear[year]) postsByYear[year] = []
    postsByYear[year].push(post)
  })

  // 按年份倒序排列
  const sortedYears = Object.keys(postsByYear)
    .sort((a, b) => b - a)
    .map(year => ({
      year,
      posts: postsByYear[year].sort((a, b) => new Date(b.date) - new Date(a.date))
    }))

  const formatDateShort = (dateStr) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  return (
    <div className="container">
      <div className={styles.page}>
        <h1 className={styles.pageTitle}>光阴故事</h1>
        <p className={styles.pageDesc}>时间是最好的记录者</p>

        {sortedYears.length > 0 ? (
          <div className={styles.timeline}>
            {sortedYears.map(({ year, posts: yearPosts }) => (
              <div key={year} className={styles.yearSection}>
                <div className={styles.yearHeader}>
                  <span className={styles.yearBadge}>{year}</span>
                  <span className={styles.yearCount}>{yearPosts.length} 篇</span>
                </div>
                <div className={styles.postList}>
                  {yearPosts.map(post => (
                    <Link
                      key={post.slug}
                      to={`/blog/${post.slug}`}
                      className={styles.postItem}
                    >
                      <span className={styles.postDate}>
                        <Calendar size={14} />
                        {formatDateShort(post.date)}
                      </span>
                      <span className={styles.postTitle}>{post.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>暂无文章</div>
        )}
      </div>
    </div>
  )
}
