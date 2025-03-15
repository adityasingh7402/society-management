import React, { useState } from 'react';

export default function VisitorLogs() {
  const [visitorName, setVisitorName] = useState("");
  const [visitorImage, setVisitorImage] = useState(null);
  const [visitorDetails, setVisitorDetails] = useState("");
  const [flatNo, setFlatNo] = useState("");
  const [flatOwnerName, setFlatOwnerName] = useState("");
  const [entryTime, setEntryTime] = useState("");
  const [exitTime, setExitTime] = useState("");

  const [visitorLogs, setVisitorLogs] = useState([
    {
      id: 1,
      visitorName: "John Doe",
      visitorImage: "https://as1.ftcdn.net/jpg/02/60/28/22/1000_F_260282262_8pYvjq98FTz7MscAGPXpWPvm7VGgz9yx.jpg",
      visitorDetails: "Delivery personnel",
      flatNo: "A-201",
      flatOwnerName: "Rahul Sharma",
      entryTime: "2025-03-15 10:00 AM",
      exitTime: "2025-03-15 10:30 AM"
    }
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newVisitor = {
      id: visitorLogs.length + 1,
      visitorName,
      visitorImage: visitorImage ? URL.createObjectURL(visitorImage) : null,
      visitorDetails,
      flatNo,
      flatOwnerName,
      entryTime,
      exitTime
    };
    setVisitorLogs([newVisitor, ...visitorLogs]);
    setVisitorName("");
    setVisitorImage(null);
    setVisitorDetails("");
    setFlatNo("");
    setFlatOwnerName("");
    setEntryTime("");
    setExitTime("");
  };

  const handleDelete = (id) => {
    setVisitorLogs(visitorLogs.filter((log) => log.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Visitor Logs</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Visitor</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Visitor Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Visitor Name</label>
                <input
                  type="text"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              {/* Visitor Image (Camera Capture) */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Visitor Image</label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment" // Opens the camera for image capture
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setVisitorImage(file);
                    }
                  }}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Visitor Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Visitor Details</label>
                <input
                  type="text"
                  value={visitorDetails}
                  onChange={(e) => setVisitorDetails(e.target.value)}
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

              {/* Entry Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Entry Time</label>
                <input
                  type="datetime-local"
                  value={entryTime}
                  onChange={(e) => setEntryTime(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              {/* Exit Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Exit Time</label>
                <input
                  type="datetime-local"
                  value={exitTime}
                  onChange={(e) => setExitTime(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-6">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Visitor
              </button>
            </div>
          </form>
        </div>

        {/* Visitor Logs Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <h2 className="text-xl font-semibold text-gray-900 p-6 border-b border-gray-200">Visitor Logs</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitor</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flat No.</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Flat Owner</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entry Time</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exit Time</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {visitorLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {log.visitorImage && (
                          <img
                            src={log.visitorImage}
                            alt={log.visitorName}
                            className="h-10 w-10 rounded-full"
                          />
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{log.visitorName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.visitorDetails}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.flatNo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.flatOwnerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.entryTime}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.exitTime || "N/A"}</td>
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