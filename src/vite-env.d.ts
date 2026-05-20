/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Proxy de lecture : remplace `{url}` par l’URL encodée du flux.
   * Ex. `https://mon-serveur.com/iptv-proxy?u={url}` (à implémenter vous-même pour CORS).
   */
  readonly VITE_STREAM_PROXY_TEMPLATE?: string;
  /**
   * URL (JSON) fusionnée avec iptv-org : objet `{ "ChaîneId": ["https://flux…"], … }`.
   * Fichier hébergé par vous ; les id doivent correspondre aux id iptv-org.
   */
  readonly VITE_EXTRA_STREAMS_URL?: string;
}
