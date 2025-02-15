import React, { useEffect, useState } from 'react';

export default function OwnerProfile() {
  const [residentList, setResidentList] = useState([]);

  // Fetch residents from the API
  useEffect(() => {
    const fetchResidents = async () => {
      try {
        const response = await fetch('/api/Resident-Api/getAllResidents');
        if (response.ok) {
          const data = await response.json();
          setResidentList(data);
        } else {
          console.error('Failed to fetch residents');
        }
      } catch (error) {
        console.error('Error fetching residents:', error);
      }
    };

    fetchResidents();
  }, []);

  // Handle approval or rejection of a resident
  const handleAction = async (residentId, action) => {
    try {
      const response = await fetch(`/api/Resident-Api/${residentId}/${action}`, {
        method: 'PUT',
      });

      if (response.ok) {
        // Update the resident list locally
        setResidentList(prevResidents =>
          prevResidents.map(resident =>
            resident._id === residentId
              ? { ...resident, societyVerification: action }
              : resident
          )
        );
      } else {
        console.error('Failed to update resident status');
      }
    } catch (error) {
      console.error('Error updating resident status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-6 text-black">Resident Profiles</h1>
      <div className="space-y-4">
        {residentList.map(resident => (
          <div
            key={resident._id}
            className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              {/* Dummy Profile Picture */}
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-lg">👤</span>
              </div>
              {/* Resident Details */}
              <div>
                <h2 className="text-lg font-semibold text-black">{resident.name}</h2>
                <p className="text-sm text-gray-600">{resident.email}</p>
                <p className="text-sm text-gray-600">{resident.phone}</p>
                <p className="text-sm text-gray-600">
                  {resident.address.street}, {resident.address.city}, {resident.address.state} - {resident.address.pinCode}
                </p>
                <p className="text-sm text-gray-600">Society: {resident.societyName}</p>
              </div>
            </div>
            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => handleAction(resident._id, 'Approved')}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200"
              >
                Approved
              </button>
              <button
                onClick={() => handleAction(resident._id, 'Reject')}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-200"
              >
                Rejected
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}