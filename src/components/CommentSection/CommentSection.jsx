import { useEffect, useRef } from 'react'
import styles from './CommentSection.module.css'

// Giscus configuration
// To set up Giscus:
// 1. Go to https://giscus.app/
// 2. Enter your GitHub repo details
// 3. Copy the configuration and update the values below
const GISCUS_CONFIG = {
  repo: 'YOUR_USERNAME/YOUR_REPO', // Replace with your GitHub repo
  repoId: 'YOUR_REPO_ID',          // Replace with your repo ID
  category: 'Announcements',        // Replace with your category
  categoryId: 'YOUR_CATEGORY_ID',  // Replace with your category ID
  mapping: 'pathname',
  strict: '0',
  reactionsEnabled: '1',
  emitMetadata: '0',
  inputPosition: 'top',
  theme: 'dark_dimmed',
  lang: 'zh-CN',
}

export default function CommentSection() {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Check if Giscus is already loaded
    if (containerRef.current.querySelector('iframe.giscus-frame')) return

    // Check if config is set up
    if (GISCUS_CONFIG.repo === 'YOUR_USERNAME/YOUR_REPO') {
      return
    }

    const script = document.createElement('script')
    script.src = 'https://giscus.app/client.js'
    script.setAttribute('data-repo', GISCUS_CONFIG.repo)
    script.setAttribute('data-repo-id', GISCUS_CONFIG.repoId)
    script.setAttribute('data-category', GISCUS_CONFIG.category)
    script.setAttribute('data-category-id', GISCUS_CONFIG.categoryId)
    script.setAttribute('data-mapping', GISCUS_CONFIG.mapping)
    script.setAttribute('data-strict', GISCUS_CONFIG.strict)
    script.setAttribute('data-reactions-enabled', GISCUS_CONFIG.reactionsEnabled)
    script.setAttribute('data-emit-metadata', GISCUS_CONFIG.emitMetadata)
    script.setAttribute('data-input-position', GISCUS_CONFIG.inputPosition)
    script.setAttribute('data-theme', GISCUS_CONFIG.theme)
    script.setAttribute('data-lang', GISCUS_CONFIG.lang)
    script.setAttribute('crossorigin', 'anonymous')
    script.async = true

    containerRef.current.appendChild(script)

    return () => {
      // Cleanup
      const giscusFrame = containerRef.current?.querySelector('iframe.giscus-frame')
      if (giscusFrame) {
        giscusFrame.remove()
      }
    }
  }, [])

  // Don't render if Giscus is not configured
  if (GISCUS_CONFIG.repo === 'YOUR_USERNAME/YOUR_REPO') {
    return (
      <div className={styles.section}>
        <h3 className={styles.title}>评论</h3>
        <div className={styles.placeholder}>
          <p>评论功能需要配置 Giscus</p>
          <p className={styles.hint}>
            请访问 <a href="https://giscus.app/" target="_blank" rel="noopener noreferrer">giscus.app</a> 获取配置信息，
            然后更新 <code>src/components/CommentSection/CommentSection.jsx</code> 中的配置。
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.section}>
      <h3 className={styles.title}>评论</h3>
      <div ref={containerRef} className={styles.giscus} />
    </div>
  )
}
