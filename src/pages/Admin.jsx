import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Plus, Eye, Save, Trash2, Edit3, Send,
  ArrowLeft, LogOut, Loader, ToggleLeft, ToggleRight, Image
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { getAdminPosts, createPost, updatePost, deletePost, logout } from '../utils/api'
import { formatDate } from '../utils/posts'
import styles from './Admin.module.css'

const emptyForm = {
  title: '',
  date: new Date().toISOString().split('T')[0],
  category: '随笔',
  tags: '',
  summary: '',
  content: '',
  featured: false,
  draft: true,
}

export default function Admin() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)
  const [view, setView] = useState('list') // list | editor | preview
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingSlug, setEditingSlug] = useState(null)
  const [toast, setToast] = useState('')

  // Load posts
  const loadPosts = async () => {
    try {
      const data = await getAdminPosts()
      setPosts(data)
    } catch (err) {
      if (err.message.includes('未登录') || err.message.includes('过期')) {
        navigate('/admin/login')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPosts() }, [])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // New post
  const handleNew = () => {
    setForm(emptyForm)
    setEditingSlug(null)
    setView('editor')
  }

  // Edit post
  const handleEdit = (post) => {
    setForm({
      title: post.title,
      date: post.date,
      category: post.category,
      tags: (post.tags || []).join(', '),
      summary: post.summary || '',
      content: post.content || '',
      featured: post.featured || false,
      draft: post.draft || false,
    })
    setEditingSlug(post.slug)
    setView('editor')
  }

  // Save post (create or update)
  const handleSave = async () => {
    if (!form.title.trim()) {
      alert('请填写文章标题')
      return
    }

    setSaving(true)
    try {
      const postData = {
        ...form,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      }

      if (editingSlug) {
        await updatePost(editingSlug, postData)
        showToast('文章已更新')
      } else {
        await createPost(postData)
        showToast('文章已创建')
      }

      await loadPosts()
      setView('list')
    } catch (err) {
      alert('保存失败: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // Publish (set draft to false and save)
  const handlePublish = async () => {
    if (!form.title.trim()) {
      alert('请填写文章标题')
      return
    }

    setSaving(true)
    try {
      const postData = {
        ...form,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        draft: false,
      }

      if (editingSlug) {
        await updatePost(editingSlug, postData)
      } else {
        await createPost(postData)
      }

      showToast('文章已发布')
      await loadPosts()
      setView('list')
    } catch (err) {
      alert('发布失败: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // Toggle draft status
  const handleToggleDraft = async (post) => {
    try {
      await updatePost(post.slug, { draft: !post.draft })
      showToast(post.draft ? '已发布' : '已转为草稿')
      await loadPosts()
    } catch (err) {
      alert('操作失败: ' + err.message)
    }
  }

  // Delete post
  const handleDelete = async (slug) => {
    if (!confirm('确定删除这篇文章？此操作不可恢复。')) return
    try {
      await deletePost(slug)
      showToast('文章已删除')
      await loadPosts()
    } catch (err) {
      alert('删除失败: ' + err.message)
    }
  }

  // Logout
  const handleLogout = () => {
    logout()
    navigate('/')
  }

  // Image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const token = localStorage.getItem('admin_token')
      const formData = new FormData()
      formData.append('image', file)

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '上传失败')
      }

      const data = await res.json()

      // Insert image markdown at cursor position
      const textarea = textareaRef.current
      const imageMarkdown = `![${file.name}](${data.url})`

      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const before = form.content.slice(0, start)
        const after = form.content.slice(end)
        const newContent = before + imageMarkdown + after
        updateForm('content', newContent)

        // Restore cursor position after image
        setTimeout(() => {
          textarea.focus()
          const newPos = start + imageMarkdown.length
          textarea.setSelectionRange(newPos, newPos)
        }, 0)
      } else {
        updateForm('content', form.content + '\n' + imageMarkdown)
      }

      showToast('图片已上传')
    } catch (err) {
      alert('上传失败: ' + err.message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className={styles.loading}>
        <Loader size={32} className={styles.spinner} />
        <p>加载中...</p>
      </div>
    )
  }

  // ===== List View =====
  if (view === 'list') {
    return (
      <div className="container">
        <div className={styles.page}>
          <div className={styles.header}>
            <h1 className={styles.pageTitle}>
              <FileText size={24} />
              文章管理
            </h1>
            <div className={styles.actions}>
              <button className={styles.btnOutline} onClick={handleLogout}>
                <LogOut size={16} />
                退出
              </button>
              <button className={styles.btnPublish} onClick={handleNew}>
                <Plus size={16} />
                写新文章
              </button>
            </div>
          </div>

          {toast && <div className={styles.toast}>{toast}</div>}

          {posts.length === 0 ? (
            <div className={styles.empty}>
              <p>还没有文章</p>
              <button className={styles.btnPublish} onClick={handleNew} style={{ marginTop: 16 }}>
                <Plus size={16} />
                写第一篇文章
              </button>
            </div>
          ) : (
            <div className={styles.postList}>
              {posts.map((post) => (
                <div key={post.slug} className={styles.postItem}>
                  <div className={styles.postInfo}>
                    <div className={styles.postTitleRow}>
                      <h3 className={styles.postTitle}>{post.title}</h3>
                      {post.draft && <span className={styles.draftBadge}>草稿</span>}
                    </div>
                    <div className={styles.postMeta}>
                      <span>{formatDate(post.date)}</span>
                      <span>·</span>
                      <span>{post.category}</span>
                      {(post.tags || []).length > 0 && (
                        <>
                          <span>·</span>
                          <span>{post.tags.join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className={styles.postActions}>
                    <button
                      className={styles.iconBtn}
                      onClick={() => handleToggleDraft(post)}
                      title={post.draft ? '发布' : '转为草稿'}
                    >
                      {post.draft ? <ToggleLeft size={18} /> : <ToggleRight size={18} />}
                    </button>
                    <button
                      className={styles.iconBtn}
                      onClick={() => handleEdit(post)}
                      title="编辑"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                      onClick={() => handleDelete(post.slug)}
                      title="删除"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ===== Editor View =====
  return (
    <div className="container">
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.btnOutline} onClick={() => setView('list')}>
            <ArrowLeft size={16} />
            返回列表
          </button>
          <h1 className={styles.pageTitle}>
            {editingSlug ? '编辑文章' : '写新文章'}
          </h1>
          <div className={styles.actions}>
            <button
              className={styles.btnOutline}
              onClick={() => setView(view === 'preview' ? 'editor' : 'preview')}
            >
              <Eye size={16} />
              {view === 'preview' ? '编辑' : '预览'}
            </button>
            <button className={styles.btnSave} onClick={handleSave} disabled={saving}>
              <Save size={16} />
              {saving ? '保存中...' : '保存草稿'}
            </button>
            <button className={styles.btnPublish} onClick={handlePublish} disabled={saving}>
              <Send size={16} />
              {saving ? '发布中...' : '发布文章'}
            </button>
          </div>
        </div>

        {toast && <div className={styles.toast}>{toast}</div>}

        {view === 'preview' ? (
          /* Preview */
          <div className={styles.previewPanel}>
            <div className={styles.previewContent}>
              <h1 className={styles.previewTitle}>{form.title || '未命名文章'}</h1>
              <div className={styles.previewMeta}>
                {form.date} · {form.category}
                {form.tags && ` · ${form.tags}`}
              </div>
              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {form.content || '*暂无内容...*'}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ) : (
          /* Editor */
          <div className={styles.editorLayout}>
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>文章信息</h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>标题 *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => updateForm('title', e.target.value)}
                    placeholder="文章标题"
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>日期</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => updateForm('date', e.target.value)}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>分类</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => updateForm('category', e.target.value)}
                    placeholder="如：技术、随笔、读书"
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>标签（逗号分隔）</label>
                  <input
                    type="text"
                    value={form.tags}
                    onChange={(e) => updateForm('tags', e.target.value)}
                    placeholder="如：React, JavaScript, 前端"
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroupFull}>
                  <label>摘要</label>
                  <input
                    type="text"
                    value={form.summary}
                    onChange={(e) => updateForm('summary', e.target.value)}
                    placeholder="一句话描述文章内容"
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={form.featured}
                      onChange={(e) => updateForm('featured', e.target.checked)}
                    />
                    设为精选文章
                  </label>
                </div>
              </div>
            </div>

            <div className={styles.formSection}>
              <div className={styles.editorToolbar}>
                <h3 className={styles.sectionTitle}>文章内容（Markdown）</h3>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <button
                  className={styles.btnOutline}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Image size={16} />
                  {uploading ? '上传中...' : '上传图片'}
                </button>
              </div>
              <textarea
                ref={textareaRef}
                value={form.content}
                onChange={(e) => updateForm('content', e.target.value)}
                placeholder="在这里用 Markdown 写文章内容...&#10;&#10;支持标题、列表、代码块、图片等格式&#10;&#10;点击「上传图片」按钮可插入图片"
                className={styles.textarea}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
