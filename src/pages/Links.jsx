import { ExternalLink, Globe, Heart, Loader } from 'lucide-react'
import CommentSection from '../components/CommentSection/CommentSection'
import useFetch from '../hooks/useFetch'
import { getAllLinks } from '../utils/api'
import styles from './Links.module.css'

export default function Links() {
  const { data: friends, loading } = useFetch(getAllLinks, [])

  return (
    <div className="container">
      <div className={styles.page}>
        <div className={styles.banner}>
          <h1 className={styles.pageTitle}>邻里</h1>
          <p className={styles.pageDesc}>在互联网的角落，与有趣的灵魂相遇</p>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <Heart size={20} />
            <h2>友情链接</h2>
          </div>
          <p className={styles.sectionDesc}>感谢这些博主的分享与陪伴</p>

          {loading ? (
            <div className={styles.loading}>
              <Loader size={24} className={styles.spinner} />
              <p>加载中...</p>
            </div>
          ) : friends && friends.length > 0 ? (
            <div className={styles.grid}>
              {friends.map((friend) => (
                <a
                  key={friend.id || friend.name}
                  href={friend.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.card}
                >
                  <div className={styles.cardLeft}>
                    {friend.avatar ? (
                      <img
                        src={friend.avatar}
                        alt={friend.name}
                        className={styles.avatar}
                      />
                    ) : (
                      <div className={styles.avatarPlaceholder}>
                        {friend.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className={styles.cardContent}>
                    <div className={styles.cardTitle}>
                      <h3>{friend.name}</h3>
                      <ExternalLink size={14} className={styles.linkIcon} />
                    </div>
                    <p className={styles.cardDesc}>{friend.description}</p>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className={styles.emptyLinks}>
              <p>暂无友情链接，欢迎申请~</p>
            </div>
          )}
        </div>

        <div className={styles.applySection}>
          <div className={styles.applyIcon}>
            <Globe size={32} />
          </div>
          <h3>申请友链</h3>
          <p>欢迎交换友情链接，请在下方留言</p>
          <div className={styles.applyRules}>
            <p>申请格式：</p>
            <ul>
              <li>博客名称：你的博客名字</li>
              <li>博客链接：https://your-blog.com</li>
              <li>博客描述：一句话介绍</li>
              <li>头像链接：你的头像地址</li>
            </ul>
          </div>
        </div>

        <div className={styles.commentSection}>
          <CommentSection slug="friend-links" />
        </div>
      </div>
    </div>
  )
}
