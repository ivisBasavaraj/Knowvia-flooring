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

interface UserBoothInfoPopupProps {
  booth: BoothElement;
  company?: Company;
  onClose: () => void;
}

export const UserBoothInfoPopup: React.FC<UserBoothInfoPopupProps> = ({ booth, company, onClose }) => {
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'reserved':
        return 'bg-orange-100 text-orange-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      case 'occupied':
        return 'bg-blue-100 text-blue-800';
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      case 'on-hold':
        return 'On Hold';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              {/* Company Logo */}
              {company?.logo ? (
                <img
                  src={company.logo}
                  alt={company.name}
                  className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 
                flex items-center justify-center text-white font-bold text-xl
                ${company?.logo ? 'hidden' : ''}`}>
                {company?.name?.charAt(0).toUpperCase() || booth.number.charAt(0)}
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {company?.name || `Booth ${booth.number}`}
                </h3>
                <p className="text-gray-600">Booth #{booth.number}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(company?.status || 'available')}`}>
                    {getStatusText(company?.status || 'available')}
                  </div>
                  {company?.featured && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs 
                      font-medium bg-purple-100 text-purple-800">
                      <FontAwesomeIcon icon="fas fa-star" size={10} className="mr-1" />
                      Featured
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FontAwesomeIcon icon="fas fa-times" size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Company Description */}
          {company?.description && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <FontAwesomeIcon icon="fas fa-info-circle" size={16} className="mr-2 text-blue-500" />
                About Company
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed">{company.description}</p>
            </div>
          )}

          {/* Booth Details */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <FontAwesomeIcon icon="fas fa-building" size={16} className="mr-2 text-green-500" />
              Booth Information
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-500 block mb-1">Booth Number</span>
                <p className="font-medium text-gray-900">{booth.number}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-500 block mb-1">Floor Level</span>
                <p className="font-medium text-gray-900">Level {company?.floor || 1}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-500 block mb-1">Category</span>
                <p className="font-medium text-gray-900">{company?.category || 'General'}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <span className="text-gray-500 block mb-1">Dimensions</span>
                <p className="font-medium text-gray-900">{booth.width}" × {booth.height}"</p>
                <p className="text-xs text-gray-500">
                  {Math.round(booth.width * 0.0254 * 10) / 10}m × {Math.round(booth.height * 0.0254 * 10) / 10}m
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          {company?.contact && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <FontAwesomeIcon icon="fas fa-address-book" size={16} className="mr-2 text-purple-500" />
                Contact Information
              </h4>
              <div className="space-y-3">
                {company.contact.phone && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FontAwesomeIcon icon="fas fa-phone" size={14} className="text-blue-600" />
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
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <FontAwesomeIcon icon="fas fa-envelope" size={14} className="text-green-600" />
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
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FontAwesomeIcon icon="fas fa-globe" size={14} className="text-purple-600" />
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

          {/* Booth Position */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <FontAwesomeIcon icon="fas fa-map-marker-alt" size={16} className="mr-2 text-red-500" />
              Location Details
            </h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 block mb-1">X Position</span>
                  <p className="font-medium text-gray-900">{Math.round(booth.x)}px</p>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Y Position</span>
                  <p className="font-medium text-gray-900">{Math.round(booth.y)}px</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            {company?.contact?.website || company?.website ? (
              <button 
                onClick={() => window.open(company.contact?.website || company.website, '_blank')}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 
                  transition-colors font-medium text-sm flex items-center justify-center gap-2"
              >
                <FontAwesomeIcon icon="fas fa-external-link-alt" size={14} />
                Visit Website
              </button>
            ) : (
              <button className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 
                transition-colors font-medium text-sm flex items-center justify-center gap-2">
                <FontAwesomeIcon icon="fas fa-info-circle" size={14} />
                More Info
              </button>
            )}
            {company?.contact?.email && (
              <button 
                onClick={() => window.open(`mailto:${company.contact?.email}`, '_blank')}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 
                  transition-colors font-medium text-sm flex items-center justify-center gap-2"
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