import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  PROJECT_AUTHOR,
  PROJECT_EMAIL,
  PROJECT_LINKEDIN,
  PROJECT_NAME,
  PROJECT_PORTFOLIO,
} from '../lib/projectMetadata';

const MentionsLegales: React.FC = () => {
  return (
    <article className="max-w-3xl mx-auto space-y-10 text-sm text-gray-300 leading-relaxed pb-16">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest"
      >
        <ArrowLeft size={14} /> Retour
      </Link>

      <header className="space-y-2">
        <h1 className="text-3xl font-display font-black text-white uppercase tracking-tight">Mentions légales</h1>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{PROJECT_NAME}</p>
      </header>

      <section className="space-y-3 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 text-amber-100/90 text-xs">
        <p className="font-black uppercase tracking-widest text-amber-200/90">Important</p>
        <p>
          Ce texte informe mais <strong>ne constitue pas un avis juridique</strong>. Pour toute question juridique,
          adressez-vous à un professionnel habilité dans votre juridiction.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-black text-white uppercase tracking-tight">Éditeur & propriété intellectuelle</h2>
        <p>
          Le site et l’application <strong>{PROJECT_NAME}</strong> (code source, structure, textes d’interface créés
          pour le projet) sont édités par :
        </p>
        <ul className="list-disc pl-5 space-y-1 text-gray-400">
          <li>
            <strong className="text-white">{PROJECT_AUTHOR}</strong>
          </li>
          <li>
            Courriel :{' '}
            <a className="text-[#e50914] hover:underline" href={`mailto:${PROJECT_EMAIL}`}>
              {PROJECT_EMAIL}
            </a>
          </li>
          <li>
            LinkedIn :{' '}
            <a className="text-[#e50914] hover:underline" href={PROJECT_LINKEDIN} target="_blank" rel="noopener noreferrer">
              profil public
            </a>
          </li>
          <li>
            Portfolio :{' '}
            <a className="text-[#e50914] hover:underline" href={PROJECT_PORTFOLIO} target="_blank" rel="noopener noreferrer">
              {PROJECT_PORTFOLIO}
            </a>
          </li>
        </ul>
        <p>
          Le code et les éléments originaux du projet sont protégés par le droit d’auteur. Conditions détaillées : fichier{' '}
          <strong className="text-white">LICENSE</strong> à la racine du dépôt (tous droits réservés, sauf autorisation
          écrite).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-black text-white uppercase tracking-tight">Données iptv-org</h2>
        <p>
          Les métadonnées de chaînes (identifiants, noms, catégories, pays, URLs de flux recensées par la communauté,
          etc.) proviennent du projet public{' '}
          <strong className="text-white">iptv-org</strong> (fichiers hébergés sur{' '}
          <a
            className="text-[#e50914] hover:underline"
            href="https://iptv-org.github.io/api/"
            target="_blank"
            rel="noopener noreferrer"
          >
            iptv-org.github.io/api
          </a>
          ). Le dépôt <code className="text-gray-400">iptv-org/api</code> est assorti d’une licence de type{' '}
          <strong className="text-white">domaine public</strong> (voir le fichier LICENSE du dépôt upstream).
        </p>
        <p>
          <strong className="text-white">{PROJECT_NAME}</strong> n’est pas affilié à iptv-org. La présence d’une chaîne
          ou d’une URL dans les données ne préjuge ni de la légalité du flux dans votre pays, ni du respect des droits
          des titulaires de contenus.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-black text-white uppercase tracking-tight">Logiciels tiers (npm)</h2>
        <p>
          L’application s’appuie sur des bibliothèques open source (React, Vite, Firebase, HLS.js, etc.), chacune sous
          sa propre licence. Voir les paquets dans <code className="text-gray-400">node_modules</code> et le fichier{' '}
          <strong className="text-white">NOTICE.md</strong> pour les mentions de tiers.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-black text-white uppercase tracking-tight">Limitation de responsabilité</h2>
        <p>
          Le service est fourni « en l’état ». Aucune garantie n’est donnée quant à la disponibilité des flux, à
          l’adéquation à un usage particulier, ou à l’absence d’erreurs dans les métadonnées. L’utilisateur assume
          l’usage qu’il fait du service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-black text-white uppercase tracking-tight">Contact propriété intellectuelle</h2>
        <p>
          Pour toute réclamation liée au droit d’auteur, une demande de retrait ou une licence d’exploitation du code{' '}
          {PROJECT_NAME} :{' '}
          <a className="text-[#e50914] hover:underline font-semibold" href={`mailto:${PROJECT_EMAIL}`}>
            {PROJECT_EMAIL}
          </a>
          .
        </p>
      </section>
    </article>
  );
};

export default MentionsLegales;
