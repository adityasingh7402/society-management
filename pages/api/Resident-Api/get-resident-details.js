// pages/api/get-resident-details.js
import jwt from "jsonwebtoken";
import connectToDatabase from "../../../lib/mongodb";
import Resident from "../../../models/Resident";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    const token = req.headers.authorization?.split(" ")[1]; // Extract the token from "Bearer <token>"

    if (!token) {
        return res.status(401).json({ message: "Unauthorized: Token Missing" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Decode the token
        const phone = decoded.phone; // Use `residentPhone` for the resident's information

        await connectToDatabase();
        const resident = await Resident.findOne({ phone }); // Query using `phoneNumber`

        if (!resident) {
            return res.status(404).json({ message: "Resident not found" });
        }

        res.status(200).json(resident); // Return the resident data
    } catch (error) {
        console.error("Error fetching resident details:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
