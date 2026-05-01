---
title: "React Hooks 入门指南"
date: "2024-02-20"
category: "技术"
tags: ["React", "JavaScript", "前端", "Hooks"]
summary: "一篇面向初学者的 React Hooks 入门教程，涵盖 useState、useEffect 等核心 Hooks 的用法。"
featured: true
---

## 什么是 Hooks？

Hooks 是 React 16.8 引入的新特性，让你在函数组件中使用状态和其他 React 特性。

## useState - 状态管理

`useState` 是最基础的 Hook，用来在函数组件中添加状态：

```jsx
import { useState } from 'react'

function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>你点击了 {count} 次</p>
      <button onClick={() => setCount(count + 1)}>
        点击
      </button>
    </div>
  )
}
```

## useEffect - 副作用处理

`useEffect` 用来处理组件的副作用，比如数据获取、订阅、手动修改 DOM 等：

```jsx
import { useState, useEffect } from 'react'

function UserProfile({ userId }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => setUser(data))
  }, [userId]) // 仅在 userId 变化时重新执行

  if (!user) return <div>加载中...</div>

  return <div>{user.name}</div>
}
```

## 常用 Hooks 速查表

| Hook | 用途 |
|------|------|
| `useState` | 状态管理 |
| `useEffect` | 副作用处理 |
| `useContext` | 访问 Context |
| `useRef` | 引用 DOM 元素或保存可变值 |
| `useMemo` | 缓存计算结果 |
| `useCallback` | 缓存函数引用 |

## 自定义 Hooks

Hooks 最强大的地方在于可以自定义，把逻辑抽离成可复用的函数：

```jsx
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : initialValue
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}
```

## 总结

Hooks 让函数组件拥有了类组件的所有能力，同时代码更简洁、逻辑更清晰。掌握好 Hooks，是学好现代 React 开发的关键。

---

*有什么问题欢迎在评论区讨论！*
