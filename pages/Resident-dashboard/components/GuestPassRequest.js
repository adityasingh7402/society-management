import React, { useState, useEffect } from 'react';
import { Calendar, Users, Car, AlertCircle, ChevronDown, ChevronUp, RefreshCw, Plus, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Define CSS animations
const animationStyles = `
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-down {
  animation: slideDown 0.2s ease-out;
}
`;

const GuestPassRequest = ({ residentId, societyId }) => {
  const [formData, setFormData] = useState({
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    purpose: '',
    numberOfGuests: 1,
    validFrom: '',
    validUntil: '',
    hasVehicle: false,
    vehicleNumber: '',
    vehicleType: 'None'
  });
  const [loading, setLoading] = useState(false);
  const [guestPasses, setGuestPasses] = useState([]);
  const [expandedPass, setExpandedPass] = useState(null);
  const [loadingPasses, setLoadingPasses] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/GuestPass-Api/create-pass', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          residentId,
          societyId,
          guestDetails: {
            name: formData.guestName,
            phone: formData.guestPhone,
            email: formData.guestEmail,
            purpose: formData.purpose,
            numberOfGuests: parseInt(formData.numberOfGuests)
          },
          validFrom: formData.validFrom,
          validUntil: formData.validUntil,
          vehicleDetails: formData.hasVehicle ? {
            vehicleNumber: formData.vehicleNumber,
            vehicleType: formData.vehicleType
          } : undefined
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      toast.success('Guest pass request submitted successfully');
      setFormData({
        guestName: '',
        guestPhone: '',
        guestEmail: '',
        purpose: '',
        numberOfGuests: 1,
        validFrom: '',
        validUntil: '',
        hasVehicle: false,
        vehicleNumber: '',
        vehicleType: 'None'
      });
      fetchGuestPasses(); // Refresh the list
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const fetchGuestPasses = async () => {
    try {
      const response = await fetch(`/api/GuestPass-Api/get-passes?residentId=${residentId}`);
      const data = await response.json();
      if (response.ok) {
        setGuestPasses(data.passes);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error('Failed to fetch guest passes');
    } finally {
      setLoadingPasses(false);
    }
  };

  useEffect(() => {
    fetchGuestPasses();
  }, [residentId]);

  const togglePassExpansion = (passId) => {
    setExpandedPass(expandedPass === passId ? null : passId);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const getStatusColor = (status, validUntil) => {
    const isExpired = new Date(validUntil) <= new Date();
    if (isExpired) return 'bg-gray-100 text-gray-600';
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-600';
      case 'Pending': return 'bg-yellow-100 text-yellow-600';
      case 'Rejected': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <style>{animationStyles}</style>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Guest Passes</h1>
          <p className="text-gray-600">Manage guest access passes</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchGuestPasses}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Request Form */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Request New Guest Pass</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Guest Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guest Name</label>
              <input
                type="text"
                name="guestName"
                value={formData.guestName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                name="guestPhone"
                value={formData.guestPhone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
              <input
                type="email"
                name="guestEmail"
                value={formData.guestEmail}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Guests</label>
              <input
                type="number"
                name="numberOfGuests"
                value={formData.numberOfGuests}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purpose of Visit</label>
            <textarea
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              rows="2"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Validity Period */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
              <div className="relative">
                <input
                  type="datetime-local"
                  name="validFrom"
                  value={formData.validFrom}
                  onChange={handleChange}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                  required
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
              <div className="relative">
                <input
                  type="datetime-local"
                  name="validUntil"
                  value={formData.validUntil}
                  onChange={handleChange}
                  min={formData.validFrom || new Date().toISOString().slice(0, 16)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                  required
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="hasVehicle"
                id="hasVehicle"
                checked={formData.hasVehicle}
                onChange={handleChange}
                className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="hasVehicle" className="ml-2 text-sm font-medium text-gray-700">
                Guest has a vehicle
              </label>
            </div>

            {formData.hasVehicle && (
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
                  <input
                    type="text"
                    name="vehicleNumber"
                    value={formData.vehicleNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required={formData.hasVehicle}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required={formData.hasVehicle}
                  >
                    <option value="Car">Car</option>
                    <option value="Bike">Bike</option>
                    <option value="Bicycle">Bicycle</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all ${
              loading
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
            }`}
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>

          {/* Info Note */}
          <div className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <p>
              Your request will be reviewed by the society administration. Once approved,
              you'll receive a QR code that your guest can use for entry.
            </p>
          </div>
        </form>
      </div>

      {/* Guest Passes List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Guest Passes</h2>
        
        {loadingPasses ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading passes...</p>
          </div>
        ) : guestPasses.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl shadow-lg">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No guest passes found</p>
          </div>
        ) : (
          guestPasses.map((pass) => {
            const isExpired = new Date(pass.validUntil) <= new Date();
            const statusColor = getStatusColor(pass.status, pass.validUntil);
            const isExpanded = expandedPass === pass._id;

            return (
              <div
                key={pass._id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow animate-fade-in-up"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{pass.guestDetails.name}</h3>
                      <p className="text-sm text-gray-600">
                        {pass.guestDetails.phone} • {pass.guestDetails.numberOfGuests} {pass.guestDetails.numberOfGuests === 1 ? 'guest' : 'guests'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}>
                        <span>{isExpired ? 'Expired' : pass.status}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Valid until: {formatDate(pass.validUntil)}
                      </p>
                    </div>

                    {pass.qrCode && pass.status === 'Approved' && !isExpired && (
                      <button
                        onClick={() => togglePassExpansion(pass._id)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* QR Code Section - Collapsible */}
                {pass.qrCode && pass.status === 'Approved' && !isExpired && isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100 animate-slide-down">
                    <div className="flex flex-col items-center">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Guest Access QR Code</h4>
                      <img
                        src={pass.qrCode}
                        alt="QR Code"
                        className="w-48 h-48 object-contain rounded-lg shadow-md"
                      />
                      <p className="text-xs text-gray-500 mt-2">Share this QR code with your guest for entry</p>
                    </div>
                  </div>
                )}

                {/* Additional Details */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Purpose</p>
                      <p className="font-medium text-gray-900">{pass.guestDetails.purpose}</p>
                    </div>
                    {pass.vehicleDetails && pass.vehicleDetails.vehicleNumber && (
                      <div>
                        <p className="text-gray-600">Vehicle</p>
                        <p className="font-medium text-gray-900">
                          {pass.vehicleDetails.vehicleType} • {pass.vehicleDetails.vehicleNumber}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default GuestPassRequest; 