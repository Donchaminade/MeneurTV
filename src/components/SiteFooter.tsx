import React from 'react';
import { Link } from 'react-router-dom';
import {
  PROJECT_AUTHOR,
  PROJECT_COPYRIGHT,
  PROJECT_EMAIL,
  PROJECT_LINKEDIN,
  PROJECT_PORTFOLIO,
} from '../lib/projectMetadata';

const SiteFooter: React.FC = () => {
  return (
    <footer className="border-t border-white/5 bg-black/40 mt-auto mb-20 md:mb-0">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-6 text-[10px] sm:text-xs text-gray-500 leading-relaxed">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="font-black uppercase tracking-widest text-gray-600 mb-1">{PROJECT_COPYRIGHT}</p>
            <p>
              Auteur :{' '}
              <span className="text-gray-400 font-semibold">{PROJECT_AUTHOR}</span>
            </p>
            <p className="mt-1">
              <a href={`mailto:${PROJECT_EMAIL}`} className="text-[#e50914]/90 hover:underline">
                {PROJECT_EMAIL}
              </a>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 shrink-0">
            <Link to="/mentions-legales" className="font-black uppercase tracking-widest text-gray-400 hover:text-white">
              Mentions légales
            </Link>
            <a
              href={PROJECT_LINKEDIN}
              target="_blank"
              rel="noopener noreferrer"
              className="font-black uppercase tracking-widest text-gray-400 hover:text-white"
            >
              LinkedIn
            </a>
            <a
              href={PROJECT_PORTFOLIO}
              target="_blank"
              rel="noopener noreferrer"
              className="font-black uppercase tracking-widest text-gray-400 hover:text-white"
            >
              Portfolio
            </a>
          </div>
        </div>
        <p className="mt-4 text-[9px] text-gray-600 max-w-3xl">
          Code et interface MeneurTV : licence propriétaire (fichier LICENSE). Données de chaînes : métadonnées
          publiques iptv-org (voir NOTICE.md). Usage des flux : responsabilité de l’utilisateur.
        </p>
      </div>
    </footer>
  );
};

export default SiteFooter;
