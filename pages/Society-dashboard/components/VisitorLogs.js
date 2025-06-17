import React, { useState, useEffect } from 'react';
import PreloaderSociety from '../../components/PreloaderSociety';

const VisitorLogs = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchVisitorLogs();
  }, []);

  const fetchVisitorLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/VisitorApi/Get-All-Visitors');
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error('Error fetching visitor logs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      {loading ? (
        <PreloaderSociety />
      ) : (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Visitor Logs</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitor Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entry Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.visitorName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.purpose}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.entryTime).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        log.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                        log.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitorLogs;