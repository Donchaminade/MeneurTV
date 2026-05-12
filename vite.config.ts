import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
          { path: '/channels', p: '0.9', c: 'weekly' as const },
          { path: '/search', p: '0.85', c: 'weekly' as const },
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
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
