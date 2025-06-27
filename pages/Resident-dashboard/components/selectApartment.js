import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Building, Layers, Home, Save, Loader, Check, AlertCircle, X, Clock, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function FlatSelection({ residentId }) {
    const [blocks, setBlocks] = useState([]);
    const [selectedBlock, setSelectedBlock] = useState("");
    const [selectedFloor, setSelectedFloor] = useState("");
    const [selectedFlat, setSelectedFlat] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showApprovalPopup, setShowApprovalPopup] = useState(false);
    const [residentDetails, setResidentDetails] = useState({});
    const [structureType, setStructureType] = useState('block');
    const [customStructureName, setCustomStructureName] = useState('');
    const [notification, setNotification] = useState({
        show: false,
        type: 'success',
        message: ''
    });
    const [selectedFlatDetails, setSelectedFlatDetails] = useState(null);
    const router = useRouter();

    const notificationVariants = {
        hidden: { opacity: 0, y: -50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
        exit: { opacity: 0, y: -50, transition: { duration: 0.2 } }
    };

    // Popup animation variants
    const popupVariants = {
        hidden: { 
            opacity: 0,
            scale: 0.5,
            y: 20
        },
        visible: { 
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                type: "spring",
                duration: 0.5,
                bounce: 0.3
            }
        },
        exit: { 
            opacity: 0,
            scale: 0.5,
            y: 20,
            transition: {
                duration: 0.3
            }
        }
    };

    // Get structure type label (singular)
    const getStructureLabel = () => {
        if (structureType === 'block') return 'Block';
        if (structureType === 'wing') return 'Wing';
        if (structureType === 'tower') return 'Tower';
        if (structureType === 'custom') return customStructureName || 'Unit';
        return 'Block';
    };

    // Get the structure icon
    const getStructureIcon = () => {
        if (structureType === 'tower') return <Building className="text-blue-600 mr-2" size={18} />;
        return <Building className="text-blue-600 mr-2" size={18} />;
    };

    // Fetch resident details
    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("Resident");
                if (!token) {
                    router.push("/login");
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
            } catch (error) {
                console.error("Error fetching profile:", error);
                localStorage.removeItem("Resident");
                router.push("/login");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]); 

    // Fetch apartment structure when resident details are available
    useEffect(() => {
        if (!residentDetails.societyCode) return;

        const fetchApartmentStructure = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/Resident-Api/get-apartment-structure?societyId=${residentDetails.societyCode}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch apartment structure");
                }
                
                const structureData = await response.json();
                
                if (structureData.success && structureData.data) {
                    setBlocks(structureData.data.structures || []);
                    
                    if (structureData.structureType) {
                        setStructureType(structureData.structureType);
                    }
                    
                    if (structureData.customStructureName) {
                        setCustomStructureName(structureData.customStructureName);
                    }
                } else {
                    console.error("Apartment structure data is invalid:", structureData);
                    setBlocks([]);
                }
            } catch (error) {
                console.error("Error fetching apartment structure:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchApartmentStructure();
    }, [residentDetails.societyCode]);
    
    // Auto-hide notification after 5 seconds
    useEffect(() => {
        let timer;
        if (notification.show) {
            timer = setTimeout(() => {
                setNotification({ ...notification, show: false });
            }, 5000);
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [notification.show]);

    // Handle flat selection submission
    async function handleSubmit() {
        if (!selectedBlock || !selectedFloor || !selectedFlat) {
            setNotification({
                show: true,
                type: 'error',
                message: `Please select ${getStructureLabel().toLowerCase()}, floor, and flat.`
            });
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch("/api/Resident-Api/flatUpdate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    societyId: residentDetails.societyCode,
                    blockName: selectedBlock,
                    floorIndex: Number(selectedFloor) + 1,
                    flatNumber: selectedFlat,
                    residentId: residentDetails._id,
                    structureType: structureType
                }),
            });

            const result = await response.json();

            setNotification({
                show: true,
                type: 'success',
                message: result.message
            });

            // Set selected flat details for the popup
            setSelectedFlatDetails({
                block: selectedBlock,
                floor: Number(selectedFloor) + 1,
                flat: selectedFlat
            });

            // Show approval popup
            setShowApprovalPopup(true);

            // Redirect to dashboard after 5 seconds
            setTimeout(() => {
                router.push('/Resident-dashboard');
            }, 5000);

        } catch (error) {
            console.error("Error updating flat details:", error);
            setNotification({
                show: true,
                type: 'error',
                message: 'Failed to update flat details.'
            });
        } finally {
            setSubmitting(false);
        }
    }

    // Show different UI states based on verification status
    const renderContent = () => {
        // If resident has a flat and it's rejected
        if (residentDetails?.flatDetails && residentDetails.societyVerification === 'Reject') {
            return (
                <>
                    <div className="text-center py-8">
                        <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="text-red-600" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-red-800 mb-2">Flat Selection Rejected</h2>
                        <p className="text-red-600 mb-6">
                            Your flat selection ({residentDetails.flatDetails?.flatNumber || 'N/A'}) has been rejected by the society administration.
                            Please select a different flat.
                        </p>
                    </div>

                    {/* Reselection Form */}
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader className="animate-spin text-blue-600" size={32} />
                            <p className="ml-3 text-gray-600">Loading apartment structure...</p>
                        </div>
                    ) : (
                        <div className="space-y-6 mt-4 border-t pt-6">
                            <h3 className="text-lg font-semibold text-gray-800 text-center">Select New Apartment</h3>
                            
                            {/* Block Selection */}
                            <div>
                                <div className="flex items-center mb-2">
                                    {getStructureIcon()}
                                    <label className="block text-gray-700 font-medium">Select {getStructureLabel()}</label>
                                </div>
                                <select
                                    className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none transition-all bg-white text-gray-700"
                                    onChange={(e) => setSelectedBlock(e.target.value)}
                                    value={selectedBlock}
                                >
                                    <option value="">Choose a {getStructureLabel()}</option>
                                    {blocks.map((block) => (
                                        <option key={block.blockName} value={block.blockName}>{block.blockName}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Floor Selection */}
                            {selectedBlock && (
                                <div>
                                    <div className="flex items-center mb-2">
                                        <Layers className="text-blue-600 mr-2" size={18} />
                                        <label className="block text-gray-700 font-medium">Select Floor</label>
                                    </div>
                                    <select
                                        className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none transition-all bg-white text-gray-700"
                                        onChange={(e) => setSelectedFloor(e.target.value)}
                                        value={selectedFloor}
                                    >
                                        <option value="">Choose a Floor</option>
                                        {blocks.find(b => b.blockName === selectedBlock)?.floors.map((_, index) => (
                                            <option key={index} value={index}>{`Floor ${index + 1}`}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Flat Selection */}
                            {selectedFloor !== "" && (
                                <div>
                                    <div className="flex items-center mb-2">
                                        <Home className="text-blue-600 mr-2" size={18} />
                                        <label className="block text-gray-700 font-medium">Select Flat</label>
                                    </div>
                                    <select
                                        className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none transition-all bg-white text-gray-700"
                                        onChange={(e) => setSelectedFlat(e.target.value)}
                                        value={selectedFlat}
                                    >
                                        <option value="">Choose a Flat</option>
                                        {blocks
                                            .find(b => b.blockName === selectedBlock)
                                            ?.floors[selectedFloor]
                                            ?.flats
                                            .filter(flat => flat.residents.length === 0)
                                            .map((flat) => (
                                                <option key={flat.flatNumber} value={flat.flatNumber}>{flat.flatNumber}</option>
                                            ))}
                                    </select>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="pt-4">
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center font-medium shadow-md hover:shadow-lg disabled:opacity-70"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader className="animate-spin mr-2" size={18} />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2" size={18} />
                                            Submit New Selection
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            );
        }

        // If resident has a flat and it's pending
        if (residentDetails?.flatDetails && residentDetails.societyVerification === 'Pending') {
            return (
                <div className="text-center py-8">
                    <div className="bg-yellow-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="text-yellow-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-yellow-800 mb-2">Verification Pending</h2>
                    <p className="text-yellow-700 mb-6">
                        Your flat selection ({residentDetails.flatDetails?.flatNumber || 'N/A'}) is under review by the society administration.
                    </p>
                    <div className="flex items-center justify-center text-sm text-yellow-600">
                        <ShieldCheck className="mr-2" size={16} />
                        <span>We'll notify you once the verification is complete</span>
                    </div>
                </div>
            );
        }

        // Default state - Show flat selection form
        return (
            <>
                <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold text-blue-800 mb-2">Select Your Flat</h2>
                    <p className="text-gray-500">Please choose your residence details</p>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader className="animate-spin text-blue-600" size={32} />
                        <p className="ml-3 text-gray-600">Loading apartment structure...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Block Selection */}
                        <div>
                            <div className="flex items-center mb-2">
                                {getStructureIcon()}
                                <label className="block text-gray-700 font-medium">Select {getStructureLabel()}</label>
                            </div>
                            <select
                                className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none transition-all bg-white text-gray-700"
                                onChange={(e) => setSelectedBlock(e.target.value)}
                                value={selectedBlock}
                            >
                                <option value="">Choose a {getStructureLabel()}</option>
                                {blocks.map((block) => (
                                    <option key={block.blockName} value={block.blockName}>{block.blockName}</option>
                                ))}
                            </select>
                        </div>

                        {/* Floor Selection */}
                        {selectedBlock && (
                            <div>
                                <div className="flex items-center mb-2">
                                    <Layers className="text-blue-600 mr-2" size={18} />
                                    <label className="block text-gray-700 font-medium">Select Floor</label>
                                </div>
                                <select
                                    className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none transition-all bg-white text-gray-700"
                                    onChange={(e) => setSelectedFloor(e.target.value)}
                                    value={selectedFloor}
                                >
                                    <option value="">Choose a Floor</option>
                                    {blocks.find(b => b.blockName === selectedBlock)?.floors.map((_, index) => (
                                        <option key={index} value={index}>{`Floor ${index + 1}`}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Flat Selection */}
                        {selectedFloor !== "" && (
                            <div>
                                <div className="flex items-center mb-2">
                                    <Home className="text-blue-600 mr-2" size={18} />
                                    <label className="block text-gray-700 font-medium">Select Flat</label>
                                </div>
                                <select
                                    className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none transition-all bg-white text-gray-700"
                                    onChange={(e) => setSelectedFlat(e.target.value)}
                                    value={selectedFlat}
                                >
                                    <option value="">Choose a Flat</option>
                                    {blocks
                                        .find(b => b.blockName === selectedBlock)
                                        ?.floors[selectedFloor]
                                        ?.flats
                                        .filter(flat => flat.residents.length === 0)
                                        .map((flat) => (
                                            <option key={flat.flatNumber} value={flat.flatNumber}>{flat.flatNumber}</option>
                                        ))}
                                </select>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center font-medium shadow-md hover:shadow-lg disabled:opacity-70"
                            >
                                {submitting ? (
                                    <>
                                        <Loader className="animate-spin mr-2" size={18} />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2" size={18} />
                                        Save {getStructureLabel()} Details
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Notification Popup */}
            <AnimatePresence>
                {notification.show && (
                    <motion.div
                        className="fixed top-5 left-0 right-0 mx-auto z-50 px-6 py-4 rounded-lg shadow-lg flex items-center max-w-md w-11/12 sm:w-full"
                        style={{
                            margin: '0 auto',
                            backgroundColor: notification.type === 'success' ? '#f0fdf4' : '#fef2f2',
                            borderLeft: notification.type === 'success' ? '4px solid #22c55e' : '4px solid #ef4444'
                        }}
                        variants={notificationVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <div
                            className="rounded-full p-2 mr-3"
                            style={{
                                backgroundColor: notification.type === 'success' ? '#dcfce7' : '#fee2e2',
                                color: notification.type === 'success' ? '#16a34a' : '#dc2626'
                            }}
                        >
                            {notification.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                        </div>
                        <div className="flex-1">
                            <h3
                                className="font-medium"
                                style={{ color: notification.type === 'success' ? '#166534' : '#991b1b' }}
                            >
                                {notification.type === 'success' ? 'Success' : 'Error'}
                            </h3>
                            <p
                                className="text-sm"
                                style={{ color: notification.type === 'success' ? '#15803d' : '#b91c1c' }}
                            >
                                {notification.message}
                            </p>
                        </div>
                        <button
                            onClick={() => setNotification({ ...notification, show: false })}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X size={18} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="m-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                >
                    <ArrowLeft size={18} />
                    <span className="text-base">Back</span>
                </button>
            </div>

            <div className="max-w-lg mx-auto p-8 bg-white shadow-lg rounded-xl mt-4 border border-blue-100">
                {renderContent()}
            </div>

            {/* Approval Popup */}
            <AnimatePresence>
                {showApprovalPopup && selectedFlatDetails && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <motion.div
                            variants={popupVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-11/12 mx-4"
                        >
                            <div className="text-center">
                                {/* Success Icon with Animation */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ 
                                        type: "spring",
                                        duration: 0.5,
                                        delay: 0.2
                                    }}
                                    className="mx-auto mb-6"
                                >
                                    <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
                                        <CheckCircle2 className="text-green-600 w-14 h-14" />
                                    </div>
                                </motion.div>

                                {/* Title */}
                                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                                    Flat Selection Submitted!
                                </h2>

                                {/* Details */}
                                <div className="bg-blue-50 rounded-xl p-4 mb-6">
                                    <p className="text-blue-800 font-medium mb-2">Selected Flat Details:</p>
                                    <div className="space-y-1 text-blue-600">
                                        <p>{getStructureLabel()}: {selectedFlatDetails.block}</p>
                                        <p>Floor: {selectedFlatDetails.floor}</p>
                                        <p>Flat: {selectedFlatDetails.flat}</p>
                                    </div>
                                </div>

                                {/* Status Message */}
                                <div className="text-gray-600 mb-6">
                                    <p className="mb-2">Your flat selection is pending approval from the society administration.</p>
                                    <div className="flex items-center justify-center text-sm text-blue-600">
                                        <Clock className="mr-2" size={16} />
                                        <span>You'll be notified once approved</span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <motion.div
                                    className="h-1 bg-blue-100 rounded-full overflow-hidden mb-6"
                                    initial={{ width: "100%" }}
                                >
                                    <motion.div
                                        className="h-full bg-blue-500"
                                        initial={{ width: "0%" }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 5, ease: "linear" }}
                                    />
                                </motion.div>

                                <p className="text-sm text-gray-500">
                                    Redirecting to dashboard in 5 seconds...
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}