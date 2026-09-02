import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'booking/**',
    renderMode: RenderMode.Client,
  },
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
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
