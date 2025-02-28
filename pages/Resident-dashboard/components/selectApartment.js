import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { FaArrowLeft } from "react-icons/fa";

export default function FlatSelection({ residentId }) {
    const [blocks, setBlocks] = useState([]);
    const [selectedBlock, setSelectedBlock] = useState("");
    const [selectedFloor, setSelectedFloor] = useState("");
    const [selectedFlat, setSelectedFlat] = useState("");
    const [loading, setLoading] = useState(true);
    const [residentDetails, setResidentDetails] = useState({});
    const router = useRouter();

    // Fetch resident details
    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
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
            } catch (error) {
                console.error("Error fetching profile:", error);
                localStorage.removeItem("Resident");
                router.push("/Login");
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
                const data = await response.json();
                setBlocks(data.data || []);
            } catch (error) {
                console.error("Error fetching apartment structure:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchApartmentStructure();
    }, [residentDetails.societyCode]);

    // Handle flat selection submission
    async function handleSubmit() {
        if (!selectedBlock || !selectedFloor || !selectedFlat) {
            alert("Please select block, floor, and flat.");
            return;
        }

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
                }),
            });

            const result = await response.json();
            alert(result.message);
        } catch (error) {
            console.error("Error updating flat details:", error);
            alert("Failed to update flat details.");
        }
    }

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
            <div className="max-w-lg mx-auto p-6 bg-white shadow-lg rounded-lg mt-8">

                <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Select Your Flat</h2>

                {loading ? (
                    <p className="text-center text-gray-600">Loading apartment structure...</p>
                ) : (
                    <div className="space-y-4">
                        {/* Block Selection */}
                        <div>
                            <label className="block text-gray-700 font-medium mb-1">Select Block</label>
                            <select
                                className="w-full p-2 border rounded-md focus:ring focus:ring-blue-200"
                                onChange={(e) => setSelectedBlock(e.target.value)}
                                value={selectedBlock}
                            >
                                <option value="">Choose a Block</option>
                                {blocks.map((block) => (
                                    <option key={block.blockName} value={block.blockName}>{block.blockName}</option>
                                ))}
                            </select>
                        </div>

                        {/* Floor Selection */}
                        {selectedBlock && (
                            <div>
                                <label className="block text-gray-700 font-medium mb-1">Select Floor</label>
                                <select
                                    className="w-full p-2 border rounded-md focus:ring focus:ring-blue-200"
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
                                <label className="block text-gray-700 font-medium mb-1">Select Flat</label>
                                <select
                                    className="w-full p-2 border rounded-md focus:ring focus:ring-blue-200"
                                    onChange={(e) => setSelectedFlat(e.target.value)}
                                    value={selectedFlat}
                                >
                                    <option value="">Choose a Flat</option>
                                    {blocks
                                        .find(b => b.blockName === selectedBlock) // Find the selected block
                                        ?.floors[selectedFloor] // Access the selected floor
                                        ?.flats
                                        .filter(flat => flat.residents.length === 0) // Filter flats with no residents
                                        .map((flat) => (
                                            <option key={flat.flatNumber} value={flat.flatNumber}>{flat.flatNumber}</option>
                                        ))}
                                </select>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmit}
                            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
                        >
                            Save Flat Details
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
