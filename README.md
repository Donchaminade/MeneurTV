# MeneurTV - Plateforme IPTV Premium

![MeneurTV](https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&q=80&w=2070)

MeneurTV est une application web moderne et performante conçue pour offrir la meilleure expérience de streaming IPTV. Propulsée par une architecture robuste et une interface utilisateur élégante, MeneurTV permet aux utilisateurs d'accéder à des milliers de chaînes en direct du monde entier avec une fluidité inégalée.

## 🚀 Fonctionnalités Clés

- **Streaming Haute Fidélité** : Support multi-flux avec lecteur HLS optimisé (PiP natif navigateur, mini-lecteur in-app, fenêtre flottante `/pip-player` pour poursuivre la lecture dans une autre fenêtre).
- **Grands Championnats** : Accès direct aux meilleures chaînes de sport (LaLiga, Champions League, Bundesliga).
- **Expérience Personnalisée** : Favoris et notes (étoiles) avec persistance locale (`localStorage`) en complément de Firestore ; profils utilisateurs et historique de visionnage.
- **Recherche & catalogue** : Recherche avancée et liste des chaînes avec pagination d’affichage (« Voir plus », lots de 50) et confort mobile (clavier virtuel : défilement vers les résultats, marge basse via `VisualViewport`).
- **Progressive Web App (PWA)** : Installez MeneurTV sur votre écran d'accueil pour une expérience native sur mobile et desktop.
- **Terminal Admin Sécurisé** : Gestion complète des chaînes, des utilisateurs et des statistiques de trafic.
- **Mode Sécure** : Authentification via Google ou Email/Mot de passe sécurisé par Firebase.

## 💻 Développement

```bash
npm install
npm run dev    # Vite, port 3000 par défaut (voir package.json)
npm run build
npm run lint   # tsc --noEmit
```

## 🛠️ Stack Technique

- **Frontend** : React 19, Vite 6, Tailwind CSS 4.
- **Animation** : Motion (framer-motion).
- **Backend/DB** : Firebase Firestore (NoSQL), Firebase Authentication.
- **API IPTV** : Service personnalisé intégrant des sources IPTV internationales.
- **Visualisation** : Recharts pour les analyses administratives.

## 📱 Installation (PWA)

MeneurTV est une Application Web Progressive. Pour l'installer :
1. Ouvrez l'application dans votre navigateur mobile.
2. Cliquez sur "Ajouter à l'écran d'accueil" dans le menu de votre navigateur.
3. MeneurTV apparaîtra comme une application native avec son propre icône.

## 🔑 Configuration Admin

Le panneau d'administration est accessible via `/admin`. Seuls les utilisateurs avec des droits `isAdmin` peuvent y accéder. Le Super Admin est configuré par défaut via email.

---

Développé avec ❤️ pour une expérience TV sans compromis.
