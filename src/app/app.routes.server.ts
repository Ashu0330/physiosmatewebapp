import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // ─── Client-only Routes (auth & booking flow) ─────────────────────────────
  {
    path: 'booking/**',
    renderMode: RenderMode.Client,
  },
  {
    path: 'register',
    renderMode: RenderMode.Client,
  },
  {
    path: 'complete-solo-profile',
    renderMode: RenderMode.Client,
  },
  {
    path: 'login',
    renderMode: RenderMode.Client,
  },
  {
    path: 'signup',
    renderMode: RenderMode.Client,
  },
  {
    path: 'doctor-dashboard/**',
    renderMode: RenderMode.Client,
  },
  {
    path: 'clinic-dashboard/**',
    renderMode: RenderMode.Client,
  },
  {
    path: 'user-dashboard/**',
    renderMode: RenderMode.Client,
  },
  {
    path: 'settings',
    renderMode: RenderMode.Client,
  },
  {
    path: 'practice-management',
    renderMode: RenderMode.Client,
  },
  {
    path: 'schedule-treatment',
    renderMode: RenderMode.Client,
  },
  {
    path: 'consultancy-list',
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
    path: 'find-doctors',
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
