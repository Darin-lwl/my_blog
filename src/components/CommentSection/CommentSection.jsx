import { useState, useEffect, useCallback } from 'react'
import { MessageSquare, Send, Reply, ChevronDown, ChevronUp } from 'lucide-react'
import { getComments, submitComment } from '../../utils/api'
import styles from './CommentSection.module.css'

export default function CommentSection({ slug }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [nickname, setNickname] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)
  const [replyTo, setReplyTo] = useState(null)
  const [expandedReplies, setExpandedReplies] = useState({})

  const loadComments = useCallback(async () => {
    try {
      const data = await getComments(slug)
      setComments(data)
    } catch (err) {
      console.error('加载评论失败:', err)
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    if (slug) loadComments()
  }, [slug, loadComments])

  // 从 localStorage 恢复昵称
  useEffect(() => {
    const saved = localStorage.getItem('comment_nickname')
    if (saved) setNickname(saved)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nickname.trim() || !content.trim()) return

    setSubmitting(true)
    setMessage(null)

    try {
      const result = await submitComment({
        slug,
        nickname: nickname.trim(),
        content: content.trim(),
        parentId: replyTo || 0,
      })
      localStorage.setItem('comment_nickname', nickname.trim())
      setMessage({ type: 'success', text: result.message || '评论已提交' })
      setContent('')
      setReplyTo(null)
      loadComments()
    } catch (err) {
      setMessage({ type: 'error', text: err.message || '提交失败' })
    } finally {
      setSubmitting(false)
    }
  }

  const toggleReplies = (commentId) => {
    setExpandedReplies(prev => ({ ...prev, [commentId]: !prev[commentId] }))
  }

  // 构建评论树
  const buildCommentTree = () => {
    const roots = []
    const childMap = {}

    comments.forEach(c => {
      if (c.parent_id === 0) {
        roots.push(c)
      } else {
        if (!childMap[c.parent_id]) childMap[c.parent_id] = []
        childMap[c.parent_id].push(c)
      }
    })

    return { roots, childMap }
  }

  const { roots, childMap } = buildCommentTree()

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes} 分钟前`
    if (hours < 24) return `${hours} 小时前`
    if (days < 30) return `${days} 天前`
    return date.toLocaleDateString('zh-CN')
  }

  const renderComment = (comment, isReply = false) => {
    const replies = childMap[comment.id] || []
    const isExpanded = expandedReplies[comment.id]

    return (
      <div key={comment.id} className={`${styles.comment} ${isReply ? styles.reply : ''}`}>
        <div className={styles.commentHeader}>
          <span className={styles.nickname}>{comment.nickname}</span>
          <span className={styles.time}>{formatDate(comment.created_at)}</span>
        </div>
        <div className={styles.commentContent}>{comment.content}</div>
        <div className={styles.commentActions}>
          {!isReply && (
            <button
              className={styles.replyBtn}
              onClick={() => {
                setReplyTo(comment.id)
                document.querySelector(`.${styles.form}`)?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <Reply size={14} />
              回复
            </button>
          )}
          {replies.length > 0 && (
            <button
              className={styles.toggleBtn}
              onClick={() => toggleReplies(comment.id)}
            >
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {replies.length} 条回复
            </button>
          )}
        </div>
        {isExpanded && replies.length > 0 && (
          <div className={styles.replies}>
            {replies.map(r => renderComment(r, true))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={styles.section}>
      <h3 className={styles.title}>
        <MessageSquare size={20} />
        评论
        {comments.length > 0 && <span className={styles.count}>{comments.length}</span>}
      </h3>

      {/* 评论表单 */}
      <form className={styles.form} onSubmit={handleSubmit}>
        {replyTo && (
          <div className={styles.replyHint}>
            回复评论 #{replyTo}
            <button type="button" className={styles.cancelReply} onClick={() => setReplyTo(null)}>
              取消
            </button>
          </div>
        )}
        <div className={styles.inputRow}>
          <input
            type="text"
            className={styles.input}
            placeholder="昵称 *"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
            maxLength={20}
          />
        </div>
        <textarea
          className={styles.textarea}
          placeholder="写下你的评论... *"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          minLength={2}
          maxLength={1000}
          rows={4}
        />
        <div className={styles.formFooter}>
          <span className={styles.hint}>无需登录，直接评论</span>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={submitting || !nickname.trim() || content.trim().length < 2}
          >
            <Send size={16} />
            {submitting ? '提交中...' : '发表评论'}
          </button>
        </div>
      </form>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      {/* 评论列表 */}
      {loading ? (
        <div className={styles.loading}>加载中...</div>
      ) : roots.length === 0 ? (
        <div className={styles.empty}>
          <MessageSquare size={32} />
          <p>还没有评论，来发表第一条吧</p>
        </div>
      ) : (
        <div className={styles.list}>
          {roots.map(comment => renderComment(comment))}
        </div>
      )}
    </div>
  )
}
