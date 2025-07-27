import React from 'react';
import { BoothElement } from '../../types/canvas';
import { FontAwesomeIcon } from '../icons/FontAwesomeIcon';

interface BoothInfoPopupProps {
  booth: BoothElement;
  onClose: () => void;
}

export const BoothInfoPopup: React.FC<BoothInfoPopupProps> = ({ booth, onClose }) => {
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'reserved':
        return 'bg-orange-100 text-orange-800';
      case 'sold':
        return 'bg-red-100 text-red-800';
      case 'on-hold':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 max-w-md w-full z-10">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold">Booth #{booth.number}</h3>
          <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(booth.status)}`}>
            {booth.status.charAt(0).toUpperCase() + booth.status.slice(1)}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <FontAwesomeIcon icon="fas fa-times" size={20} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Booth Details */}
        <div className="border-b pb-4">
          <h4 className="font-medium text-gray-700 mb-2">Booth Details</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">Dimensions (Imperial):</span>
              <p>{booth.dimensions.imperial}</p>
            </div>
            <div>
              <span className="text-gray-500">Dimensions (Metric):</span>
              <p>{booth.dimensions.metric}</p>
            </div>
            {booth.price && (
              <div className="col-span-2">
                <span className="text-gray-500">Price:</span>
                <p>${booth.price.toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>

        {/* Exhibitor Information */}
        {booth.exhibitor ? (
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Exhibitor Information</h4>
            <div className="space-y-2">
              <div className="flex items-start">
                <FontAwesomeIcon icon="fas fa-building" size={18} className="text-gray-400 mr-2 mt-0.5" />
                <div>
                  <p className="font-medium">{booth.exhibitor.companyName}</p>
                  {booth.exhibitor.description && (
                    <p className="text-sm text-gray-600 mt-1">{booth.exhibitor.description}</p>
                  )}
                </div>
              </div>

              {booth.exhibitor.category && (
                <div className="flex items-center">
                  <FontAwesomeIcon icon="fas fa-tag" size={18} className="text-gray-400 mr-2" />
                  <p className="text-sm">{booth.exhibitor.category}</p>
                </div>
              )}

              {booth.exhibitor.contact && (
                <div className="mt-2 space-y-1 text-sm">
                  {booth.exhibitor.contact.phone && (
                    <div className="flex items-center">
                      <FontAwesomeIcon icon="fas fa-phone" size={16} className="text-gray-400 mr-2" />
                      <p>{booth.exhibitor.contact.phone}</p>
                    </div>
                  )}
                  {booth.exhibitor.contact.email && (
                    <div className="flex items-center">
                      <FontAwesomeIcon icon="fas fa-envelope" size={16} className="text-gray-400 mr-2" />
                      <p>{booth.exhibitor.contact.email}</p>
                    </div>
                  )}
                  {booth.exhibitor.contact.website && (
                    <div className="flex items-center">
                      <FontAwesomeIcon icon="fas fa-globe" size={16} className="text-gray-400 mr-2" />
                      <a 
                        href={booth.exhibitor.contact.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {booth.exhibitor.contact.website}
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4 border-t">
            <FontAwesomeIcon icon="fas fa-user" size={24} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No exhibitor information available</p>
            {booth.status === 'available' && (
              <p className="text-sm text-blue-600 mt-1">This booth is available for booking</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};