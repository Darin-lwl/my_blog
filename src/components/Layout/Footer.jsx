import { Link } from 'react-router-dom'
import { Rss } from 'lucide-react'
import { isLoggedIn } from '../../utils/api'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.footerInner}`}>
        <div className={styles.left}>
          <Link to="/" className={styles.logoLink}>
            <img src="/logo.png" alt="Logo" className={styles.logoImg} />
          </Link>
        </div>
        <div className={styles.links}>
          <Link to="/" className={styles.link}>首页</Link>
          <Link to="/blog" className={styles.link}>拾光集</Link>
          <Link to="/categories" className={styles.link}>光阴故事</Link>
          <Link to="/about" className={styles.link}>关于我</Link>
          <Link to="/links" className={styles.link}>邻里</Link>
          {isLoggedIn() && <Link to="/admin" className={styles.link}>管理</Link>}
        </div>
        <div className={styles.social}>
          <a href="/rss.xml" className={styles.iconLink} title="RSS">
            <Rss size={20} />
          </a>
        </div>
      </div>
    </footer>
  )
}
