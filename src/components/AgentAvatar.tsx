import React from 'react';

export interface AvatarProps {
  type: 'ai' | 'male' | 'female';
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const AgentAvatar: React.FC<AvatarProps> = ({
  type,
  name = '',
  size = 'md',
  className = ''
}) => {
  const sizeMap = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
    xl: 'w-14 h-14 text-xl'
  };

  // Determine gender from name if type is human
  let effectiveType = type;
  if (type !== 'ai') {
    const femaleNames = /amelia|sarah|fatima|ayesha|zainab|mary|emma|olivia|sophia|mia|charlotte|ava/i;
    if (femaleNames.test(name)) {
      effectiveType = 'female';
    } else {
      effectiveType = 'male';
    }
  }

  if (effectiveType === 'ai') {
    return (
      <div className={`relative rounded-full bg-gradient-to-tr from-lime-500 to-emerald-400 p-[1.5px] shadow-md flex items-center justify-center flex-shrink-0 ${sizeMap[size]} ${className}`}>
        <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
          <img
            src="/lm-logo.png"
            alt="LeadzMaker AI"
            className="w-full h-full object-cover rounded-full"
          />
        </div>
      </div>
    );
  }

  if (effectiveType === 'female') {
    // Human Female Agent Avatar
    return (
      <div className={`relative rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 p-[1.5px] shadow-md flex items-center justify-center flex-shrink-0 ${sizeMap[size]} ${className}`}>
        <div className="w-full h-full rounded-full bg-[#111827] flex items-center justify-center overflow-hidden">
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="50" fill="#312e81" />
            {/* Hair */}
            <path d="M24 45C24 25 34 16 50 16C66 16 76 25 76 45C76 65 74 78 72 85C66 87 34 87 28 85C26 78 24 65 24 45Z" fill="#38220f" />
            {/* Face */}
            <path d="M31 45C31 33 40 26 50 26C60 26 69 33 69 45C69 60 61 69 50 69C39 69 31 60 31 45Z" fill="#fcd34d" />
            {/* Eyes */}
            <ellipse cx="43" cy="45" rx="3.5" ry="4" fill="#0f172a" />
            <ellipse cx="57" cy="45" rx="3.5" ry="4" fill="#0f172a" />
            <circle cx="44" cy="43.5" r="1.2" fill="#ffffff" />
            <circle cx="58" cy="43.5" r="1.2" fill="#ffffff" />
            {/* Smile */}
            <path d="M45 56C47 58 53 58 55 56" stroke="#be123c" strokeWidth="2" strokeLinecap="round" />
            {/* Jacket */}
            <path d="M28 85C33 75 43 72 50 72C57 72 67 75 72 85Z" fill="#0284c7" />
          </svg>
        </div>
      </div>
    );
  }

  // Stylish Male Agent Avatar (Matching Cool Bitmoji with Sunglasses / Beard)
  return (
    <div className={`relative rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 p-[1.5px] shadow-md flex items-center justify-center flex-shrink-0 ${sizeMap[size]} ${className}`}>
      <div className="w-full h-full rounded-full bg-[#0b0f19] flex items-center justify-center overflow-hidden">
        <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="50" fill="#0f172a" />
          {/* Cool Spiky Hair */}
          <path d="M26 40C26 22 36 12 50 12C64 12 74 22 74 40C74 42 72 44 70 42C67 28 62 20 50 20C38 20 33 28 30 42C28 44 26 42 26 40Z" fill="#18181b" />
          {/* Face */}
          <path d="M30 45C30 32 40 24 50 24C60 24 70 32 70 45C70 60 62 70 50 70C38 70 30 60 30 45Z" fill="#fed7aa" />
          {/* Cool Black Sunglasses (Matching Reference Image 1) */}
          <rect x="33" y="38" width="15" height="11" rx="3" fill="#09090b" stroke="#27272a" strokeWidth="1" />
          <rect x="52" y="38" width="15" height="11" rx="3" fill="#09090b" stroke="#27272a" strokeWidth="1" />
          <path d="M48 42H52" stroke="#27272a" strokeWidth="1.5" />
          {/* Sunglass lens shine */}
          <path d="M35 40L42 47" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
          <path d="M54 40L61 47" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
          {/* Beard / Stubble */}
          <path d="M37 57C40 66 60 66 63 57C64 62 61 68 50 68C39 68 36 62 37 57Z" fill="#27272a" opacity="0.5" />
          {/* Confident Smile */}
          <path d="M44 57C47 60 53 60 56 57" stroke="#9a3412" strokeWidth="2" strokeLinecap="round" />
          {/* Black Jacket / Hoodie */}
          <path d="M26 85C30 73 40 70 50 70C60 70 70 73 74 85C66 93 34 93 26 85Z" fill="#1e293b" />
        </svg>
      </div>
    </div>
  );
};
