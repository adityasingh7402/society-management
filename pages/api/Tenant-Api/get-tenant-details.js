// pages/api/get-tenant-details.js
import jwt from "jsonwebtoken";
import connectToDatabase from "../../../lib/mongodb";
import Tenant from "../../../models/Tenant"; // Import your Tenant model

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
        const phone = decoded.phone; // Use `phone` from the decoded token

        await connectToDatabase();
        const tenant = await Tenant.findOne({ phone }); // Query using `phone`

        if (!tenant) {
            return res.status(404).json({ message: "Tenant not found" });
        }

        res.status(200).json(tenant); // Return the tenant data
    } catch (error) {
        console.error("Error fetching tenant details:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
