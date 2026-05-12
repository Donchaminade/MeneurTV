import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MENEURTV_BUILD_BANNER = `/*!
 * MeneurTV — bundle de production
 * Copyright (c) 2025-2026 Chaminade Dondah Adjolou. Tous droits réservés.
 * chaminade.dondah.adjolou@gmail.com
 * LinkedIn: https://www.linkedin.com/in/chaminadeadjolou
 * Portfolio: https://donchaminade-alpha.vercel.app
 * Licence logiciel : voir LICENSE (propriétaire). Données chaînes : iptv-org — NOTICE.md.
 */\n`;

function escapeHtmlAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function meneurTvSeo(siteBaseUrl: string | undefined, googleSiteVerification: string | undefined) {
  const base = siteBaseUrl?.replace(/\/$/, '').trim() || '';
  const gsv = googleSiteVerification?.trim() || '';

  return [
    {
      name: 'meneurtv-html-seo',
      transformIndexHtml(html: string) {
        let out = html;
        if (!base) {
          out = out
            .split('\n')
            .filter((line) => !line.includes('%SITE_URL%'))
            .join('\n');
        } else {
          out = out.replace(/%SITE_URL%/g, base);
        }

        const headInjections: string[] = [];
        if (gsv) {
          headInjections.push(
            `<meta name="google-site-verification" content="${escapeHtmlAttr(gsv)}" />`
          );
        }
        if (base) {
          const ld = {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'MeneurTV',
            alternateName: ['Meneur TV', 'meneur-tv'],
            url: `${base}/`,
            description:
              'Plateforme de streaming IPTV : chaînes en direct, recherche avancée, favoris, lecture HD.',
            inLanguage: 'fr-FR',
            potentialAction: {
              '@type': 'SearchAction',
              target: `${base}/search?q={search_term_string}`,
              'query-input': 'required name=search_term_string',
            },
          };
          headInjections.push(`<script type="application/ld+json">${JSON.stringify(ld)}</script>`);
        }
        if (headInjections.length) {
          out = out.replace('</head>', `\n    ${headInjections.join('\n    ')}\n  </head>`);
        }
        return out;
      },
    },
    {
      name: 'meneurtv-sitemap-robots',
      closeBundle() {
        const dist = path.join(__dirname, 'dist');
        if (!fs.existsSync(dist)) return;
        if (!base) {
          fs.writeFileSync(
            path.join(dist, 'robots.txt'),
            [
              'User-agent: *',
              'Allow: /',
              '',
              '# Pour un sitemap : créer .env.production avec APP_URL=https://votre-domaine puis npm run build',
              '',
            ].join('\n'),
            'utf8'
          );
          return;
        }
        const lastmod = new Date().toISOString().split('T')[0];
        const routes = [
          { path: '/', p: '1.0', c: 'weekly' as const },
          { path: '/pour-vous', p: '0.95', c: 'weekly' as const },
          { path: '/channels', p: '0.9', c: 'weekly' as const },
          { path: '/search', p: '0.85', c: 'weekly' as const },
          { path: '/mentions-legales', p: '0.35', c: 'yearly' as const },
          { path: '/donate', p: '0.6', c: 'monthly' as const },
          { path: '/profile', p: '0.5', c: 'monthly' as const },
        ];
        const urls = routes
          .map(
            (r) => `  <url>
    <loc>${r.path === '/' ? `${base}/` : `${base}${r.path}`}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${r.c}</changefreq>
    <priority>${r.p}</priority>
  </url>`
          )
          .join('\n');
        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
        fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap, 'utf8');
        fs.writeFileSync(
          path.join(dist, 'robots.txt'),
          [
            'User-agent: *',
            'Allow: /',
            '',
            'Disallow: /admin',
            '',
            `Sitemap: ${base}/sitemap.xml`,
            '',
          ].join('\n'),
          'utf8'
        );
      },
    },
  ];
}

function faviconRedirectDev(): import('vite').Plugin {
  const middleware = (
    req: { url?: string },
    res: { statusCode: number; setHeader: (k: string, v: string) => void; end: () => void },
    next: () => void
  ) => {
    const url = req.url?.split('?')[0];
    if (url === '/favicon.ico') {
      res.statusCode = 302;
      res.setHeader('Location', '/logo.svg');
      res.end();
      return;
    }
    next();
  };
  return {
    name: 'meneurtv-favicon-redirect',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const siteUrl = (env.APP_URL || env.VITE_SITE_URL || '').trim();
  const googleSiteVerification = (env.GOOGLE_SITE_VERIFICATION || '').trim();

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'MeneurTV — IPTV en direct',
          short_name: 'MeneurTV',
          description:
            'MeneurTV : streaming IPTV, milliers de chaînes live, recherche, favoris. Meneur TV / meneur-tv.',
          theme_color: '#e50914',
          icons: [
            {
              src: 'logo.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable',
            },
          ],
        },
      }),
      faviconRedirectDev(),
      ...meneurTvSeo(siteUrl || undefined, googleSiteVerification || undefined),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      sourcemap: 'hidden',
      rollupOptions: {
        output: {
          banner: MENEURTV_BUILD_BANNER,
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('recharts') || id.includes('d3-')) return 'vendor-recharts';
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('hls.js')) return 'vendor-hls';
            if (id.includes('motion') || id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('lucide-react')) return 'vendor-icons';
            return undefined;
          },
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
