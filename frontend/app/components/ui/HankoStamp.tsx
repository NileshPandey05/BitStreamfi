import React from 'react';

interface HankoStampProps {
  primaryKanji?: string;
  subKanji?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  title?: string;
}

export const HankoStamp: React.FC<HankoStampProps> = ({
  primaryKanji = '水流', // Suiryū (Stream Flow)
  subKanji = '自律', // Jiritsu (Autonomous)
  size = 'md',
  className = '',
  title = 'BitStreamfi Hanko Stamp (水流 - Continuous Flow)',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-[9px]',
    md: 'w-11 h-11 text-[11px]',
    lg: 'w-14 h-14 text-[13px]',
  };

  return (
    <div
      title={title}
      className={`relative inline-flex items-center justify-center select-none font-serif cursor-pointer transition-transform duration-300 hover:scale-105 ${sizeClasses[size]} ${className}`}
    >
      {/* Outer Stamp Box with carved lacquer red feel */}
      <div className="absolute inset-0 bg-[#A62626] border-2 border-[#D43838] rounded-xs shadow-[0_0_12px_rgba(212,56,56,0.35)] flex items-center justify-center p-[2px]">
        {/* Inner Carved Framing Line */}
        <div className="w-full h-full border border-[#FF6B6B]/40 rounded-[1px] flex flex-col items-center justify-center text-[#FFF1EE] font-bold tracking-widest leading-none">
          <span className="scale-95 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">{primaryKanji}</span>
          {subKanji && (
            <span className="text-[7px] tracking-normal opacity-85 scale-90 pt-[1px] border-t border-[#FF6B6B]/30 w-3/4 text-center">
              {subKanji}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
