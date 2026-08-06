import { useState, useEffect } from 'react';

export function useCounter(target, duration = 1800) {
  const [val, setVal] = useState(0);
  
  useEffect(() => {
    let v = 0;
    const step = target / (duration / 16);
    const id = setInterval(() => {
      v += step;
      if (v >= target) { 
        setVal(target); 
        clearInterval(id); 
      } else {
        setVal(Math.floor(v));
      }
    }, 16);
    
    return () => clearInterval(id);
  }, [target, duration]);
  
  return val;
}
