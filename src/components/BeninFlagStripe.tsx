import React from 'react';

interface BeninFlagStripeProps {
  height?: string;
  className?: string;
}

const BeninFlagStripe: React.FC<BeninFlagStripeProps> = ({ 
  height = '0.4cm',
  className = '' 
}) => {
  return (
    <div 
      className={`benin-flag-stripe w-full flex ${className}`}
      style={{ height }}
    >
      <div className="stripe-green flex-1" />
      <div className="stripe-yellow flex-1" />
      <div className="stripe-red flex-1" />
    </div>
  );
};

export default BeninFlagStripe;
