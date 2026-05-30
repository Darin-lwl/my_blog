import { MapPin } from 'lucide-react'
import styles from './About.module.css'

export default function About() {
  return (
    <div className="container">
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.avatar}>
            <img src="/头像.png" alt="头像" className={styles.avatarImg} />
          </div>
          <h1 className={styles.name}>林子</h1>
          <p className={styles.bio}>热爱技术与生活的终身学习者</p>
          <div className={styles.location}>
            <MapPin size={16} />
            <span>中国</span>
          </div>
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <h2>关于我</h2>
            <p>
              你好！欢迎来到我的个人博客。我是一个对技术和生活充满好奇的人，
              喜欢探索新事物，记录学习过程中的点滴感悟。
            </p>
            <p>
              这个博客是我的个人空间，用来分享徒步旅行、技术学习笔记、读书心得、
              以及生活中的所见所思。希望我的分享能对你有所启发。
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
