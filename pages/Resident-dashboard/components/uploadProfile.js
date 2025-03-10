import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from "next/router";
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { FaArrowLeft } from "react-icons/fa";

const UploadProfile = () => {
    const [image, setImage] = useState(null); // Store the uploaded image
    const [croppedImage, setCroppedImage] = useState(null); // Store the cropped image
    const [residentDetails, setResidentDetails] = useState({});
    const [residentId, setResidentId] = useState('');
    const cropperRef = useRef(null); // Reference to the cropper instance
    const cropperSectionRef = useRef(null); // Ref to scroll to cropper
    const croppedImageRef = useRef(null); // Ref to scroll to cropped image
    const router = useRouter();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
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
            }
        };

        fetchProfile();
    }, [router]);

    // Handle file input change
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setImage(reader.result); // Set the image for cropping
                setTimeout(() => {
                    cropperSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 100);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle crop button click
    const handleCrop = () => {
        if (cropperRef.current) {
            const cropper = cropperRef.current.cropper;
            const croppedImageUrl = cropper.getCroppedCanvas().toDataURL(); // Get the cropped image
            setCroppedImage(croppedImageUrl);

            setTimeout(() => {
                croppedImageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 100);
        }
    };

    // Handle upload button click
    const handleUpload = async () => {
        if (croppedImage && residentId) {
            try {
                // Convert the cropped image to a Blob
                const blob = await fetch(croppedImage).then((res) => res.blob());

                // Create a FormData object
                const formData = new FormData();
                formData.append('image', blob, 'image.png'); // Append the image file
                formData.append('residentId', residentId); // Append the resident ID

                // Send the request to the backend API
                const response = await fetch('/api/Resident-Api/update-resident-image', {
                    method: 'POST',
                    body: formData,
                });

                const data = await response.json();
                if (response.ok) {
                    console.log('Image uploaded successfully:', data);
                    alert('Image uploaded successfully!');
                } else {
                    console.error('Error uploading image:', data.error);
                    alert('Error uploading image. Please try again.');
                }
            } catch (error) {
                console.error('Error uploading image:', error);
                alert('Error uploading image. Please try again.');
            }
        } else {
            alert('Please provide a resident ID and crop the image.');
        }
    };

    return (
        <>
            <div className="m-6">
                <button
                    onClick={() => router.back()} // Navigate back to the previous page
                    className="flex items-center space-x-2 text-blue-500 hover:text-blue-600 font-semibold transition-colors"
                >
                    <FaArrowLeft size={18} />
                    <span className="text-base">Back</span>
                </button>
            </div>
            <div className="min-h-screen bg-gray-100 flex flex-col space-y-10 items-center justify-center p-4">
                <div className="image-container flex justify-center items-center border border-gray-600 w-52 h-52 rounded-full">
                    <img className='rounded-full' src={residentDetails.userImage || "/profile.png"} alt="Profile" />
                </div>
                <h1 className="text-3xl text-center font-bold mb-8 text-gray-800">Upload and Crop Your Image</h1>
                
                {/* File Input */}
                <div className="mb-8">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                </div>

                {/* Image Cropper */}
                {image && (
                    <div ref={cropperSectionRef} className="mb-8">
                        <Cropper
                            src={image}
                            style={{ height: 400, width: '100%' }}
                            aspectRatio={1} // Square crop
                            guides={true}
                            ref={cropperRef}
                        />
                        <button
                            onClick={handleCrop}
                            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Crop Image
                        </button>
                    </div>
                )}

                {/* Cropped Image Preview */}
                {croppedImage && (
                    <div ref={croppedImageRef} className="mb-8">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Cropped Image Preview</h2>
                        <img src={croppedImage} alt="Cropped" className="max-w-full h-auto rounded-lg shadow-lg" />
                    </div>
                )}

                {/* Upload Button */}
                {croppedImage && (
                    <button
                        onClick={handleUpload}
                        className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
                    >
                        Upload Image
                    </button>
                )}
            </div>
        </>
    );
};

export default UploadProfile;
