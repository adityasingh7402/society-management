import React, { useEffect, useState } from 'react';
import PreloaderSociety from '../../components/PreloaderSociety';

export default function TenantProfile() {
  const [residentList, setResidentList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch residents from the API
  useEffect(() => {
    const fetchResidents = async () => {
      setLoading(true);
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
      finally {
        setLoading(false);
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

  // Handle removal of a resident
  const handleRemove = async (residentId) => {
    const confirmRemove = window.confirm('Are you sure you want to remove this resident?');
    if (confirmRemove) {
      try {
        const response = await fetch(`/api/Resident-Api/${residentId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          // Remove the resident from the list locally
          setResidentList(prevResidents =>
            prevResidents.filter(resident => resident._id !== residentId)
          );
        } else {
          console.error('Failed to remove resident');
        }
      } catch (error) {
        console.error('Error removing resident:', error);
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      {loading ? (
        <PreloaderSociety />
      ) : (
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
                  <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center">
                    <img className='rounded-full' src={resident.userImage || "/profile.png"} alt="Profile" />
                  </div>
                  {/* Resident Details */}
                  <div>
                    <h2 className="text-lg font-semibold text-black">{resident.name}</h2>
                    <h2 className="text-base font-semibold text-black">Flat No: <span className='font-normal'>{resident.flatDetails.flatNumber}</span></h2>
                    <p className="text-sm font-semibold text-gray-600">Email ID: <span className='font-normal'>{resident.email}</span></p>
                    <p className="text-sm font-semibold text-gray-600">Contact No: <span className='font-normal'>{resident.phone}</span></p>
                    <p className="text-sm font-semibold text-gray-600">Address: <span className='font-normal'>
                      {resident.address.street}, {resident.address.city}, {resident.address.state} - {resident.address.pinCode}</span>
                    </p>
                    <p className="text-sm font-semibold text-gray-600">Society:<span className='font-normal'> {resident.societyName}</span></p>
                  </div>
                </div>
                {/* Action Buttons and Status Stamps */}
                <div className="flex space-x-4 items-center">
                  {resident.societyVerification === 'Pending' ? (
                    <>
                      <button
                        onClick={() => handleAction(resident._id, 'Approved')}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200"
                      >
                        Approved
                      </button>
                      <button
                        onClick={() => handleAction(resident._id, 'Rejected')}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-200"
                      >
                        Rejected
                      </button>
                    </>
                  ) : (
                    <>
                      <span
                        className={`text-lg font-semibold ${resident.societyVerification === 'Approved' ? 'text-green-600' : 'text-red-600'
                          }`}
                      >
                        {resident.societyVerification === 'Approved' ? 'Verified' : 'Rejected'}
                      </span>
                      <button
                        onClick={() => handleRemove(resident._id)}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-200"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}