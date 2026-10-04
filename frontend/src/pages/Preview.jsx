import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errorMessage } from '../services/api';
import { StoryView } from './public/Journal';
import { Spinner } from '../components/ui';

export default function Preview() {
  const { type, id } = useParams();
  const [story, setStory] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const path = type === 'page' ? `/pages/${id}` : `/content/${id}`;
    api.get(path).then((res) => {
      const doc = res.data.data;
      setStory({
        title: doc.title,
        excerpt: doc.excerpt,
        body: doc.body || doc.content,
        status: doc.status,
        publishedAt: doc.updatedAt,
        featuredImage: doc.featuredImage,
        category: doc.category,
        author: doc.author,
        tags: doc.tags,
        videos: (doc.videos || []).map((v) => ({ ...v, embedUrl: v.embedUrl || v.media?.url })),
      });
    }).catch((err) => setError(errorMessage(err)));
  }, [type, id]);
  if (error) return <p className="p-8 text-sm text-rose-700">{error}</p>;
  if (!story) return <div className="py-20 text-center"><Spinner /></div>;
  return (
    <div className="min-h-screen bg-[#faf7f2]">
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-950">
        Preview · {story.status} · not necessarily public. <Link to="/admin" className="underline">Back to the desk</Link>
      </div>
      <StoryView story={story} kicker="Preview" />
    </div>
  );
}
