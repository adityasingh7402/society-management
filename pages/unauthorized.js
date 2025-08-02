import React from 'react';
import { useRouter } from 'next/router';
import { Shield, Home, ArrowLeft } from 'lucide-react';

export default function Unauthorized() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Icon */}
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield className="w-10 h-10 text-red-600" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Access Restricted
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          You don't have permission to access this page. This feature is restricted to residents and tenants only.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* <button
            onClick={() => router.back()}
            className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </button> */}
          
          <button
            onClick={() => router.push('/Resident-dashboard')}
            className="w-full flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
          >
            <Home className="w-5 h-5 mr-2" />
            Go to Dashboard
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            If you believe this is an error, please contact the main resident or property administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
