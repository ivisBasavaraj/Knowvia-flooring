import React from 'react';
import { BoothElement } from '../../types/canvas';
import { FontAwesomeIcon } from '../icons/FontAwesomeIcon';

interface Company {
  id: string;
  name: string;
  booth_number: string;
  floor: number;
  status: 'available' | 'sold' | 'reserved';
  category: string;
  description?: string;
  logo?: string;
  featured: boolean;
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  website?: string;
}

interface ProfessionalBoothPopupProps {
  booth: BoothElement;
  company?: Company;
  onClose: () => void;
}

export const ProfessionalBoothPopup: React.FC<ProfessionalBoothPopupProps> = ({ 
  booth, 
  company, 
  onClose 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'reserved':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'sold':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'occupied':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'reserved':
        return 'Reserved';
      case 'sold':
        return 'Occupied';
      case 'occupied':
        return 'Occupied';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="professional-popup">
        {/* Header */}
        <div className="professional-popup-header">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden bg-white bg-opacity-20 flex items-center justify-center">
              {company?.logo ? (
                <img
                  src={company.logo}
                  alt={company.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`text-white font-bold text-xl ${company?.logo ? 'hidden' : ''}`}>
                {company?.name?.charAt(0).toUpperCase() || booth.number.charAt(0)}
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl font-bold">
                {company?.name || `Booth ${booth.number}`}
              </h3>
              <p className="opacity-90">Booth #{booth.number}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(company?.status || 'available')}`}>
                  {getStatusText(company?.status || 'available')}
                </div>
                {company?.featured && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs 
                    font-medium bg-white bg-opacity-20 text-white border border-white border-opacity-30">
                    <FontAwesomeIcon icon="fas fa-star" size={10} className="mr-1" />
                    Featured
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="professional-popup-close"
          >
            <FontAwesomeIcon icon="fas fa-times" size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="professional-popup-content">
          {/* Company Description */}
          {company?.description && (
            <div className="professional-popup-section">
              <h4 className="professional-popup-section-title">
                <FontAwesomeIcon icon="fas fa-info-circle" size={16} className="text-blue-500" />
                About Company
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed">{company.description}</p>
            </div>
          )}

          {/* Booth Details */}
          <div className="professional-popup-section">
            <h4 className="professional-popup-section-title">
              <FontAwesomeIcon icon="fas fa-building" size={16} className="text-green-500" />
              Booth Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-500 block mb-1 text-sm">Booth Number</span>
                <p className="font-medium text-gray-900">{booth.number}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-500 block mb-1 text-sm">Floor Level</span>
                <p className="font-medium text-gray-900">Level {company?.floor || 1}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-500 block mb-1 text-sm">Category</span>
                <p className="font-medium text-gray-900">{company?.category || 'General'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-500 block mb-1 text-sm">Dimensions</span>
                <p className="font-medium text-gray-900">{booth.width}" × {booth.height}"</p>
                <p className="text-xs text-gray-500">
                  {Math.round(booth.width * 0.0254 * 10) / 10}m × {Math.round(booth.height * 0.0254 * 10) / 10}m
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          {company?.contact && (
            <div className="professional-popup-section">
              <h4 className="professional-popup-section-title">
                <FontAwesomeIcon icon="fas fa-address-book" size={16} className="text-purple-500" />
                Contact Information
              </h4>
              <div className="space-y-2">
                {company.contact.phone && (
                  <div className="professional-contact-item">
                    <div className="professional-contact-icon phone">
                      <FontAwesomeIcon icon="fas fa-phone" size={14} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <a 
                        href={`tel:${company.contact.phone}`}
                        className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {company.contact.phone}
                      </a>
                    </div>
                  </div>
                )}
                {company.contact.email && (
                  <div className="professional-contact-item">
                    <div className="professional-contact-icon email">
                      <FontAwesomeIcon icon="fas fa-envelope" size={14} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <a 
                        href={`mailto:${company.contact.email}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {company.contact.email}
                      </a>
                    </div>
                  </div>
                )}
                {(company.contact.website || company.website) && (
                  <div className="professional-contact-item">
                    <div className="professional-contact-icon website">
                      <FontAwesomeIcon icon="fas fa-globe" size={14} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Website</p>
                      <a 
                        href={company.contact.website || company.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {(company.contact.website || company.website)?.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="professional-action-buttons">
            {company?.contact?.website || company?.website ? (
              <button 
                onClick={() => window.open(company.contact?.website || company.website, '_blank')}
                className="professional-button primary"
              >
                <FontAwesomeIcon icon="fas fa-external-link-alt" size={14} />
                Visit Website
              </button>
            ) : (
              <button className="professional-button primary">
                <FontAwesomeIcon icon="fas fa-info-circle" size={14} />
                More Info
              </button>
            )}
            {company?.contact?.email && (
              <button 
                onClick={() => window.open(`mailto:${company.contact?.email}`, '_blank')}
                className="professional-button secondary"
              >
                <FontAwesomeIcon icon="fas fa-envelope" size={14} />
                Contact
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};