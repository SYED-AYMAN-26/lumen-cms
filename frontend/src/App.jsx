import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ScreenLoader } from './components/ui';
import AdminLayout from './layouts/AdminLayout';
import PublicLayout from './layouts/PublicLayout';
import Login, { ForgotPassword, Register, ResetPassword } from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import ContentList from './pages/admin/ContentList';
import ContentEditor from './pages/admin/ContentEditor';
import MediaLibrary from './pages/admin/MediaLibrary';
import { Categories, TagsPage } from './pages/admin/Taxonomy';
import Users from './pages/admin/Users';
import { Permissions, Roles } from './pages/admin/Roles';
import Activity from './pages/admin/Activity';
import Settings from './pages/admin/Settings';
import Profile from './pages/admin/Profile';
import Messages from './pages/admin/Messages';
import Trash from './pages/admin/Trash';
import Home from './pages/public/Home';
import { Article, Blog, CategoryPage, CmsPage, SearchPage } from './pages/public/Journal';
import { ContactPage, GalleryPage, NotFound, VideosPage } from './pages/public/More';
import Preview from './pages/Preview';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <ScreenLoader />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  return children;
}

function Permit({ perms, children }) {
  const { can } = useAuth();
  if (can(...perms)) return children;
  return (
    <div className="card max-w-xl p-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-copper">Forbidden</p>
      <h1 className="mt-2 font-serif text-3xl">This part of the desk is closed</h1>
      <p className="mt-2 text-sm leading-6 text-stone-600">Your role does not include permission for this page. The API enforces the same rule, so the address alone will not open it.</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/preview/:type/:id" element={<RequireAuth><Preview /></RequireAuth>} />
      <Route path="/admin" element={<RequireAuth><AdminLayout /></RequireAuth>}>
        <Route index element={<Dashboard />} />
        <Route path="content" element={<ContentList title="All content" description="Posts, articles, news, and announcements. Only published work appears on the public site." />} />
        <Route path="content/new" element={<ContentEditor />} />
        <Route path="content/:id" element={<ContentEditor />} />
        <Route path="pages" element={<ContentList mode="page" title="Pages" description="Home is composed by the public site. About, studio, FAQ, and any page you publish live here." />} />
        <Route path="pages/new" element={<ContentEditor mode="page" />} />
        <Route path="pages/:id" element={<ContentEditor mode="page" />} />
        <Route path="drafts" element={<ContentList lockedStatus="draft" title="Drafts" description="Work that has not been submitted or published." />} />
        <Route path="review" element={<ContentList lockedStatus="review" title="In review" description="Pieces waiting for an editor to approve or send back." />} />
        <Route path="scheduled" element={<ContentList lockedStatus="scheduled" title="Scheduled" description="These publish themselves when the time arrives, even if nobody is signed in." />} />
        <Route path="published" element={<ContentList lockedStatus="published" title="Published" description="Live on the public journal." />} />
        <Route path="trash" element={<Trash />} />
        <Route path="media" element={<MediaLibrary />} />
        <Route path="categories" element={<Categories />} />
        <Route path="tags" element={<TagsPage />} />
        <Route path="users" element={<Permit perms={['manage_users']}><Users /></Permit>} />
        <Route path="roles" element={<Permit perms={['manage_roles']}><Roles /></Permit>} />
        <Route path="permissions" element={<Permit perms={['manage_roles']}><Permissions /></Permit>} />
        <Route path="activity" element={<Permit perms={['view_activity_logs']}><Activity /></Permit>} />
        <Route path="messages" element={<Permit perms={['manage_settings']}><Messages /></Permit>} />
        <Route path="settings" element={<Permit perms={['manage_settings']}><Settings /></Permit>} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<div className="card max-w-xl p-8"><h1 className="font-serif text-3xl">That desk page does not exist.</h1></div>} />
      </Route>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="blog" element={<Blog />} />
        <Route path="blog/:slug" element={<Article />} />
        <Route path="category/:slug" element={<CategoryPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="gallery" element={<GalleryPage />} />
        <Route path="videos" element={<VideosPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="about" element={<CmsPage slug="about" />} />
        <Route path="p/:slug" element={<CmsPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
