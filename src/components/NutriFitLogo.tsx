import React from 'react';

interface NutriFitLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const NutriFitLogo: React.FC<NutriFitLogoProps> = ({ 
  size = 'md', 
  showText = true, 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className={`flex items-center ${className}`}>
      {/* NutriFit Icon - Leaf + Dumbbell Fusion */}
      <div className={`${sizeClasses[size]} relative mr-3 flex-shrink-0`}>
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Leaf part (nutrition) */}
          <path
            d="M8 16C8 9.373 13.373 4 20 4C20.552 4 21 4.448 21 5C21 11.627 15.627 17 9 17C8.448 17 8 16.552 8 16Z"
            className="fill-primary"
          />
          
          {/* Dumbbell part (fitness) */}
          <rect
            x="4"
            y="14"
            width="4"
            height="4"
            rx="2"
            className="fill-secondary"
          />
          <rect
            x="24"
            y="14"
            width="4"
            height="4"
            rx="2"
            className="fill-secondary"
          />
          <rect
            x="8"
            y="15"
            width="16"
            height="2"
            className="fill-secondary"
          />
          
          {/* Connecting element */}
          <circle
            cx="16"
            cy="16"
            r="3"
            className="fill-accent"
          />
          
          {/* Leaf vein detail */}
          <path
            d="M12 8C14 10 16 12 18 14"
            stroke="white"
            strokeWidth="1"
            strokeLinecap="round"
            className="stroke-primary-foreground opacity-60"
          />
        </svg>
      </div>
      
      {/* NutriFit Text */}
      {showText && (
        <h1 className={`${textSizeClasses[size]} font-bold gradient-text`}>
          NutriFit
        </h1>
      )}
    </div>
  );
};