import React, { useEffect, useState } from 'react';
import { X, Tag, Car, Dog, User, Key } from 'lucide-react';

// Add default props
TagsPopup.defaultProps = {
  resident: {},
  onClose: () => {}
};

export default function TagsPopup({ resident, onClose }) {
  // If we're server-side rendering and don't have a resident, show a loading state
  if (typeof window === 'undefined' && !resident?._id) {
    return null; // Return null during SSR if no resident
  }

  const [activeTab, setActiveTab] = useState('animal');
  const [animalTags, setAnimalTags] = useState([]);
  const [vehicleTags, setVehicleTags] = useState([]);
  const [gatePassTags, setGatePassTags] = useState([]);
  const [servicePassTags, setServicePassTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!resident?._id) return;
    
    const fetchTags = async () => {
      try {
        // Fetch animal tags
        const animalResponse = await fetch(`/api/AnimalTag-Api/get-tags?residentId=${resident._id}`);
        if (animalResponse.ok) {
          const animalData = await animalResponse.json();
          setAnimalTags(animalData);
        }

        // Fetch vehicle tags
        const vehicleResponse = await fetch(`/api/VehicleTag-Api/get-tags?residentId=${resident._id}`);
        if (vehicleResponse.ok) {
          const vehicleData = await vehicleResponse.json();
          setVehicleTags(vehicleData);
        }

        // Fetch gate pass tags
        const gatePassResponse = await fetch(`/api/GatePass-Api/get-passes?residentId=${resident._id}`);
        if (gatePassResponse.ok) {
          const gatePassData = await gatePassResponse.json();
          setGatePassTags(gatePassData);
        }

        // Fetch service pass tags
        const servicePassResponse = await fetch(`/api/ServicePass-Api/get-passes?residentId=${resident._id}`);
        if (servicePassResponse.ok) {
          const servicePassData = await servicePassResponse.json();
          setServicePassTags(servicePassData);
        }
      } catch (error) {
        console.error('Error fetching tags:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, [resident?._id]); // Updated dependency array to use optional chaining

  const renderAnimalTags = () => (
    <div className="space-y-4">
      {animalTags.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No animal tags found</p>
      ) : (
        animalTags.map((tag) => (
          <div key={tag._id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-semibold">{tag.animalDetails?.name || 'N/A'}</h4>
                <p className="text-sm text-gray-600">{tag.animalType}</p>
              </div>
              {tag.status && (
                <span className={`px-2 py-1 text-xs font-semibold rounded ${
                  tag.status === 'Approved' ? 'bg-green-100 text-green-800' :
                  tag.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {tag.status}
                </span>
              )}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Breed:</span>
                <span className="ml-2">{tag.animalDetails?.breed || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500">Gender:</span>
                <span className="ml-2">{tag.animalDetails?.gender || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500">Age:</span>
                <span className="ml-2">{tag.animalDetails?.age || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500">Color:</span>
                <span className="ml-2">{tag.animalDetails?.color || 'N/A'}</span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderVehicleTags = () => (
    <div className="space-y-4">
      {vehicleTags.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No vehicle tags found</p>
      ) : (
        vehicleTags.map((tag) => (
          <div key={tag._id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-semibold">{tag.vehicleDetails?.brand} {tag.vehicleDetails?.model}</h4>
                <p className="text-sm text-gray-600">{tag.vehicleType}</p>
              </div>
              {tag.status && (
                <span className={`px-2 py-1 text-xs font-semibold rounded ${
                  tag.status === 'Approved' ? 'bg-green-100 text-green-800' :
                  tag.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                  tag.status === 'Expired' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {tag.status}
                </span>
              )}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Registration:</span>
                <span className="ml-2">{tag.vehicleDetails?.registrationNumber}</span>
              </div>
              <div>
                <span className="text-gray-500">Color:</span>
                <span className="ml-2">{tag.vehicleDetails?.color}</span>
              </div>
              <div>
                <span className="text-gray-500">Valid From:</span>
                <span className="ml-2">{new Date(tag.validFrom).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-gray-500">Valid Until:</span>
                <span className="ml-2">{new Date(tag.validUntil).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderGatePassTags = () => (
    <div className="space-y-4">
      {gatePassTags.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No gate passes found</p>
      ) : (
        gatePassTags.map((pass) => (
          <div key={pass._id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-semibold">{pass.guestDetails?.name || 'N/A'}</h4>
                <p className="text-sm text-gray-600">{pass.guestDetails?.purpose}</p>
              </div>
              {pass.status && (
                <span className={`px-2 py-1 text-xs font-semibold rounded ${
                  pass.status === 'Approved' ? 'bg-green-100 text-green-800' :
                  pass.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                  pass.status === 'Expired' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {pass.status}
                </span>
              )}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Phone:</span>
                <span className="ml-2">{pass.guestDetails?.phone ? `+91${pass.guestDetails.phone}` : 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500">Valid Until:</span>
                <span className="ml-2">{pass.duration?.endDate ? new Date(pass.duration.endDate).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2">{new Date(pass.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-gray-500">Visitors:</span>
                <span className="ml-2">{pass.numberOfVisitors || 1}</span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderServicePassTags = () => (
    <div className="space-y-4">
      {servicePassTags.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No service passes found</p>
      ) : (
        servicePassTags.map((pass) => (
          <div key={pass._id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-semibold">{pass.personnelDetails?.name || 'N/A'}</h4>
                <p className="text-sm text-gray-600">{pass.personnelDetails?.serviceType}</p>
              </div>
              {pass.status && (
                <span className={`px-2 py-1 text-xs font-semibold rounded ${
                  pass.status === 'Approved' ? 'bg-green-100 text-green-800' :
                  pass.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                  pass.status === 'Expired' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {pass.status}
                </span>
              )}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Phone:</span>
                <span className="ml-2">{pass.personnelDetails?.phone ? `+91${pass.personnelDetails.phone}` : 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500">Valid Until:</span>
                <span className="ml-2">{pass.duration?.endDate ? new Date(pass.duration.endDate).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2">{new Date(pass.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-gray-500">Company:</span>
                <span className="ml-2">{pass.personnelDetails?.company || 'N/A'}</span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Tags & Passes</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => setActiveTab('animal')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                activeTab === 'animal' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Dog size={20} />
              <span>Animal Tags</span>
            </button>
            <button
              onClick={() => setActiveTab('vehicle')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                activeTab === 'vehicle' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Car size={20} />
              <span>Vehicle Tags</span>
            </button>
            <button
              onClick={() => setActiveTab('gate')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                activeTab === 'gate' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <User size={20} />
              <span>Gate Passes</span>
            </button>
            <button
              onClick={() => setActiveTab('service')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                activeTab === 'service' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Key size={20} />
              <span>Service Passes</span>
            </button>
          </div>

          <div className="overflow-y-auto max-h-[60vh]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {activeTab === 'animal' && renderAnimalTags()}
                {activeTab === 'vehicle' && renderVehicleTags()}
                {activeTab === 'gate' && renderGatePassTags()}
                {activeTab === 'service' && renderServicePassTags()}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 