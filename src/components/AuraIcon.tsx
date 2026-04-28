import React from 'react';
import { motion } from 'motion/react';

interface AuraIconProps {
  className?: string;
}

export const AuraIcon: React.FC<AuraIconProps> = ({ className }) => {
  return (
    <div className={className}>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Outer Layer - Faintest */}
        <motion.path
          d="M12 2C8 2 4 6 4 11C4 16 8 22 12 22C16 22 20 16 20 11C20 6 16 2C12 2Z"
          fill="currentColor"
          fillOpacity="0.1"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        {/* Middle Layer */}
        <motion.path
          d="M12 5C9.5 5 7 8 7 11.5C7 15 9.5 19 12 19C14.5 19 17 15 17 11.5C17 8 14.5 5 12 5Z"
          fill="currentColor"
          fillOpacity="0.2"
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
        />
        {/* Inner Core */}
        <motion.path
          d="M12 8C10.5 8 9 10 9 12C9 14 10.5 16 12 16C13.5 16 15 14 15 12C15 10 13.5 8 12 8Z"
          fill="currentColor"
          fillOpacity="0.6"
          animate={{
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        {/* Wave details */}
        <motion.path
          d="M12 4C12 4 10 7 10 11C10 15 12 20 12 20"
          stroke="currentColor"
          strokeWidth="0.5"
          strokeLinecap="round"
          strokeOpacity="0.3"
          animate={{
            d: [
              "M12 4C12 4 10 7 10 11C10 15 12 20 12 20",
              "M12 4C12 4 14 7 14 11C14 15 12 20 12 20",
              "M12 4C12 4 10 7 10 11C10 15 12 20 12 20"
            ]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </svg>
    </div>
  );
};
