import { useEffect, useState } from 'react';

/**
 * Estime l’espace masqué en bas de l’écran (clavier virtuel, barres système)
 * via VisualViewport pour permettre le scroll du contenu au-dessus du clavier.
 */
export function useVisualViewportInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const hiddenBottom = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setInset(Math.round(hiddenBottom));
    };

    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    update();

    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return inset;
}
