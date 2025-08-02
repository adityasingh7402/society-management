import React, { useState } from 'react';
import { X, Image, User, Send } from 'lucide-react';

const MaintenanceDetailsPopup = ({ ticket, onClose, onComment }) => {
  if (!ticket) return null;

  const [comment, setComment] = useState('');

  const handleComment = () => {
    if (comment.trim()) {
      onComment(ticket, comment);
      setComment('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div className="bg-gray-50 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
          <h1 className="text-xl font-semibold text-gray-900">Request Details #{ticket.referenceNumber}</h1>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-12 gap-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {/* Left Column - Request Details */}
          <div className="col-span-4 space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Details</h2>
              <div className="text-sm text-gray-600">
                <p className="mb-2"><strong>Description:</strong> {ticket.description}</p>
                <p className="mb-2"><strong>Category:</strong> {ticket.category}</p>
                <p className="mb-2"><strong>Priority:</strong> {ticket.priority}</p>
                <p><strong>Status:</strong> {ticket.status}</p>
              </div>
            </div>
          </div>

          {/* Right Column - Images & Comments */}
          <div className="col-span-8 space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Images</h2>
              <div className="grid grid-cols-3 gap-4">
                {ticket.images.map((url, idx) => (
                  <div key={idx} className="aspect-w-1 aspect-h-1 bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      className="object-cover hover:scale-105 transition-transform cursor-pointer"
                      src={url}
                      alt={`Image ${idx + 1}`}
                      onClick={() => window.open(url, '_blank')}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Comments</h2>
              <div className="space-y-4 max-h-60 overflow-y-auto">
                {ticket.comments.map((comment, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <User className={`w-6 h-6 ${comment.isAdmin || comment.userType === 'society' ? 'text-blue-600' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-lg p-3">
                      <div className="text-sm font-medium text-gray-900">
                        {comment.isAdmin || comment.userType === 'society' ? (
                          <span className="text-blue-600">Society Admin</span>
                        ) : (
                          comment.createdBy
                        )}
                        {comment.role && (comment.isAdmin || comment.userType === 'society') && (
                          <span className="text-xs text-gray-500 ml-1">({comment.role})</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">{comment.text}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(comment.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center space-x-3">
                <input
                  type="text"
                  className="flex-1 border border-gray-300 rounded-md p-2 text-sm"
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <button
                  onClick={handleComment}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
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

export default MaintenanceDetailsPopup;

