import React from 'react';
import { AlertCircle, Check } from 'lucide-react';

export default function Notification({ show, message, type }) {
  if (!show) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
      type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`}>
      <p className="flex items-center">
        {type === 'success' ? (
          <Check className="mr-2" size={20} />
        ) : (
          <AlertCircle className="mr-2" size={20} />
        )}
        {message}
      </p>
    </div>
  );
} 