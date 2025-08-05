import React from 'react';
import { X, User, Phone, Mail, UserCheck, Calendar, Home } from 'lucide-react';

const MembersPopup = ({ resident, onClose }) => {
  if (!resident) return null;

  const members = resident.members || [];

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div className="bg-gray-50 rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Family Members & Tenants - {resident.name}
            </h1>
            <p className="text-sm text-gray-600">
              Flat {resident.flatDetails?.flatNumber || 'Not assigned'} | Total Members: {members.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {members.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {members.map((member, index) => (
                <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{member.name}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          member.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800'
                            : member.role === 'family_member'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {member.role === 'family_member' ? 'Family Member' : 
                           member.role === 'tenant' ? 'Tenant' : 'Admin'}
                        </span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      member.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {member.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{member.phone}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{member.email}</span>
                    </div>

                    {member.flatDetails && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Home className="w-4 h-4 text-gray-400" />
                        <span>
                          {member.flatDetails.blockName && `Block ${member.flatDetails.blockName}, `}
                          {member.flatDetails.flatNumber && `Flat ${member.flatDetails.flatNumber}`}
                          {member.flatDetails.floorIndex !== undefined && `, Floor ${member.flatDetails.floorIndex}`}
                        </span>
                      </div>
                    )}

                    {member.addedAt && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>
                          Added on {new Date(member.addedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    )}

                    {member.societyName && (
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          Society: {member.societyName}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <User size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No Members Found</h3>
              <p className="text-gray-500">
                This resident has no family members or tenants registered.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-white p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MembersPopup;
