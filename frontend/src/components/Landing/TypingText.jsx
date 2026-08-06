import { motion } from 'framer-motion';
import { useTypewriter } from '../../hooks/useTypewriter';

export default function TypingText({ words }) {
  const typed = useTypewriter(words, 72, 2200);
  
  return (
    <span className="lnd-typed-wrap">
      <span className="lnd-typed">{typed}</span>
      <motion.span 
        className="lnd-cursor"
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      >
        |
      </motion.span>
    </span>
  );
}
