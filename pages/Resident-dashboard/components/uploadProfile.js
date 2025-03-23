import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from "next/router";
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Upload, 
  Crop, 
  Check, 
  Camera, 
  Loader2, 
  Image as ImageIcon,
  User
} from "lucide-react";

const UploadProfile = () => {
    const [image, setImage] = useState(null);
    const [croppedImage, setCroppedImage] = useState(null);
    const [residentDetails, setResidentDetails] = useState({});
    const [residentId, setResidentId] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    
    const cropperRef = useRef(null);
    const fileInputRef = useRef(null);
    const cropperSectionRef = useRef(null);
    const croppedImageRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("Resident");
                if (!token) {
                    router.push("/Login");
                    return;
                }

                const response = await fetch("/api/Resident-Api/get-resident-details", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch profile");
                }

                const data = await response.json();
                setResidentDetails(data);
                setResidentId(data._id);
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setImage(reader.result);
                setTimeout(() => {
                    cropperSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 100);
            };
            reader.readAsDataURL(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleCrop = () => {
        if (cropperRef.current) {
            const cropper = cropperRef.current.cropper;
            const croppedImageUrl = cropper.getCroppedCanvas().toDataURL();
            setCroppedImage(croppedImageUrl);

            setTimeout(() => {
                croppedImageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 100);
        }
    };

    const handleUpload = async () => {
        if (croppedImage && residentId) {
            try {
                setLoading(true);
                const blob = await fetch(croppedImage).then((res) => res.blob());
                const formData = new FormData();
                formData.append('image', blob, 'image.png');
                formData.append('residentId', residentId);

                const response = await fetch('/api/Resident-Api/update-resident-image', {
                    method: 'POST',
                    body: formData,
                });

                const data = await response.json();
                if (response.ok) {
                    console.log('Image uploaded successfully:', data);
                    setUploadSuccess(true);
                    // Update the resident details with the new image
                    setResidentDetails(prev => ({
                        ...prev,
                        userImage: croppedImage
                    }));
                    
                    // Reset after 3 seconds
                    setTimeout(() => {
                        setUploadSuccess(false);
                    }, 3000);
                } else {
                    console.error('Error uploading image:', data.error);
                    alert('Error uploading image. Please try again.');
                }
            } catch (error) {
                console.error('Error uploading image:', error);
                alert('Error uploading image. Please try again.');
            } finally {
                setLoading(false);
            }
        } else {
            alert('Please provide a resident ID and crop the image.');
        }
    };

    const resetProcess = () => {
        setImage(null);
        setCroppedImage(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100">
            {/* Header with back button */}
            <div className="p-4 max-w-4xl mx-auto">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.back()}
                    className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-medium transition-colors p-2 rounded-full hover:bg-blue-100"
                >
                    <ArrowLeft size={16} />
                    <span className="text-sm">Back</span>
                </motion.button>
            </div>

            {/* Main content */}
            <div className="flex flex-col items-center justify-center p-4 max-w-md mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full bg-white rounded-xl shadow-lg p-4 sm:p-6"
                >
                    <h1 className="text-xl sm:text-2xl text-center font-bold mb-6 text-gray-800">
                        Update Profile Picture
                    </h1>

                    {/* Current Profile Image */}
                    <div className="flex flex-col items-center mb-6">
                        <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="relative overflow-hidden rounded-full border-4 border-blue-500 shadow-lg mb-3"
                            style={{ width: "120px", height: "120px" }}
                        >
                            {loading ? (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                                </div>
                            ) : (
                                <img 
                                    className="w-full h-full object-cover"
                                    src={residentDetails.userImage || "/profile.png"} 
                                    alt="Profile" 
                                />
                            )}
                        </motion.div>
                        <p className="text-sm text-gray-600 text-center">
                            {residentDetails.name && `Hello, ${residentDetails.name}`}
                        </p>
                    </div>

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    {/* File Upload Button */}
                    {!image && (
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="mb-6"
                        >
                            <button
                                onClick={triggerFileInput}
                                className="w-full py-3 border-2 border-dashed border-blue-400 rounded-lg flex flex-col items-center justify-center bg-blue-50 hover:bg-blue-100 transition-colors text-blue-600 space-y-1"
                            >
                                <Camera size={32} />
                                <span className="text-sm font-medium">Choose an image</span>
                                <span className="text-xs text-gray-500">Click to browse files</span>
                            </button>
                        </motion.div>
                    )}

                    {/* Image Cropper */}
                    {image && !croppedImage && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            ref={cropperSectionRef}
                            className="mb-6 overflow-hidden"
                        >
                            <div className="mb-3">
                                <h2 className="text-sm font-semibold text-gray-800 mb-1">
                                    Adjust your photo
                                </h2>
                                <p className="text-xs text-gray-600">
                                    Drag and resize to crop
                                </p>
                            </div>
                            
                            <div className="border rounded-lg overflow-hidden mb-4">
                                <Cropper
                                    src={image}
                                    style={{ height: 280, width: '100%' }}
                                    aspectRatio={1}
                                    guides={true}
                                    ref={cropperRef}
                                    viewMode={1}
                                    background={false}
                                    responsive={true}
                                    autoCropArea={1}
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={resetProcess}
                                    className="flex items-center justify-center gap-1 bg-gray-200 text-gray-700 px-2 py-2 rounded-lg hover:bg-gray-300 text-xs sm:text-sm"
                                >
                                    <ArrowLeft size={14} />
                                    <span>Choose again</span>
                                </motion.button>
                                
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={handleCrop}
                                    className="flex items-center justify-center gap-1 bg-blue-600 text-white px-2 py-2 rounded-lg hover:bg-blue-700 text-xs sm:text-sm"
                                >
                                    <Crop size={14} />
                                    <span>Crop Image</span>
                                </motion.button>
                            </div>
                        </motion.div>
                    )}

                    {/* Cropped Image Preview */}
                    {croppedImage && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            ref={croppedImageRef}
                            className="mb-6"
                        >
                            <h2 className="text-sm font-semibold mb-3 text-gray-800">Preview</h2>
                            <div className="flex justify-center">
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-blue-500 shadow-lg"
                                >
                                    <img 
                                        src={croppedImage} 
                                        alt="Cropped" 
                                        className="w-full h-full object-cover" 
                                    />
                                </motion.div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 mt-4">
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={resetProcess}
                                    className="flex items-center justify-center gap-1 bg-gray-200 text-gray-700 px-2 py-2 rounded-lg hover:bg-gray-300 text-xs sm:text-sm"
                                >
                                    <ArrowLeft size={14} />
                                    <span>Start Over</span>
                                </motion.button>
                                
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={handleUpload}
                                    disabled={loading}
                                    className="flex items-center justify-center gap-1 bg-green-600 text-white px-2 py-2 rounded-lg hover:bg-green-700 disabled:bg-green-300 text-xs sm:text-sm"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            <span>Uploading...</span>
                                        </>
                                    ) : uploadSuccess ? (
                                        <>
                                            <Check size={14} />
                                            <span>Uploaded!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={14} />
                                            <span>Upload</span>
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    )}

                    {/* Tips */}
                    <div className="mt-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <h3 className="text-xs font-medium text-blue-800 mb-1 flex items-center">
                            <ImageIcon size={12} className="mr-1" />
                            Tips for a great profile picture
                        </h3>
                        <ul className="text-xs text-blue-700">
                            <li>• Use a clear, well-lit photo</li>
                            <li>• Choose a neutral background</li>
                            <li>• Center your face in the frame</li>
                        </ul>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default UploadProfile;