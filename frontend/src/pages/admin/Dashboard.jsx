import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { PageHeader, Badge, Spinner, EmptyState } from '../../components/ui';
import { BarChart, Donut, LineChart } from '../../components/Charts';
import { timeAgo } from '../../utils/format';

function Stat({ label, value, to }) {
  const body = (
    <div className="card p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">{label}</p>
      <p className="mt-2 font-serif text-3xl">{value ?? '—'}</p>
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

export default function Dashboard() {
  const { user, can } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    api.get('/dashboard').then((res) => setData(res.data.data)).catch((err) => setError(errorMessage(err)));
  }, []);

  if (error) return <EmptyState title="Dashboard unavailable" body={error} />;
  if (!data) return <div className="py-20 text-center text-stone-500"><Spinner className="h-5 w-5" /></div>;
  const c = data.counts;

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title={`${greeting}, ${user?.name?.split(' ')[0]}.`}
        description="Counts below are live from the database — posts, pages, media, and the last two weeks of desk activity."
        actions={<>
          {can('create_content', 'manage_posts') && <Link className="btn-primary" to="/admin/content/new">New post</Link>}
          {can('manage_pages') && <Link className="btn-secondary" to="/admin/pages/new">New page</Link>}
          {can('upload_media', 'manage_media') && <Link className="btn-secondary" to="/admin/media">Upload media</Link>}
          {can('manage_users') && <Link className="btn-secondary" to="/admin/users">Manage users</Link>}
        </>}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total content" value={c.totalContent} to="/admin/content" />
        <Stat label="Published" value={c.published} to="/admin/published" />
        <Stat label="Drafts" value={c.draft} to="/admin/drafts" />
        <Stat label="Scheduled" value={c.scheduled} to="/admin/scheduled" />
        <Stat label="In review" value={c.review} to="/admin/review" />
        <Stat label="Users" value={c.users} to={can('manage_users') ? '/admin/users' : undefined} />
        <Stat label="Media" value={c.media} to="/admin/media" />
        <Stat label="Categories" value={c.categories} to="/admin/categories" />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <section className="card p-5 lg:col-span-3">
          <h2 className="font-serif text-2xl">Content created</h2>
          <p className="mb-2 text-xs text-stone-500">Posts and pages, by week.</p>
          <LineChart data={data.contentOverTime} />
        </section>
        <section className="card p-5 lg:col-span-2">
          <h2 className="mb-4 font-serif text-2xl">By status</h2>
          <Donut data={data.statusBreakdown} />
        </section>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 font-serif text-2xl">By category</h2>
          <BarChart data={data.byCategory} />
        </section>
        <section className="card p-5">
          <h2 className="font-serif text-2xl">User activity</h2>
          <p className="mb-2 text-xs text-stone-500">Logged actions over the last 14 days.</p>
          <LineChart data={data.userActivity} />
        </section>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 font-serif text-2xl">Recent content</h2>
          <ul className="divide-y divide-line">
            {data.recentContent.map((item) => (
              <li key={item._id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <Link className="text-sm font-medium hover:text-copper" to={`/admin/content/${item._id}`}>{item.title}</Link>
                  <p className="text-xs text-stone-500">{item.author?.name} · {timeAgo(item.updatedAt)}</p>
                </div>
                <Badge status={item.status} />
              </li>
            ))}
          </ul>
        </section>
        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-2xl">Recent activity</h2>
            {can('view_activity_logs') && <Link to="/admin/activity" className="text-sm text-copper">View log</Link>}
          </div>
          <ul className="space-y-3">
            {data.recentActivity.map((item) => (
              <li key={item._id} className="text-sm">
                <span className="font-medium">{item.user?.name || 'System'}</span>
                <span className="text-stone-600"> {item.action.replaceAll('.', ' · ')}</span>
                {item.metadata?.title && <span className="text-stone-500"> — {item.metadata.title}</span>}
                <p className="text-xs text-stone-400">{timeAgo(item.createdAt)}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
