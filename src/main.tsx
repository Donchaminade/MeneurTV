/*!
 * MeneurTV — point d’entrée
 * © 2025-2026 Chaminade Dondah Adjolou — Tous droits réservés.
 * chaminade.dondah.adjolou@gmail.com | https://donchaminade-alpha.vercel.app
 * Voir LICENSE à la racine du dépôt.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
