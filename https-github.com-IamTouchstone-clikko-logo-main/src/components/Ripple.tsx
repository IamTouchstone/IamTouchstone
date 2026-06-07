import { motion } from 'motion/react';

interface RippleProps {
  ripples: { id: number; x: number; y: number }[];
  onAnimationComplete: (id: number) => void;
}

export default function Ripple({ ripples, onAnimationComplete }: RippleProps) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full border border-teal-400 bg-teal-500/15"
          initial={{
            width: 0,
            height: 0,
            x: ripple.x,
            y: ripple.y,
            opacity: 0.8,
            translateY: '-50%',
            translateX: '-50%',
          }}
          animate={{
            width: 320,
            height: 320,
            opacity: 0,
          }}
          transition={{
            duration: 0.8,
            ease: [0.1, 0.8, 0.3, 1], // fluid organic outward easing
          }}
          onAnimationComplete={() => onAnimationComplete(ripple.id)}
        />
      ))}
    </div>
  );
}
