import { useState, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search as SearchIcon, ArrowLeft, Loader } from 'lucide-react'
import Fuse from 'fuse.js'
import PostCard from '../components/PostCard/PostCard'
import useFetch from '../hooks/useFetch'
import { getAllPosts } from '../utils/api'
import styles from './Search.module.css'

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const { data: posts, loading } = useFetch(getAllPosts, [])

  const fuse = useMemo(() => {
    if (!posts) return null
    return new Fuse(posts, {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'summary', weight: 0.3 },
        { name: 'tags', weight: 0.2 },
        { name: 'content', weight: 0.1 },
      ],
      threshold: 0.4,
      includeScore: true,
    })
  }, [posts])

  const results = useMemo(() => {
    if (!query.trim() || !fuse) return []
    return fuse.search(query).map((r) => r.item)
  }, [query, fuse])

  const handleSearch = (e) => {
    const value = e.target.value
    setQuery(value)
    setSearchParams(value ? { q: value } : {})
  }

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
        <Link to="/blog" className={styles.backLink}>
          <ArrowLeft size={18} />
          返回合集
        </Link>

        <h1 className={styles.pageTitle}>搜索文章</h1>

        <div className={styles.searchBox}>
          <SearchIcon size={20} className={styles.searchIcon} />
          <input
            type="text"
            value={query}
            onChange={handleSearch}
            placeholder="输入关键词搜索..."
            className={styles.searchInput}
            autoFocus
          />
        </div>

        {query.trim() && (
          <p className={styles.resultCount}>
            找到 {results.length} 篇相关文章
          </p>
        )}

        <div className={styles.results}>
          {results.length > 0 ? (
            results.map((post) => <PostCard key={post.slug} post={post} />)
          ) : query.trim() ? (
            <div className={styles.empty}>
              <p>没有找到匹配的文章</p>
              <p className={styles.emptyHint}>试试其他关键词？</p>
            </div>
          ) : (
            <div className={styles.empty}>
              <p>输入关键词开始搜索</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
