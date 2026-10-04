# Lumen CMS

Lumen is a full-stack content management system: a protected editorial desk and a public journal. Administrators sign in, manage people and permissions, upload media, draft pages and articles, send work through review, and publish. Only **published** content appears on the public site.

This repository is meant to run locally. The seeded accounts and the JWT secret in `.env` are for demonstration, not for a public deployment.

## Features

- JWT authentication, bcrypt password hashing, remember-me sessions, logout that invalidates tokens
- Role-based access control enforced in the API, not only in the interface
- Default roles: Super Admin, Admin, Editor, Author, Viewer, plus custom roles
- Posts, articles, news, announcements, and pages
- Draft → review → approve / reject → publish, plus schedule, unpublish, archive
- Scheduled publishing job (checks every 20 seconds)
- Revision history with restore
- Soft delete (trash), restore, and permanent delete
- Media library: drag-and-drop upload, alt text, captions, image and video preview
- YouTube and Vimeo embeds
- Categories, tags, search, filters, pagination
- Activity log with user, action, resource, time, and IP
- SEO fields and clean URLs (`/blog/how-to-build-a-website`)
- Settings for site identity, registration, upload limits, and password policy
- Public site: home, about, journal, story, category, search, gallery, film, contact, 404
- Responsive admin desk and public journal

## Technology

| Layer | Stack |
| --- | --- |
| Frontend | React 18, Vite, Tailwind CSS, React Router, Axios |
| Backend | Node.js, Express, REST |
| Database | MongoDB with Mongoose |
| Auth | JWT, bcrypt |
| Media | Local disk, behind a small storage path so cloud storage can replace it later |

If `MONGODB_URI` is empty, the API starts an in-memory MongoDB (via `mongodb-memory-server`) and seeds demo data. That data lives only as long as the API process. For a persistent database, run MongoDB and set `MONGODB_URI`.

## Folder structure

```
cms/
  README.md
  docker-compose.yml
  backend/
    src/
      config/         database, permissions, paths
      controllers/    auth, users, roles, content, media, public…
      middleware/     auth, errors, uploads
      models/         Mongoose models
      routes/         REST routers
      seed/           demo data
      services/       activity log, scheduler
      utils/
    uploads/          local media files
    seed-assets/      photographs copied into uploads on seed
  frontend/
    src/
      components/     editor, media picker, charts, UI
      context/        auth and toasts
      layouts/        desk and public site
      pages/          admin and public pages
      services/       Axios client
```

## Installation

From the project root:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Environment file (already created for local demo; otherwise copy the example):

```bash
cp backend/.env.example backend/.env
```

### Environment variables

| Variable | Purpose |
| --- | --- |
| `PORT` | API port. Default `4000`. |
| `MONGODB_URI` | Mongo connection string. Empty = in-memory demo database. |
| `JWT_SECRET` | Signing secret. Change this before any real deployment. |
| `CLIENT_ORIGIN` | Comma-separated browser origins for CORS. |
| `SEED_ON_START` | Seed when the database has no users. `true` / `false`. |
| `DEMO_EXPOSE_RESET` | Return a password-reset link in the API response. Local demo only. |
| `UPLOAD_DIR` | Upload folder, relative to `backend/`. |

Never commit production secrets. The checked-in `.env` is a local demo file.

## MongoDB

**Option A — in-memory demo (no install)**

Leave `MONGODB_URI` empty and start the API. The first boot downloads a MongoDB binary if it is not cached, then seeds the journal.

**Option B — persistent MongoDB**

```bash
docker compose up -d
```

Then in `backend/.env`:

```
MONGODB_URI=mongodb://127.0.0.1:27017/lumen
```

You can also use MongoDB Atlas. Put the connection string in `MONGODB_URI` and keep it out of git.

## Run locally

Two processes. The Vite dev server proxies `/api` and `/uploads` to the API, so the browser never calls `localhost` for data.

Terminal 1, from `backend/`:

```bash
npm run dev
```

`npm start` runs the API without file watching. Prefer that if uploads should not restart the process.

Terminal 2, from `frontend/`:

```bash
npm run dev
```

Open the printed frontend URL.

- Public journal: `/`
- Desk: `/login` or `/admin`

### Seed again

With a persistent database, from `backend/`:

```bash
npm run seed
```

This **replaces** demo collections (users, content, media records, logs). It does not drop an entire production database name, but do not run it against data you need to keep.

In-memory mode reseeds automatically whenever the API starts against an empty database.

## Demo accounts

Local demonstration only. Change these before exposing the app.

| Role | Email | Password |
| --- | --- | --- |
| Super Admin | leela@lumen.cms | Leela#Lumen26 |
| Admin | rohan@lumen.cms | Rohan#Lumen26 |
| Editor | mira@lumen.cms | Mira#Lumen26 |
| Author | arun@lumen.cms | Arun#Lumen26 |
| Viewer | nila@lumen.cms | Nila#Lumen26 |

The sign-in page can enter as any of these accounts. Registration is off until an administrator enables it in Settings. The default role for new registrations is Viewer.

What each role can do, before you edit permissions:

- **Super Admin** — everything. The role cannot be reduced or deleted.
- **Admin** — content, media, users, categories, roles, settings, activity.
- **Editor** — create, edit, review, publish, categories, pages, media.
- **Author** — create content, edit their own, upload media, submit for review. Cannot publish.
- **Viewer** — dashboard and content lists, read only.

The Roles page writes permissions to the database. The API checks them on every mutation.

## Publishing workflow

1. An author creates a piece and saves a draft. Edits autosave after a short pause.
2. They submit it for review.
3. An editor approves (publishes) or rejects it back to draft with a note.
4. Alternatively, someone with publish permission publishes immediately or schedules a time.
5. A scheduler in the API publishes due items. Nobody needs to be signed in.
6. The public site reads only `published` items that are not in trash.
7. Unpublish returns a draft. Archive hides a piece without trashing it. Delete moves it to trash.

## API overview

Authentication

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/auth/config`
- `PUT /api/auth/profile`
- `PUT /api/auth/password`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

Users, roles, content, pages, categories, tags, media, activity, settings, dashboard, and admin search live under `/api/...` and require a bearer token plus the relevant permission.

Workflow actions:

- `POST /api/content/:id/publish`
- `POST /api/content/:id/unpublish`
- `POST /api/content/:id/submit`
- `POST /api/content/:id/approve`
- `POST /api/content/:id/reject`
- `POST /api/content/:id/schedule`
- `POST /api/content/:id/archive`
- `POST /api/content/:id/restore`
- `DELETE /api/content/:id` (trash)
- `DELETE /api/content/:id/permanent`

Pages use the same actions under `/api/pages`.

Public, unauthenticated:

- `GET /api/public/bootstrap`
- `GET /api/public/home`
- `GET /api/public/posts`
- `GET /api/public/posts/:slug`
- `GET /api/public/pages/:slug`
- `GET /api/public/gallery`
- `GET /api/public/videos`
- `GET /api/public/search?q=`
- `POST /api/public/contact`

Passwords are never included in JSON responses. Uploads are checked for extension, MIME type, and the size configured in Settings. SVG uploads have scripts stripped. HTML content is sanitized on save.

## Media storage

Uploads are written to `backend/uploads` and served at `/uploads/...`. The controller is the place to swap in S3 or another provider: keep the `Media` document shape (`url`, `filename`, `kind`, `size`) and change only the save/delete implementation.

## Deployment

1. Set `NODE_ENV=production`, a long `JWT_SECRET`, a real `MONGODB_URI`, and `DEMO_EXPOSE_RESET=false`.
2. Set `CLIENT_ORIGIN` to the public site origin.
3. From `frontend/`, run `npm run build`.
4. From `backend/`, run `npm start`. If `frontend/dist` exists, the API serves it.
5. Put a reverse proxy in front (HTTPS, larger upload body if needed). Keep MongoDB and the upload volume persistent.

Forgot-password does not send email. Wire an SMTP provider in `authController.forgotPassword` if you need real mail. Until then, administrators reset passwords from the Users page.

## Notes

- In-memory MongoDB is convenient and not durable. Use Docker or Atlas if you need data to survive a restart.
- The scheduler is an in-process interval. Run a single API instance, or move the job to a worker, before you scale horizontally.
- Demo activity includes a short history so charts are not empty on first launch. New actions are logged for real as you use the desk.
