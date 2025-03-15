import React, { useState } from 'react';

export default function DeliveryManagement() {
  // State for new delivery
  const [deliveryPersonName, setDeliveryPersonName] = useState("");
  const [deliveryImage, setDeliveryImage] = useState(null);
  const [deliveryItems, setDeliveryItems] = useState("");
  const [flatNo, setFlatNo] = useState("");
  const [flatOwnerName, setFlatOwnerName] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [status, setStatus] = useState("Pending");

  // State for delivery logs
  const [deliveryLogs, setDeliveryLogs] = useState([
    {
      id: 1,
      deliveryPersonName: "John Doe",
      deliveryImage: "https://as1.ftcdn.net/jpg/02/60/28/22/1000_F_260282262_8pYvjq98FTz7MscAGPXpWPvm7VGgz9yx.jpg",
      deliveryItems: "Groceries",
      flatNo: "A-201",
      flatOwnerName: "Rahul Sharma",
      deliveryTime: "2025-03-15 10:00 AM",
      status: "Delivered"
    },
    {
      id: 2,
      deliveryPersonName: "Jane Smith",
      deliveryImage: "https://as1.ftcdn.net/jpg/02/60/28/22/1000_F_260282262_8pYvjq98FTz7MscAGPXpWPvm7VGgz9yx.jpg",
      deliveryItems: "Parcel",
      flatNo: "B-404",
      flatOwnerName: "Anita Patel",
      deliveryTime: "2025-03-16 05:00 PM",
      status: "Pending"
    }
  ]);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const newDelivery = {
      id: deliveryLogs.length + 1,
      deliveryPersonName,
      deliveryImage: deliveryImage ? URL.createObjectURL(deliveryImage) : null,
      deliveryItems,
      flatNo,
      flatOwnerName,
      deliveryTime,
      status
    };
    setDeliveryLogs([newDelivery, ...deliveryLogs]);
    setDeliveryPersonName("");
    setDeliveryImage(null);
    setDeliveryItems("");
    setFlatNo("");
    setFlatOwnerName("");
    setDeliveryTime("");
    setStatus("Pending");
  };

  // Handle delete delivery log
  const handleDelete = (id) => {
    setDeliveryLogs(deliveryLogs.filter((log) => log.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Delivery Management</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* New Delivery Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Delivery</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Delivery Person Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Delivery Person Name</label>
                <input
                  type="text"
                  value={deliveryPersonName}
                  onChange={(e) => setDeliveryPersonName(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              {/* Delivery Image (Camera Capture) */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Delivery Person Image</label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment" // Opens the camera for image capture
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setDeliveryImage(file);
                    }
                  }}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Delivery Items */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Delivery Items</label>
                <input
                  type="text"
                  value={deliveryItems}
                  onChange={(e) => setDeliveryItems(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              {/* Flat No */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Flat No.</label>
                <input
                  type="text"
                  value={flatNo}
                  onChange={(e) => setFlatNo(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              {/* Flat Owner Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Flat Owner Name</label>
                <input
                  type="text"
                  value={flatOwnerName}
                  onChange={(e) => setFlatOwnerName(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              {/* Delivery Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Delivery Time</label>
                <input
                  type="datetime-local"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="Pending">Pending</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-6">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Delivery
              </button>
            </div>
          </form>
        </div>

        {/* Delivery Logs Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <h2 className="text-xl font-semibold text-gray-900 p-6 border-b border-gray-200">Delivery Logs</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Person</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flat No.</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flat Owner</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Time</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deliveryLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {log.deliveryImage && (
                          <img
                            src={log.deliveryImage}
                            alt={log.deliveryPersonName}
                            className="h-10 w-10 rounded-full"
                          />
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{log.deliveryPersonName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.deliveryItems}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.flatNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.flatOwnerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.deliveryTime}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          log.status === "Delivered"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}