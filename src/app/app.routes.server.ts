import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // ─── Client-only Routes (booking flow) ─────────────────────────────────────
  {
    path: 'booking/**',
    renderMode: RenderMode.Client,
  },

  // ─── Dynamic parameterized routes — Server-rendered on demand ───────────────
  // Articles
  {
    path: 'article/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'article-detail/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'articles/:id',
    renderMode: RenderMode.Server,
  },

  // Conditions
  {
    path: 'condition/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'condition-detail/:id',
    renderMode: RenderMode.Server,
  },

  // Clinics
  {
    path: 'clinic/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'clinic-detail/:id',
    renderMode: RenderMode.Server,
  },

  // Doctors / Providers
  {
    path: 'doctors/:specialty',
    renderMode: RenderMode.Server,
  },
  {
    path: 'doctor-detail/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'doctor/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'providers/:id',
    renderMode: RenderMode.Server,
  },

  // ─── All other static routes — prerendered at build time ───────────────────
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
