import { useState, useEffect } from 'react';

export function useTypewriter(words, speed = 72, pause = 2200) {
  const [s, set] = useState({ wi: 0, ci: 0, del: false, text: '' });
  
  useEffect(() => {
    const word = words[s.wi];
    let delay = s.del ? speed / 2 : speed;
    if (!s.del && s.ci === word.length) delay = pause;
    
    const t = setTimeout(() => {
      set(p => {
        const w = words[p.wi];
        if (!p.del && p.ci < w.length) return { ...p, ci: p.ci + 1, text: w.slice(0, p.ci + 1) };
        if (!p.del && p.ci === w.length) return { ...p, del: true };
        if (p.del && p.ci > 0) return { ...p, ci: p.ci - 1, text: w.slice(0, p.ci - 1) };
        return { wi: (p.wi + 1) % words.length, ci: 0, del: false, text: '' };
      });
    }, delay);
    
    return () => clearTimeout(t);
  }, [s, words, speed, pause]);
  
  return s.text;
}
