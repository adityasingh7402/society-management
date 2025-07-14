import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import PreloaderSociety from '../../components/PreloaderSociety';
import { Building, Package } from 'lucide-react';
import { usePermissions } from "../../../components/PermissionsContext";
import AccessDenied from "../widget/societyComponents/accessRestricted";

// Camera component with permission handling
const CameraCapture = ({ onCapture }) => {
  const [showCamera, setShowCamera] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState("prompt"); // "prompt", "granted", "denied"
  const [isCameraReady, setCameraReady] = useState(false);
  const webcamRef = useRef(null);

  // Check for camera permissions
  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        // Check if permissions API is available
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: 'camera' });
          setPermissionStatus(result.state);
  
          // Listen for permission changes
          result.onchange = () => {
            setPermissionStatus(result.state);
          };
        } else {
          // Fallback for browsers that don't support the Permissions API
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          setPermissionStatus("granted");
          stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
        }
      } catch (err) {
        console.error("Camera error:", err);
        setPermissionStatus("denied");
      }
    };
  
    checkCameraPermission();
  }, []);

  // Handle when camera is ready
  const handleUserMedia = () => {
    setCameraReady(true);
  };

  // Handle errors (including permission denied)
  const handleUserMediaError = (error) => {
    console.error("Camera error:", error);
    setPermissionStatus("denied");
    setShowCamera(false);
  };

  // Capture photo from webcam
  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      
      // Convert base64 image to file object
      fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], "delivery-photo.jpg", { type: "image/jpeg" });
          onCapture(file);
          setShowCamera(false);
        })
        .catch(err => {
          console.error("Error converting image:", err);
        });
    }
  }, [webcamRef, onCapture]);

  // Request camera access explicitly
  const requestCameraAccess = () => {
    setShowCamera(true);
    // The act of mounting the Webcam component will trigger the permission request
  };

  return (
    <div className="mt-2">
      {!showCamera ? (
        <div>
          <button
            type="button"
            onClick={requestCameraAccess}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {permissionStatus === "denied" ? "Camera Access Denied (Check Settings)" : "Take Photo"}
          </button>
          {permissionStatus === "denied" && (
            <p className="mt-1 text-sm text-red-600">
              Camera access was denied. Please check your browser settings to enable camera access.
            </p>
          )}
        </div>
      ) : (
        <div className="relative">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              width: 320,
              height: 240,
              facingMode: "environment" // Use back camera
            }}
            onUserMedia={handleUserMedia}
            onUserMediaError={handleUserMediaError}
            className="rounded-md border border-gray-300"
          />
          
          {isCameraReady ? (
            <div className="mt-2 flex justify-between">
              <button
                type="button"
                onClick={capturePhoto}
                className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Capture
              </button>
              <button
                type="button"
                onClick={() => setShowCamera(false)}
                className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-md">
              <div className="text-white">Accessing camera...</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function DeliveryManagement() {
  const permissions = usePermissions();
  if (!permissions.includes("manage_security") && !permissions.includes("full_access")) {
    return <AccessDenied />;
  }
  const [loading, setLoading] = useState(false);
  // State for new delivery
  const [deliveryPersonName, setDeliveryPersonName] = useState("");
  const [deliveryImage, setDeliveryImage] = useState(null);
  const [deliveryImagePreview, setDeliveryImagePreview] = useState(null);
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

  // Handle camera capture
  const handleCameraCapture = (file) => {
    setDeliveryImage(file);
    setDeliveryImagePreview(URL.createObjectURL(file));
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDeliveryImage(file);
      setDeliveryImagePreview(URL.createObjectURL(file));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newDelivery = {
        id: deliveryLogs.length + 1,
        deliveryPersonName,
        deliveryImage: deliveryImagePreview,
        deliveryItems,
        flatNo,
        flatOwnerName,
        deliveryTime,
        status
      };
      setDeliveryLogs([newDelivery, ...deliveryLogs]);
      setDeliveryPersonName("");
      setDeliveryImage(null);
      setDeliveryImagePreview(null);
      setDeliveryItems("");
      setFlatNo("");
      setFlatOwnerName("");
      setDeliveryTime("");
      setStatus("Pending");
    } catch (error) {
      console.error('Error submitting delivery:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete delivery log
  const handleDelete = (id) => {
    setDeliveryLogs(deliveryLogs.filter((log) => log.id !== id));
  };

  // Add loading state to fetchDeliveries
  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      // ... existing fetch code ...
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      {loading ? (
        <PreloaderSociety />
      ) : (
        <div className="min-h-screen bg-gray-100">
          <header className="bg-gray-800 shadow-lg border-b-4 border-blue-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center">
                        <Package className="mr-3" size={32} />
                        Delivery Management
                    </h1>
                </div>
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
                    <div className="mt-1 flex flex-col space-y-2">
                      {/* Camera component */}
                      <CameraCapture onCapture={handleCameraCapture} />
                      
                      {/* Traditional file input as fallback */}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      
                      {/* Image preview */}
                      {deliveryImagePreview && (
                        <div className="mt-2">
                          <img
                            src={deliveryImagePreview}
                            alt="Preview"
                            className="h-32 w-32 object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setDeliveryImage(null);
                              setDeliveryImagePreview(null);
                            }}
                            className="mt-1 text-sm text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
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
                                alt={`${log.deliveryPersonName}`}
                                className="h-10 w-10 rounded-full object-cover mr-3"
                              />
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">{log.deliveryPersonName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.deliveryItems}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.flatNo}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.flatOwnerName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.deliveryTime}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            log.status === 'Delivered' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDelete(log.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {deliveryLogs.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No delivery logs found.
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  );
};