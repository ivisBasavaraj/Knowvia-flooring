import React, { useRef, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '../icons/FontAwesomeIcon';

interface SponsorLogo {
  id: string;
  name: string;
  logo: string;
  website?: string;
}

interface UserSponsorHeaderProps {
  sponsors: SponsorLogo[];
}

export const UserSponsorHeader: React.FC<UserSponsorHeaderProps> = ({ sponsors }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons);
      return () => container.removeEventListener('scroll', checkScrollButtons);
    }
  }, [sponsors]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      const newScrollLeft = scrollContainerRef.current.scrollLeft + 
        (direction === 'left' ? -scrollAmount : scrollAmount);
      
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  if (!sponsors || sponsors.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border-b border-gray-200 py-3 sponsor-strip">
      <div className="relative">
        {/* Left scroll button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-white border border-gray-300 rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200"
            aria-label="Scroll left"
          >
            <FontAwesomeIcon icon="fas fa-chevron-left" size={14} className="text-gray-600" />
          </button>
        )}

        {/* Right scroll button */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-white border border-gray-300 rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200"
            aria-label="Scroll right"
          >
            <FontAwesomeIcon icon="fas fa-chevron-right" size={14} className="text-gray-600" />
          </button>
        )}

        {/* Sponsors container */}
        <div 
          ref={scrollContainerRef}
          className="flex space-x-6 px-12 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {sponsors.map((sponsor) => (
            <div
              key={sponsor.id}
              className="flex-shrink-0 bg-white rounded-lg shadow-sm border border-gray-200 p-3 cursor-pointer sponsor-logo hover:shadow-md transition-all duration-200"
              onClick={() => sponsor.website && window.open(sponsor.website, '_blank')}
              title={`Visit ${sponsor.name}`}
            >
              <img
                src={sponsor.logo}
                alt={sponsor.name}
                className="h-8 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.src = `https://via.placeholder.com/120x32/e9ecef/6c757d?text=${sponsor.name}`;
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};