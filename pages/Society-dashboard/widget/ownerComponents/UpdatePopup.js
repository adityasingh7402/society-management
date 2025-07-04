import React from 'react';

export default function UpdatePopup({ formData, onChange, onSubmit, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all duration-300 ease-in-out scale-100">
        <div className="relative">
          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-2xl p-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Update Profile
              </h2>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-8">
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-5">
                {/* Name Input */}
                <div className="relative group">
                  <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={onChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 outline-none focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-gray-100 focus:bg-white text-gray-800"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Email Input */}
                <div className="relative group">
                  <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={onChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 outline-none focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-gray-100 focus:bg-white text-gray-800"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Phone Input */}
                <div className="relative group">
                  <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={onChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 outline-none focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-gray-100 focus:bg-white text-gray-800"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition-all duration-200 transform hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
                >
                  Update Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 