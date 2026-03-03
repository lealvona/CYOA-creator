import { type FC } from 'react';
import './LoadingSpinner.css';

export interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Optional text label */
  text?: string;
  /** Whether to show fullscreen overlay */
  fullscreen?: boolean;
  /** Custom class name */
  className?: string;
}

export const LoadingSpinner: FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text,
  fullscreen = false,
  className = '' 
}) => {
  const sizeClass = `loading-spinner--${size}`;
  
  const spinner = (
    <div className={`loading-spinner ${sizeClass} ${className}`} role="status" aria-live="polite">
      <div className="loading-spinner__circle">
        <svg viewBox="0 0 50 50" className="loading-spinner__svg">
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke="var(--brand-primary)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="80"
            strokeDashoffset="60"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 25 25"
              to="360 25 25"
              dur="1s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
      </div>
      {text && (
        <span className="loading-spinner__text">{text}</span>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="loading-spinner__overlay">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
