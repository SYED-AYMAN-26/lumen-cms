import { useEffect } from 'react';

function setMeta(name, content, attr = 'name') {
  if (!content) return;
  let tag = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

export function useSeo({ title, description, image, siteName = 'Lumen' }) {
  useEffect(() => {
    document.title = title ? `${title} · ${siteName}` : siteName;
    if (description) setMeta('description', description);
    setMeta('og:title', title || siteName, 'property');
    if (description) setMeta('og:description', description, 'property');
    if (image) setMeta('og:image', image, 'property');
  }, [title, description, image, siteName]);
}
