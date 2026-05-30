import { Routes, Route, Navigate } from 'react-router-dom'
import { isLoggedIn } from './utils/api'
import Layout from './components/Layout/Layout'
import Home from './pages/Home'
import Blog from './pages/Blog'
import Post from './pages/Post'
import Categories from './pages/Categories'
import Links from './pages/Links'
import About from './pages/About'
import Search from './pages/Search'
import Admin from './pages/Admin'
import Login from './pages/Login'

function ProtectedRoute({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="blog" element={<Blog />} />
        <Route path="blog/:slug" element={<Post />} />
        <Route path="categories" element={<Categories />} />
        <Route path="categories/:category" element={<Blog />} />
        <Route path="links" element={<Links />} />
        <Route path="about" element={<About />} />
        <Route path="search" element={<Search />} />
        <Route path="admin/login" element={<Login />} />
        <Route path="admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      </Route>
    </Routes>
  )
}

export default App
