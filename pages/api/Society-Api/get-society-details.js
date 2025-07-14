// pages/api/get-society-details.js
import jwt from "jsonwebtoken";
import connectToDatabase from "../../../lib/mongodb";
import Society from "../../../models/Society";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method Not Allowed" });
    }

    // Log all incoming headers for debugging
    // console.log("Incoming Headers:", req.headers);

    const token = req.headers.authorization?.split(" ")[1];  // Get the token from "Bearer <token>"
    // console.log("Extracted Token:", token);

    if (!token) {
        return res.status(401).json({ message: "Unauthorized: Token Missing" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Decode the token
        // console.log("Decoded Token:", decoded);

        const phoneNumber = decoded.phone;

        await connectToDatabase();
        const society = await Society.findOne({
          $or: [
            { managerPhone: phoneNumber },
            { "members.phone": phoneNumber }
          ]
        });

        if (!society) {
            return res.status(404).json({ message: "Society not found" });
        }

        // Extract permissions from decoded JWT
        const permissions = decoded.permissions;
        res.status(200).json({
            ...society.toObject(),
            permissions
        });
    } catch (error) {
        console.error("Error fetching society details:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
