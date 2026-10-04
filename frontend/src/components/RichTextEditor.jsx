import { useEffect, useRef, useState } from 'react';
import {
  Bold, Italic, Underline, List, ListOrdered, Quote, Code, Link2, Image as ImageIcon,
  Video, Table, AlignLeft, AlignCenter, AlignRight, Undo2, Redo2, Heading2, Heading3,
} from 'lucide-react';
import MediaPicker from './MediaPicker';

function Tool({ label, onClick, children }) {
  return (
    <button type="button" className="rounded-md p-1.5 text-stone-600 hover:bg-stone-100 hover:text-ink" aria-label={label} title={label} onMouseDown={(e) => e.preventDefault()} onClick={onClick}>
      {children}
    </button>
  );
}

export default function RichTextEditor({ value, onChange }) {
  const ref = useRef(null);
  const last = useRef(value || '');
  const [picker, setPicker] = useState(false);
  const [htmlMode, setHtmlMode] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('https://');
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    if (!ref.current || htmlMode) return;
    if (document.activeElement === ref.current) return;
    if ((value || '') !== ref.current.innerHTML) {
      ref.current.innerHTML = value || '';
      last.current = value || '';
    }
  }, [value, htmlMode]);

  const emit = (html) => {
    last.current = html;
    onChange(html);
  };

  const cmd = (command, arg = null) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    emit(ref.current.innerHTML);
  };

  const insertHtml = (html) => {
    ref.current?.focus();
    document.execCommand('insertHTML', false, html);
    emit(ref.current.innerHTML);
  };

  const addLink = () => {
    if (!linkUrl.trim()) return;
    cmd('createLink', linkUrl.trim());
    setLinkOpen(false);
  };

  const addVideo = () => {
    const url = videoUrl.trim();
    if (!url) return;
    let embed = url;
    const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
    if (yt) embed = `https://www.youtube.com/embed/${yt[1]}`;
    const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeo) embed = `https://player.vimeo.com/video/${vimeo[1]}`;
    if (embed.includes('youtube.com') || embed.includes('vimeo.com')) {
      insertHtml(`<figure><iframe src="${embed}" title="Video" allowfullscreen></iframe></figure>`);
    } else if (url.startsWith('/uploads/')) {
      insertHtml(`<figure><video controls src="${url}"></video></figure>`);
    } else {
      insertHtml(`<p><a href="${url}">${url}</a></p>`);
    }
    setVideoOpen(false);
    setVideoUrl('');
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-[#fbf8f3] px-2 py-1.5">
        <Tool label="Heading" onClick={() => cmd('formatBlock', 'H2')}><Heading2 size={16} /></Tool>
        <Tool label="Subheading" onClick={() => cmd('formatBlock', 'H3')}><Heading3 size={16} /></Tool>
        <Tool label="Paragraph" onClick={() => cmd('formatBlock', 'P')}><span className="px-0.5 text-xs font-semibold">P</span></Tool>
        <Tool label="Bold" onClick={() => cmd('bold')}><Bold size={16} /></Tool>
        <Tool label="Italic" onClick={() => cmd('italic')}><Italic size={16} /></Tool>
        <Tool label="Underline" onClick={() => cmd('underline')}><Underline size={16} /></Tool>
        <Tool label="Bulleted list" onClick={() => cmd('insertUnorderedList')}><List size={16} /></Tool>
        <Tool label="Numbered list" onClick={() => cmd('insertOrderedList')}><ListOrdered size={16} /></Tool>
        <Tool label="Quote" onClick={() => cmd('formatBlock', 'BLOCKQUOTE')}><Quote size={16} /></Tool>
        <Tool label="Code block" onClick={() => insertHtml('<pre><code>code</code></pre>')}><Code size={16} /></Tool>
        <Tool label="Link" onClick={() => setLinkOpen((v) => !v)}><Link2 size={16} /></Tool>
        <Tool label="Image" onClick={() => setPicker(true)}><ImageIcon size={16} /></Tool>
        <Tool label="Video" onClick={() => setVideoOpen((v) => !v)}><Video size={16} /></Tool>
        <Tool label="Table" onClick={() => insertHtml('<table><thead><tr><th>Column</th><th>Column</th><th>Column</th></tr></thead><tbody><tr><td>Cell</td><td>Cell</td><td>Cell</td></tr><tr><td>Cell</td><td>Cell</td><td>Cell</td></tr></tbody></table>')}><Table size={16} /></Tool>
        <Tool label="Align left" onClick={() => cmd('justifyLeft')}><AlignLeft size={16} /></Tool>
        <Tool label="Align center" onClick={() => cmd('justifyCenter')}><AlignCenter size={16} /></Tool>
        <Tool label="Align right" onClick={() => cmd('justifyRight')}><AlignRight size={16} /></Tool>
        <Tool label="Undo" onClick={() => cmd('undo')}><Undo2 size={16} /></Tool>
        <Tool label="Redo" onClick={() => cmd('redo')}><Redo2 size={16} /></Tool>
        <button type="button" className="ml-auto rounded-md px-2 py-1 text-xs font-medium text-stone-500 hover:bg-stone-100" onClick={() => setHtmlMode((v) => !v)}>{htmlMode ? 'Visual' : 'HTML'}</button>
      </div>
      {linkOpen && (
        <div className="flex gap-2 border-b border-line bg-white px-3 py-2">
          <input className="input" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} aria-label="Link URL" />
          <button type="button" className="btn-primary" onClick={addLink}>Insert link</button>
        </div>
      )}
      {videoOpen && (
        <div className="flex gap-2 border-b border-line bg-white px-3 py-2">
          <input className="input" placeholder="YouTube, Vimeo, or uploaded video URL" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} aria-label="Video URL" />
          <button type="button" className="btn-primary" onClick={addVideo}>Insert video</button>
        </div>
      )}
      {htmlMode ? (
        <textarea className="min-h-[360px] w-full resize-y bg-white p-4 font-mono text-xs outline-none" value={value || ''} onChange={(e) => emit(e.target.value)} />
      ) : (
        <div
          ref={ref}
          className="editor-surface prose-lumen px-4 py-4 md:px-6"
          contentEditable
          role="textbox"
          aria-multiline="true"
          aria-label="Content editor"
          data-placeholder="Start writing…"
          onInput={(e) => emit(e.currentTarget.innerHTML)}
          onBlur={(e) => emit(e.currentTarget.innerHTML)}
        />
      )}
      <MediaPicker
        open={picker}
        kind="image"
        title="Insert an image"
        onClose={() => setPicker(false)}
        onSelect={(media) => {
          insertHtml(`<figure><img src="${media.url}" alt="${(media.altText || '').replace(/"/g, '&quot;')}" />${media.caption ? `<figcaption>${media.caption}</figcaption>` : ''}</figure>`);
          setPicker(false);
        }}
      />
    </div>
  );
}
