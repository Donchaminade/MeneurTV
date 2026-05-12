# MeneurTV - Plateforme IPTV Premium

![MeneurTV](https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&q=80&w=2070)

MeneurTV est une application web moderne et performante conçue pour offrir la meilleure expérience de streaming IPTV. Propulsée par une architecture robuste et une interface utilisateur élégante, MeneurTV permet aux utilisateurs d'accéder à des milliers de chaînes en direct du monde entier avec une fluidité inégalée.

## 🚀 Fonctionnalités Clés

- **Streaming Haute Fidélité** : Lecteur HLS (PiP navigateur, mini-lecteur in-app, fenêtre dédiée `/pip-player`).
- **Grands Championnats** : Mise en avant de chaînes sportives (LaLiga, Premier League, beIN, Canal+, DAZN, etc.) sur l’accueil.
- **Pour Vous** (`/pour-vous`) : sélection éditoriale (cinéma, sport, séries, animés) avec **sous-types**, filtres (pays, langue `fra`, logo, favoris), **À la une** (suggestions aléatoires), **Reprendre** (historique local des dernières chaînes ouvertes) et mémorisation du défilement horizontal des rangées.
- **Expérience personnalisée** : favoris et notes (Firestore + `localStorage` en secours) ; sur la fiche chaîne, partage natif (**Web Share**) ou copie du lien ; historique de visionnage côté compte quand connecté.
- **Recherche & catalogue** : le catalogue IPTV n’est chargé pour la **barre de recherche** qu’à la saisie / au focus (moins de travail au chargement des autres pages). Recherche avec filtres (catégorie, pays, **langue** — les langues proviennent des flux `feeds.json` d’[iptv-org](https://github.com/iptv-org/api), voir ci-dessous). Liste des chaînes et recherche avec **pagination d’affichage** (« Voir plus », paquets de 50) et confort mobile (`VisualViewport`).
- **Progressive Web App (PWA)** : installation sur l’écran d’accueil.
- **Admin** (`/admin`) : gestion des utilisateurs et statistiques (Recharts), réservé aux comptes `isAdmin`.
- **Authentification** : Google ou e-mail / mot de passe (Firebase).

## Propriété intellectuelle, licences & mentions

- **Code MeneurTV** : **tous droits réservés** — voir le fichier **`LICENSE`** à la racine (propriétaire ; pas de réutilisation sans accord écrit).
- **Signature / auteur** : **Chaminade Dondah Adjolou** — e-mail `chaminade.dondah.adjolou@gmail.com`, [LinkedIn](https://www.linkedin.com/in/chaminadeadjolou), [portfolio](https://donchaminade-alpha.vercel.app). Métadonnées centralisées dans `src/lib/projectMetadata.ts` ; bannière de copyright en tête des **chunks** de production (`vite.config.ts`).
- **Tiers** : **`NOTICE.md`** (iptv-org en domaine public, bibliothèques npm). **`LEGAL.md`** : avertissements (non avis juridique), responsabilité, contact PI.
- **Page application** : **`/mentions-legales`** (lien dans le pied de page).

Les métadonnées de chaînes proviennent du catalogue public **iptv-org** ; elles ne sont pas « la propriété » de MeneurTV — voir `NOTICE.md`.

## 💻 Développement

```bash
npm install
npm run dev    # Vite, port 3000 par défaut (voir package.json)
npm run build
npm run lint   # tsc --noEmit
```

## Référencement (Google & moteurs)

- **Balises** : `index.html` inclut titre, description, mots-clés (MeneurTV, Meneur TV, meneur-tv), Open Graph, Twitter Card, `lang="fr"`.
- **Build** : définis **`APP_URL`** (URL publique **sans** slash final) avant `npm run build`. Vite injecte alors le **canonical**, les **URLs absolues** Open Graph / Twitter, un **JSON-LD** `WebSite` + `SearchAction` (recherche `/search?q=…`), et génère **`sitemap.xml`** + **`robots.txt`** (avec `Disallow: /admin`).
- **Déploiement actuel** : [https://meneur-tv.vercel.app/](https://meneur-tv.vercel.app/) — pour Vercel, `APP_URL` est déjà renseigné dans `vercel.json` → `build.env` pour que chaque build produise le bon sitemap et les bonnes meta. En local, crée un `.env` avec `APP_URL=https://meneur-tv.vercel.app` si tu veux tester un build identique à la prod.
- Sans `APP_URL`, le build reste valide mais sans canonical / sitemap / og:url (voir `dist/robots.txt`).
- **Search Console** : [Google Search Console](https://search.google.com/search-console) — propriété `https://meneur-tv.vercel.app` → Sitemaps → `https://meneur-tv.vercel.app/sitemap.xml`. Le positionnement dépend aussi des **liens entrants**, du **contenu** et du **temps**.

### Valider la propriété (écran « Valider la propriété »)

Google fournit un **fichier** ou une **balise meta** : le contenu est **unique à ton compte**, on ne peut pas le deviner dans le dépôt.

1. **Fichier HTML** (recommandé sur l’écran) : télécharge `google9f6678488b8a298a.html` (nom exact affiché chez toi), **sans rien modifier dedans**. Place-le dans le dossier **`public/`** à la racine du projet, commit, push → Vercel déploie → l’URL doit répondre en **navigation privée** : `https://meneur-tv.vercel.app/google9f6678488b8a298a.html`. Puis clique **Valider** dans Search Console.
2. **Balise HTML** : dans Search Console, ouvre « Balise HTML », copie uniquement la valeur de **`content="..."`**. Dans Vercel → **Settings → Environment Variables** → ajoute **`GOOGLE_SITE_VERIFICATION`** = cette valeur (Production), puis **redeploy**. Au build, Vite injecte `<meta name="google-site-verification" content="…" />` dans la page d’accueil.

Tu n’as besoin que **d’une** des deux méthodes. Si tu utilises le fichier, ne modifie ni son nom ni son contenu ([documentation Google](https://support.google.com/webmasters/answer/9008080)).

## 🛠️ Stack technique

- **Frontend** : React 19, Vite 6, Tailwind CSS 4, React Router 7.
- **Découpage** : routes principales en **lazy loading** (`React.lazy`) + écran de chargement léger.
- **Animation** : Motion.
- **Backend** : Firebase Authentication + Firestore.
- **Données chaînes (IPTV)** : catalogue public [iptv-org.github.io/api](https://iptv-org.github.io/api/) (dépôt [iptv-org/api](https://github.com/iptv-org/api)) — `channels.json`, `streams.json`, `logos.json`, `categories.json`, `languages.json`, `countries.json`, **`feeds.json`**. Depuis avril 2025, le champ `languages` n’existe plus sur les chaînes : l’app **agrège les codes langue** à partir de `feeds.json`. Seules les chaînes avec au moins une URL de flux connue sont proposées.
- **Admin** : Recharts pour les graphiques.

### Build & déploiement

- **`APP_URL`** : voir section SEO ci-dessus (canonical, sitemap, Open Graph).
- **Vercel** : `vercel.json` peut définir des en-têtes de cache pour les assets statiques.
- Le build peut afficher un avertissement sur des chunks **> 500 kB** (Firebase, HLS, Recharts) : comportement normal, pas une erreur de compilation.

## 📱 Installation (PWA)

MeneurTV est une Application Web Progressive. Pour l'installer :
1. Ouvrez l'application dans votre navigateur mobile.
2. Cliquez sur "Ajouter à l'écran d'accueil" dans le menu de votre navigateur.
3. MeneurTV apparaîtra comme une application native avec son propre icône.

## 🔑 Configuration Admin

Le panneau d'administration est accessible via `/admin`. Seuls les utilisateurs avec des droits `isAdmin` peuvent y accéder. Le Super Admin est configuré par défaut via email.

---

Développé avec ❤️ pour une expérience TV sans compromis.
