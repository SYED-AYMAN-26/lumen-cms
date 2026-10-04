export const articles = [
  {
    key: 'lasts',
    title: 'How to build a website that lasts',
    slug: 'how-to-build-a-website',
    type: 'article',
    category: 'design',
    tags: ['publishing', 'craft'],
    image: 'reading-room',
    author: 'mira',
    status: 'published',
    weeksAgo: 7,
    excerpt: 'The pages that still feel considered years later were usually built from a quieter set of decisions.',
    seoTitle: 'How to build a website that lasts',
    seoDescription: 'A practical essay on editorial structure, durable URLs, and publishing workflows that outlive a redesign.',
    body: `
<p>A website outlives the sprint that shipped it. The pages that still feel considered five years later were usually built with a quieter set of decisions: a type scale someone can explain, a content model that matches how the organization actually writes, and a publishing path that does not depend on a single person's memory.</p>
<h2>Start with the sentence, not the stack</h2>
<p>Teams reach for a framework when they are really missing an editorial structure. Before choosing tools, write down the kinds of things the site must hold. A studio might need case studies, a journal, and a short services page. A newsroom needs speed, corrections, and a clear byline. Those needs decide the model.</p>
<blockquote>Publishing is a workflow problem disguised as a software problem.</blockquote>
<ul>
<li>Name the content types you will still care about next year.</li>
<li>Decide who may draft, who may review, and who may publish.</li>
<li>Write the URL you want before you write the template.</li>
</ul>
<h2>Make the draft feel safe</h2>
<p>Authors publish less carefully when the only button in sight is Publish. A draft that saves itself, a review state that is visible, and a trash that can be undone are not luxuries. They are how a team trusts the system enough to use it.</p>
<p>Performance belongs in the same conversation. A heavy page is an editorial choice, whether or not anyone intended it. Compress the image. Give it alt text. Do not embed a video that autoplays over the lede.</p>
<pre><code>slug: how-to-build-a-website
status: published
path: /blog/how-to-build-a-website</code></pre>
<p>Durable URLs are a form of respect. Readers bookmark them. Other writers cite them. If the address has to change, leave a redirect and say so. The web is already full of doors that open onto nothing.</p>
`,
  },
  {
    key: 'editorial',
    title: 'The quiet power of editorial design',
    slug: 'quiet-power-of-editorial-design',
    type: 'article',
    category: 'design',
    tags: ['typography', 'craft'],
    image: 'letterpress',
    author: 'mira',
    status: 'published',
    weeksAgo: 6,
    excerpt: 'Restraint is not the absence of design. It is design that knows when to stop talking.',
    body: `
<p>Restraint is not the absence of design. It is design that knows when to stop talking. A journal page has a job: carry a reader from the first sentence to the last without making them negotiate the furniture.</p>
<h2>Hierarchy is a promise</h2>
<p>The title is a promise about the scale of the idea. The dek narrows it. The first paragraph has to earn the scroll. If every element shouts, the reader hears none of them. Editorial design is mostly the practice of lowering the volume until the sentence can be heard.</p>
<blockquote>If every element shouts, the reader hears none of them.</blockquote>
<p>Type does more work than color on a reading page. A serif with a real italic, a sans for the furniture, and a measure around sixty-five characters will outperform a palette that took a week to argue about. Contrast is not a brand value. It is whether someone can read the piece on a sunlit train.</p>
<h3>A small checklist</h3>
<ol>
<li>One family for reading, one for interface.</li>
<li>Captions that say something the picture does not.</li>
<li>Links that look like links, including on touch screens.</li>
<li>A dark mode only if you are willing to proof it.</li>
</ol>
<p>None of this is fashionable. That is the point. Fashion dates a page. A clear measure does not.</p>
`,
  },
  {
    key: 'workflow',
    title: 'A practical guide to content workflows',
    slug: 'practical-guide-to-content-workflows',
    type: 'article',
    category: 'craft',
    tags: ['workflow', 'publishing'],
    image: 'studio-table',
    author: 'mira',
    status: 'published',
    weeksAgo: 4,
    excerpt: 'A status field is not a workflow. A workflow is an agreement about who moves a piece, and when.',
    body: `
<p>A status field is not a workflow. A workflow is an agreement about who moves a piece, and when. Software can remember the agreement. It cannot invent one.</p>
<h2>The smallest useful path</h2>
<p>Most teams need four states and no more: draft, in review, scheduled, published. Archive and trash are exits, not stages. If you add a status nobody can define in a sentence, delete it.</p>
<table>
<thead><tr><th>State</th><th>Who acts</th><th>What the public sees</th></tr></thead>
<tbody>
<tr><td>Draft</td><td>Author</td><td>Nothing</td></tr>
<tr><td>In review</td><td>Editor</td><td>Nothing</td></tr>
<tr><td>Scheduled</td><td>Editor</td><td>Nothing, until the time arrives</td></tr>
<tr><td>Published</td><td>Editor</td><td>The piece, at a stable URL</td></tr>
</tbody>
</table>
<p>Authors should be able to submit, not to publish, unless the desk is a desk of one. Editors should be able to send a piece back with a note that survives the round trip. “Rejected” is a harsh word for what is usually “not yet.”</p>
<p>Scheduled publishing is a kindness to the person who does not want to be awake at six. It is also a test of the system. If the job only runs when someone is logged in, it is not scheduled. It is a reminder.</p>
`,
  },
  {
    key: 'performance',
    title: 'Why performance is a design decision',
    slug: 'performance-is-a-design-decision',
    type: 'article',
    category: 'technology',
    tags: ['performance', 'media'],
    image: 'rain-street',
    author: 'arun',
    status: 'published',
    weeksAgo: 3,
    excerpt: 'A slow page is not a technical debt ticket. It is a layout that asked for too much.',
    body: `
<p>A slow page is not a technical debt ticket. It is a layout that asked for too much. The hero video, the third webfont, the carousel that exists because the homepage meeting ran long — each one is a design decision with a loading cost.</p>
<h2>Weight is visible if you let it be</h2>
<p>Put the image dimensions next to the upload. Show the file size in the library. A twelve-megabyte photograph does not become editorial because it was taken on a good camera. It becomes a wait.</p>
<ul>
<li>Prefer one strong image to six competing ones.</li>
<li>Give every image alt text before it is allowed on a public page.</li>
<li>Embed video; do not autoplay it.</li>
<li>Treat a custom font as a guest, not a resident, until it has earned the bytes.</li>
</ul>
<p>Performance work done only in the engineering channel arrives too late. The moment to refuse the autoplay reel is in the media library, when the file is still a decision and not a habit.</p>
<p>Readers rarely complain in the language of metrics. They leave. The bounce is the critique.</p>
`,
  },
  {
    key: 'access',
    title: 'Notes on accessible media',
    slug: 'notes-on-accessible-media',
    type: 'article',
    category: 'technology',
    tags: ['accessibility', 'media'],
    image: 'books',
    author: 'arun',
    status: 'published',
    weeksAgo: 2,
    excerpt: 'Alt text is not a caption, and a caption is not a transcript. Each one has a reader.',
    body: `
<p>Alt text is not a caption, and a caption is not a transcript. Each one has a reader. Mixing them up is how accessible media becomes a form nobody trusts.</p>
<h2>Write for the person who cannot see the picture</h2>
<p>Alt text should name what matters in the image for this particular sentence. “Photograph” is not alt text. “Oak table in a sunlit reading room, one ceramic cup, no people” might be, if that is the point of the picture. If the picture is only atmosphere, say so briefly and move on.</p>
<blockquote>A caption can afford voice. Alt text should afford clarity.</blockquote>
<p>Video needs a title, a description, and captions when there is speech. A beautiful mute loop still needs a name, because a screen reader will otherwise announce a hole in the page. External embeds are fine. Unlabeled embeds are not.</p>
<p>Accessibility is also a publishing workflow. If alt text is a field someone can skip, they will skip it on a Friday. Make the field visible beside the preview, not buried in a metadata tab three clicks away.</p>
`,
  },
  {
    key: 'homepage',
    title: 'The case for a slower homepage',
    slug: 'the-case-for-a-slower-homepage',
    type: 'article',
    category: 'culture',
    tags: ['craft', 'publishing'],
    image: 'coast',
    author: 'mira',
    status: 'published',
    weeksAgo: 1,
    excerpt: 'A homepage does not need to prove that the organization is busy. It needs to offer a way in.',
    body: `
<p>A homepage does not need to prove that the organization is busy. It needs to offer a way in. The instinct to fill every region — a promo, a reel, a logo bar, a newsletter gate — comes from a fear that a quiet page looks unfinished. It usually looks finished. It looks like someone chose.</p>
<h2>Lead with one story</h2>
<p>Pick a piece and let it be large. The rest of the journal can wait a scroll. Readers who wanted everything at once were never going to read any of it. Readers who came for a sentence will stay if the sentence is easy to find.</p>
<p>Navigation should be short enough to remember. Home, the journal, a gallery if you have one, a way to write to you. Footer links can hold the rest. If a page exists only to be linked from the homepage, ask whether it needs to exist.</p>
<p>Slowness here is not latency. It is tempo. A page that breathes will be reread. A page that performs will be skimmed and forgotten, which is a costly way to be modern.</p>
`,
  },
  {
    key: 'pictures',
    title: 'Moving pictures, still pages',
    slug: 'moving-pictures-still-pages',
    type: 'article',
    category: 'culture',
    tags: ['media', 'craft'],
    image: 'gallery',
    author: 'leela',
    status: 'published',
    weeksAgo: 1,
    excerpt: 'Video belongs on a reading site when it is treated as a document, not as a billboard.',
    videos: true,
    body: `
<p>Video belongs on a reading site when it is treated as a document, not as a billboard. Give it a title, a description, a thumbnail, and a reason to be there. Then let the reader press play.</p>
<h2>Embed, don’t annex</h2>
<p>An external film can live beside an essay without taking the essay hostage. The embed below is a public sample — Costa Rica in 4K, and the Blender open movie Tears of Steel — used here to show how Lumen keeps moving images in the library rather than pasted blindly into a paragraph.</p>
<p>Captions, when the piece has speech, are part of the edit. A transcript is part of the archive. The page should still make sense with the sound off and the images unseen, because that is how some of your readers will meet it, and how all of them will meet it on a bad connection.</p>
`,
  },
  {
    key: 'print',
    title: 'Field notes from the print room',
    slug: 'field-notes-from-the-print-room',
    type: 'post',
    category: 'craft',
    tags: ['craft', 'typography'],
    image: 'letterpress',
    author: 'arun',
    status: 'draft',
    weeksAgo: 0,
    excerpt: 'A draft from the floor: ink density, paper tooth, and the sentence we are still willing to cut.',
    body: `
<p>This is still a draft, which is why it is not on the public journal. The print room smells like solvent and damp cotton. We are testing a cover that may be too dark, and a sentence in the lede that may be too proud.</p>
<p>Notes for the editor: the second paragraph repeats the first. The photograph of the type case needs alt text before this can be submitted. I will cut the ending if it still sounds like a speech.</p>
`,
  },
  {
    key: 'autumn',
    title: 'Announcing the autumn issue',
    slug: 'announcing-the-autumn-issue',
    type: 'announcement',
    category: 'culture',
    tags: ['publishing'],
    image: 'books',
    author: 'mira',
    status: 'review',
    weeksAgo: 0,
    excerpt: 'Twelve pieces, one screening, and a slower homepage. Submitted for the desk to approve.',
    reviewNote: 'Check the screening date before this goes out.',
    body: `
<p>The autumn issue is ready for the desk. Twelve pieces, one screening, and a homepage that leads with a single story instead of a grid of promotions.</p>
<p>Please review the announcement before it is published. The screening date in the last paragraph is still a placeholder, and the social description should not repeat the headline word for word.</p>
<h2>What is in the issue</h2>
<ul>
<li>Essays on workflow, performance, and accessible media.</li>
<li>A short film embedded with captions.</li>
<li>A gallery drawn from the commissioned stills.</li>
</ul>
`,
  },
  {
    key: 'scheduled',
    title: 'A note on morning publishing',
    slug: 'a-note-on-morning-publishing',
    type: 'news',
    category: 'craft',
    tags: ['workflow', 'publishing'],
    image: 'coast',
    author: 'mira',
    status: 'scheduled',
    weeksAgo: 0,
    excerpt: 'Scheduled for later this week, so the public site stays quiet until the desk is ready.',
    body: `
<p>This note is scheduled. Until the publish time arrives, it stays off the public journal and in the scheduled list, where an editor can still open it, revise it, or pull it back to draft.</p>
<p>The scheduler checks every few seconds. When the time passes, the status becomes published and the piece is available at its slug. No one has to be signed in for that to happen.</p>
`,
  },
  {
    key: 'soon',
    title: 'Desk note, going live shortly',
    slug: 'desk-note-going-live',
    type: 'news',
    category: 'technology',
    tags: ['workflow'],
    image: 'reading-room',
    author: 'rohan',
    status: 'scheduled-soon',
    weeksAgo: 0,
    excerpt: 'A short scheduled note used to demonstrate automatic publishing.',
    body: `
<p>If you are reading this on the public site, the scheduler did its job. This note was created with a publish time a couple of minutes after the demo data was seeded, then left alone.</p>
<p>That is the whole requirement: a time, a timezone, and a process that does not depend on someone refreshing the dashboard.</p>
`,
  },
  {
    key: 'letter',
    title: 'Letter from the first issue',
    slug: 'letter-from-the-first-issue',
    type: 'article',
    category: 'culture',
    tags: ['publishing'],
    image: 'gallery',
    author: 'leela',
    status: 'archived',
    weeksAgo: 8,
    excerpt: 'An archived letter from the opening issue. Kept, but no longer in the live journal.',
    body: `
<p>We started Lumen because the work of making software and the work of making a page had drifted apart. This letter opened the first issue. It is archived now: still in the system, absent from the public journal, available if we ever need the sentence again.</p>
<p>Archive is not trash. Trash is a mistake you might undo. Archive is a decision.</p>
`,
  },
  {
    key: 'retracted',
    title: 'Placeholder brief, retracted',
    slug: 'placeholder-brief-retracted',
    type: 'news',
    category: 'technology',
    tags: ['workflow'],
    image: 'rain-street',
    author: 'rohan',
    status: 'trash',
    weeksAgo: 5,
    excerpt: 'Moved to trash. It can be restored, or deleted permanently by someone with permission.',
    body: `
<p>This brief was a placeholder and should not have been published. It now lives in trash. Restoring it returns a draft. Permanent deletion removes it, and is reserved for people with delete permission.</p>
`,
  },
];

export const pages = [
  {
    slug: 'about',
    title: 'About Lumen',
    excerpt: 'Lumen is a demonstration journal about design, technology, and the craft of making.',
    image: 'books',
    body: `
<p>Lumen is an independent journal about design, technology, and the craft of making. This installation is a working content system: the essays you can read were published through the same desk you can sign in to.</p>
<h2>What the desk is for</h2>
<p>Authors draft. Editors review. A publisher, or an editor with permission, sends a piece into the world at a URL that will still make sense next year. Nothing reaches the public site until its status is published. Drafts, reviews, scheduled pieces, archives, and trash stay inside.</p>
<p>The journal is edited as a demo. The names are fictional. The workflow is not. You can change this page — its title, its picture, its search description — and the public About page will follow, once you publish.</p>
<blockquote>Only what is published is public. Everything else is a conversation inside the desk.</blockquote>
<h2>A note on the demo</h2>
<p>The accounts in the readme are for local demonstration. They are not a suggestion for how to run a real newsroom. Change the secrets, point the API at your own database, and decide who is actually allowed to publish.</p>
`,
  },
  {
    slug: 'studio',
    title: 'The studio',
    excerpt: 'How a small desk turns notes into a journal.',
    image: 'studio-table',
    body: `
<p>The studio is three rooms and a shared folder, in the fiction of this journal. In the software, it is a set of permissions.</p>
<h2>Rooms</h2>
<ul>
<li><strong>The desk</strong> drafts, reviews, and schedules.</li>
<li><strong>The library</strong> holds stills and moving images, with alt text beside the preview.</li>
<li><strong>The public room</strong> shows only what has been published.</li>
</ul>
<p>If you are exploring Lumen as a CMS, create a page of your own from the pages list. Give it a slug. Publish it. It will appear at <em>/p/your-slug</em>.</p>
`,
  },
  {
    slug: 'faq',
    title: 'Questions from the desk',
    excerpt: 'Short answers about publishing, drafts, and what the public site shows.',
    image: 'reading-room',
    body: `
<h2>Why can’t I see my draft on the site?</h2>
<p>Because it is a draft. The public journal lists only published work. Submit it for review, or publish it if your role allows.</p>
<h2>Who can publish?</h2>
<p>Editors, admins, and the super admin. Authors can create and edit their own pieces, then submit them. Viewers can look, not touch. You can change this in Roles &amp; permissions — the API enforces the same rules as the buttons.</p>
<h2>What happens at the scheduled time?</h2>
<p>A small job in the API checks for due pieces and publishes them. It does not require anyone to be signed in.</p>
<h2>Can I undo a delete?</h2>
<p>Yes. Delete moves a piece to trash. Restore brings it back as a draft. Permanent delete is a second, confirmed step.</p>
`,
  },
  {
    slug: 'services',
    title: 'What we make',
    excerpt: 'A draft page, not yet public, describing the journal’s commissioned work.',
    image: 'gallery',
    status: 'draft',
    body: `
<p>This page is a draft. It should not appear in the public navigation until an editor publishes it.</p>
<p>When it is ready, it can describe commissions: essays, picture editing, and the quieter work of building a publishing desk that a team will actually use.</p>
`,
  },
];
