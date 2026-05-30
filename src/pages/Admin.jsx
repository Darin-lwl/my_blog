import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Plus, Eye, Save, Trash2, Edit3, Send,
  ArrowLeft, LogOut, Loader, ToggleLeft, ToggleRight, Image,
  MessageSquare, CheckCircle, XCircle, Link2, ExternalLink, FolderOpen
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import {
  getAdminPosts, createPost, updatePost, deletePost, logout,
  getAdminComments, updateCommentStatus, deleteComment,
  getAdminLinks, createLink, updateLink, deleteLink,
  getAdminCategories, createCategory, updateCategory, deleteCategory
} from '../utils/api'
import { formatDate } from '../utils/posts'
import styles from './Admin.module.css'

const emptyForm = {
  title: '',
  date: new Date().toISOString().split('T')[0],
  category: '随笔',
  tags: '',
  summary: '',
  content: '',
  coverImage: '',
  featured: false,
  draft: true,
}

export default function Admin() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const coverInputRef = useRef(null)
  const textareaRef = useRef(null)
  const [view, setView] = useState('list') // list | editor | preview | comments | links | categoryEditor
  const [tab, setTab] = useState('posts') // posts | comments | links | categories
  const [posts, setPosts] = useState([])
  const [comments, setComments] = useState([])
  const [links, setLinks] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editingSlug, setEditingSlug] = useState(null)
  const [toast, setToast] = useState('')
  const [linkForm, setLinkForm] = useState({ name: '', url: '', avatar: '', description: '' })
  const [editingLink, setEditingLink] = useState(null)
  const [categoryForm, setCategoryForm] = useState({ name: '', icon: '📄', description: '' })
  const [editingCategory, setEditingCategory] = useState(null)

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

  // Load comments
  const loadComments = async () => {
    try {
      const data = await getAdminComments()
      setComments(data)
    } catch (err) {
      if (err.message.includes('未登录') || err.message.includes('过期')) {
        navigate('/admin/login')
      }
    }
  }

  useEffect(() => {
    if (tab === 'comments') loadComments()
  }, [tab])

  // Load links
  const loadLinks = async () => {
    try {
      const data = await getAdminLinks()
      setLinks(data)
    } catch (err) {
      if (err.message.includes('未登录') || err.message.includes('过期')) {
        navigate('/admin/login')
      }
    }
  }

  useEffect(() => {
    if (tab === 'links') loadLinks()
  }, [tab])

  // Load categories
  const loadCategories = async () => {
    try {
      const data = await getAdminCategories()
      setCategories(data)
    } catch (err) {
      if (err.message.includes('未登录') || err.message.includes('过期')) {
        navigate('/admin/login')
      }
    }
  }

  useEffect(() => {
    if (tab === 'categories') loadCategories()
  }, [tab])

  // Load categories for post editor
  useEffect(() => {
    if (view === 'editor') {
      getAdminCategories().then(data => setCategories(data)).catch(() => {})
    }
  }, [view])

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
      coverImage: post.coverImage || '',
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

  // Link management
  const handleNewLink = () => {
    setLinkForm({ name: '', url: '', avatar: '', description: '' })
    setEditingLink(null)
    setView('linkEditor')
  }

  const handleEditLink = (link) => {
    setLinkForm({
      name: link.name,
      url: link.url,
      avatar: link.avatar || '',
      description: link.description || '',
    })
    setEditingLink(link.id)
    setView('linkEditor')
  }

  const handleSaveLink = async () => {
    if (!linkForm.name.trim() || !linkForm.url.trim()) {
      alert('请填写名称和链接')
      return
    }

    setSaving(true)
    try {
      if (editingLink) {
        await updateLink(editingLink, linkForm)
        showToast('友链已更新')
      } else {
        await createLink(linkForm)
        showToast('友链已添加')
      }
      await loadLinks()
      setView('list')
    } catch (err) {
      alert('保存失败: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleLinkVisible = async (link) => {
    try {
      await updateLink(link.id, { visible: !link.visible })
      showToast(link.visible ? '已隐藏' : '已显示')
      await loadLinks()
    } catch (err) {
      alert('操作失败: ' + err.message)
    }
  }

  const handleDeleteLink = async (id) => {
    if (!confirm('确定删除这个友链？')) return
    try {
      await deleteLink(id)
      showToast('友链已删除')
      await loadLinks()
    } catch (err) {
      alert('删除失败: ' + err.message)
    }
  }

  // Category management
  const handleNewCategory = () => {
    setCategoryForm({ name: '', icon: '📄', description: '' })
    setEditingCategory(null)
    setView('categoryEditor')
  }

  const handleEditCategory = (category) => {
    setCategoryForm({
      name: category.name,
      icon: category.icon || '📄',
      description: category.description || '',
    })
    setEditingCategory(category.id)
    setView('categoryEditor')
  }

  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      alert('请填写分类名称')
      return
    }

    setSaving(true)
    try {
      if (editingCategory) {
        await updateCategory(editingCategory, categoryForm)
        showToast('分类已更新')
      } else {
        await createCategory(categoryForm)
        showToast('分类已添加')
      }
      await loadCategories()
      setView('list')
    } catch (err) {
      alert('保存失败: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleCategoryVisible = async (category) => {
    try {
      await updateCategory(category.id, { visible: !category.visible })
      showToast(category.visible ? '已隐藏' : '已显示')
      await loadCategories()
    } catch (err) {
      alert('操作失败: ' + err.message)
    }
  }

  const handleDeleteCategory = async (id) => {
    if (!confirm('确定删除这个分类？')) return
    try {
      await deleteCategory(id)
      showToast('分类已删除')
      await loadCategories()
    } catch (err) {
      alert('删除失败: ' + err.message)
    }
  }

  // Comment management
  const handleApproveComment = async (id) => {
    try {
      await updateCommentStatus(id, 1)
      showToast('评论已通过')
      loadComments()
    } catch (err) {
      alert('操作失败: ' + err.message)
    }
  }

  const handleRejectComment = async (id) => {
    try {
      await updateCommentStatus(id, 0)
      showToast('评论已拒绝')
      loadComments()
    } catch (err) {
      alert('操作失败: ' + err.message)
    }
  }

  const handleDeleteComment = async (id) => {
    if (!confirm('确定删除这条评论？')) return
    try {
      await deleteComment(id)
      showToast('评论已删除')
      loadComments()
    } catch (err) {
      alert('删除失败: ' + err.message)
    }
  }

  // Cover image upload
  const handleCoverUpload = async (e) => {
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
      updateForm('coverImage', data.url)
      showToast('封面图已上传')
    } catch (err) {
      alert('上传失败: ' + err.message)
    } finally {
      setUploading(false)
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
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
              管理后台
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

          {/* Tab 切换 */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${tab === 'posts' ? styles.tabActive : ''}`}
              onClick={() => setTab('posts')}
            >
              <FileText size={16} />
              文章管理
            </button>
            <button
              className={`${styles.tab} ${tab === 'categories' ? styles.tabActive : ''}`}
              onClick={() => setTab('categories')}
            >
              <FolderOpen size={16} />
              分类管理
            </button>
            <button
              className={`${styles.tab} ${tab === 'comments' ? styles.tabActive : ''}`}
              onClick={() => setTab('comments')}
            >
              <MessageSquare size={16} />
              评论管理
            </button>
            <button
              className={`${styles.tab} ${tab === 'links' ? styles.tabActive : ''}`}
              onClick={() => setTab('links')}
            >
              <Link2 size={16} />
              友链管理
            </button>
          </div>

          {toast && <div className={styles.toast}>{toast}</div>}

          {/* 文章列表 */}
          {tab === 'posts' && (
            <>
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
            </>
          )}

          {/* 分类列表 */}
          {tab === 'categories' && (
            <>
              <div className={styles.linkHeader}>
                <button className={styles.btnPublish} onClick={handleNewCategory}>
                  <Plus size={16} />
                  添加分类
                </button>
              </div>
              {categories.length === 0 ? (
                <div className={styles.empty}>
                  <FolderOpen size={32} />
                  <p style={{ marginTop: 12 }}>还没有分类</p>
                  <button className={styles.btnPublish} onClick={handleNewCategory} style={{ marginTop: 16 }}>
                    <Plus size={16} />
                    添加第一个分类
                  </button>
                </div>
              ) : (
                <div className={styles.linkList}>
                  {categories.map((category) => (
                    <div key={category.id} className={`${styles.linkItem} ${!category.visible ? styles.linkHidden : ''}`}>
                      <div className={styles.linkInfo}>
                        <div className={styles.linkTitleRow}>
                          <span className={styles.categoryIcon}>{category.icon || '📄'}</span>
                          <div>
                            <h3 className={styles.linkName}>{category.name}</h3>
                            {category.description && (
                              <p className={styles.linkDesc}>{category.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className={styles.linkActions}>
                        <button
                          className={styles.iconBtn}
                          onClick={() => handleToggleCategoryVisible(category)}
                          title={category.visible ? '隐藏' : '显示'}
                        >
                          {category.visible ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        </button>
                        <button
                          className={styles.iconBtn}
                          onClick={() => handleEditCategory(category)}
                          title="编辑"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                          onClick={() => handleDeleteCategory(category.id)}
                          title="删除"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* 评论列表 */}
          {tab === 'comments' && (
            <>
              {comments.length === 0 ? (
                <div className={styles.empty}>
                  <MessageSquare size={32} />
                  <p style={{ marginTop: 12 }}>还没有评论</p>
                </div>
              ) : (
                <div className={styles.commentList}>
                  {comments.map((comment) => (
                    <div key={comment.id} className={`${styles.commentItem} ${comment.status === 0 ? styles.commentPending : ''}`}>
                      <div className={styles.commentHeader}>
                        <div className={styles.commentMeta}>
                          <span className={styles.commentNickname}>{comment.nickname}</span>
                          <span className={styles.commentTime}>{formatDate(comment.created_at)}</span>
                          <span className={styles.commentPost}>
                            文章: {comment.post_title}
                          </span>
                        </div>
                        <span className={`${styles.commentStatus} ${comment.status === 1 ? styles.statusApproved : styles.statusPending}`}>
                          {comment.status === 1 ? '已发布' : '待审核'}
                        </span>
                      </div>
                      <div className={styles.commentContent}>{comment.content}</div>
                      <div className={styles.commentActions}>
                        {comment.status === 0 ? (
                          <button
                            className={styles.approveBtn}
                            onClick={() => handleApproveComment(comment.id)}
                          >
                            <CheckCircle size={14} />
                            通过
                          </button>
                        ) : (
                          <button
                            className={styles.rejectBtn}
                            onClick={() => handleRejectComment(comment.id)}
                          >
                            <XCircle size={14} />
                            拒绝
                          </button>
                        )}
                        <button
                          className={styles.deleteCommentBtn}
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash2 size={14} />
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* 友链列表 */}
          {tab === 'links' && (
            <>
              <div className={styles.linkHeader}>
                <button className={styles.btnPublish} onClick={handleNewLink}>
                  <Plus size={16} />
                  添加友链
                </button>
              </div>
              {links.length === 0 ? (
                <div className={styles.empty}>
                  <Link2 size={32} />
                  <p style={{ marginTop: 12 }}>还没有友链</p>
                  <button className={styles.btnPublish} onClick={handleNewLink} style={{ marginTop: 16 }}>
                    <Plus size={16} />
                    添加第一个友链
                  </button>
                </div>
              ) : (
                <div className={styles.linkList}>
                  {links.map((link) => (
                    <div key={link.id} className={`${styles.linkItem} ${!link.visible ? styles.linkHidden : ''}`}>
                      <div className={styles.linkInfo}>
                        <div className={styles.linkTitleRow}>
                          {link.avatar && (
                            <img src={link.avatar} alt={link.name} className={styles.linkAvatar} />
                          )}
                          <div>
                            <h3 className={styles.linkName}>{link.name}</h3>
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className={styles.linkUrl}>
                              {link.url}
                              <ExternalLink size={12} />
                            </a>
                          </div>
                        </div>
                        {link.description && (
                          <p className={styles.linkDesc}>{link.description}</p>
                        )}
                      </div>
                      <div className={styles.linkActions}>
                        <button
                          className={styles.iconBtn}
                          onClick={() => handleToggleLinkVisible(link)}
                          title={link.visible ? '隐藏' : '显示'}
                        >
                          {link.visible ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        </button>
                        <button
                          className={styles.iconBtn}
                          onClick={() => handleEditLink(link)}
                          title="编辑"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                          onClick={() => handleDeleteLink(link.id)}
                          title="删除"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  // ===== Link Editor View =====
  if (view === 'linkEditor') {
    return (
      <div className="container">
        <div className={styles.page}>
          <div className={styles.header}>
            <button className={styles.btnOutline} onClick={() => setView('list')}>
              <ArrowLeft size={16} />
              返回列表
            </button>
            <h1 className={styles.pageTitle}>
              {editingLink ? '编辑友链' : '添加友链'}
            </h1>
            <div className={styles.actions}>
              <button className={styles.btnPublish} onClick={handleSaveLink} disabled={saving}>
                <Save size={16} />
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>

          {toast && <div className={styles.toast}>{toast}</div>}

          <div className={styles.linkFormSection}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>博客名称 *</label>
                <input
                  type="text"
                  value={linkForm.name}
                  onChange={(e) => setLinkForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="博客名称"
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>博客链接 *</label>
                <input
                  type="url"
                  value={linkForm.url}
                  onChange={(e) => setLinkForm(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com"
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>头像链接</label>
                <input
                  type="url"
                  value={linkForm.avatar}
                  onChange={(e) => setLinkForm(prev => ({ ...prev, avatar: e.target.value }))}
                  placeholder="https://avatar-url.com/avatar.png"
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>博客描述</label>
                <input
                  type="text"
                  value={linkForm.description}
                  onChange={(e) => setLinkForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="一句话介绍博客"
                  className={styles.input}
                />
              </div>
            </div>
            {linkForm.avatar && (
              <div className={styles.linkPreview}>
                <p>头像预览：</p>
                <img src={linkForm.avatar} alt="头像预览" />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ===== Category Editor View =====
  if (view === 'categoryEditor') {
    const emojiList = ['📄', '📝', '📖', '📚', '🎨', '🎵', '🎬', '📷', '✈️', '🌍', '💻', '🔧', '🎯', '💡', '🔥', '❤️', '⭐', '🌟']

    return (
      <div className="container">
        <div className={styles.page}>
          <div className={styles.header}>
            <button className={styles.btnOutline} onClick={() => setView('list')}>
              <ArrowLeft size={16} />
              返回列表
            </button>
            <h1 className={styles.pageTitle}>
              {editingCategory ? '编辑分类' : '添加分类'}
            </h1>
            <div className={styles.actions}>
              <button className={styles.btnPublish} onClick={handleSaveCategory} disabled={saving}>
                <Save size={16} />
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>

          {toast && <div className={styles.toast}>{toast}</div>}

          <div className={styles.linkFormSection}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>分类名称 *</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="如：技术、生活、旅行"
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>分类图标</label>
                <div className={styles.emojiSelector}>
                  {emojiList.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      className={`${styles.emojiBtn} ${categoryForm.icon === emoji ? styles.emojiActive : ''}`}
                      onClick={() => setCategoryForm(prev => ({ ...prev, icon: emoji }))}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.formGroupFull}>
                <label>分类介绍</label>
                <input
                  type="text"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="一句话介绍这个分类"
                  className={styles.input}
                />
              </div>
            </div>
            <div className={styles.categoryPreview}>
              <p>预览：</p>
              <div className={styles.previewCard}>
                <span className={styles.previewIcon}>{categoryForm.icon || '📄'}</span>
                <div>
                  <h4>{categoryForm.name || '分类名称'}</h4>
                  <p>{categoryForm.description || '分类介绍'}</p>
                </div>
              </div>
            </div>
          </div>
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
              {form.coverImage && (
                <div className={styles.previewCover}>
                  <img src={form.coverImage} alt="封面" />
                </div>
              )}
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
                  <select
                    value={form.category}
                    onChange={(e) => updateForm('category', e.target.value)}
                    className={styles.input}
                  >
                    <option value="">请选择分类</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                    <option value="__custom__">自定义分类...</option>
                  </select>
                  {form.category === '__custom__' && (
                    <input
                      type="text"
                      placeholder="输入自定义分类名称"
                      className={styles.input}
                      style={{ marginTop: 8 }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          updateForm('category', e.target.value.trim())
                        }
                      }}
                    />
                  )}
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
                <div className={styles.formGroupFull}>
                  <label>封面图</label>
                  <div className={styles.coverRow}>
                    <input
                      type="text"
                      value={form.coverImage}
                      onChange={(e) => updateForm('coverImage', e.target.value)}
                      placeholder="图片 URL 或上传图片"
                      className={styles.input}
                    />
                    <input
                      type="file"
                      ref={coverInputRef}
                      onChange={handleCoverUpload}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                    <button
                      className={styles.btnOutline}
                      onClick={() => coverInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Image size={16} />
                      {uploading ? '上传中...' : '上传'}
                    </button>
                    {form.coverImage && (
                      <button
                        className={styles.btnOutline}
                        onClick={() => updateForm('coverImage', '')}
                      >
                        清除
                      </button>
                    )}
                  </div>
                  <p className={styles.coverHint}>建议比例 1:1 或 16:9，尺寸不小于 800×800 / 800×450</p>
                  {form.coverImage && (
                    <div className={styles.coverPreview}>
                      <img src={form.coverImage} alt="封面预览" />
                    </div>
                  )}
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
