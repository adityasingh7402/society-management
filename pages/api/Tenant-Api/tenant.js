import connectToDatabase from "../../../lib/mongodb";
import Tenant from "../../../models/Tenant";
import Society from "../../../models/Society";
import Resident from "../../../models/Resident";
import mongoose from "mongoose";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { idType, id, name, phone, email, address, unitNumber } = req.body;
    console.log(idType, id, name, phone, email, address, unitNumber);

    // Step 1: Input Validation (optional, based on your needs)
    if (!idType || !id || !name || !phone || !email || !address || !unitNumber) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Step 2: Connect to the database
    await connectToDatabase();

    try {
      let parent;
      let parentIdField;
      let parentName;
      let societyCode;
      let residentCode;
      let societyName;

      console.log(idType);
      console.log(id);

      if (idType === "societyId") {
        // Step 3a: Find the society by societyId
        parent = await Society.findOne({ societyId: id });
        console.log("parent");
        console.log(parent);
        if (!parent) {
          return res.status(400).json({ message: "Society ID not found" });
        }
        parentIdField = "societyId";
        parentName = parent.societyName;
        societyName = parent.societyName;
        societyCode = parent.societyId;
      } else if (idType === "residentId") {
        // Step 3b: Find the resident by residentId
        parent = await Resident.findOne({ residentId: id });
        console.log(parent);
        if (!parent) {
          return res.status(400).json({ message: "Resident ID not found" });
        }
        parentIdField = "residentId";
        parentName = parent.name;
        societyCode = parent.societyCode; // Assuming each resident has a reference to society code
        residentCode = parent.residentId;
        societyName = parent.societyName;
      } else {
        return res.status(400).json({ message: "Invalid ID type" });
      }

      // Step 4: Check if a tenant with the same phone already exists
      const existingTenant = await Tenant.findOne({ phone });
      if (existingTenant) {
        return res
          .status(400)
          .json({ message: "Tenant with this phone number already exists" });
      }

      // Step 5: Ensure valid ObjectId if needed
    //   const objectId = mongoose.Types.ObjectId.isValid(id) ? mongoose.Types.ObjectId(id) : id;

      // Step 6: Create the new tenant document
      const newTenant = new Tenant({
        name,
        phone,
        email,
        address,
        residentCode,
        societyName,
        unitNumber,
        [parentIdField]: parent._id, // Convert the id to ObjectId if valid
        societyCode, // Add society code if available
        societyName: societyName, // Add society name or resident name
        parentType: idType,
        parentName: parentName, // Name of the parent (Society or Resident)
      });

      await newTenant.save();

      // Step 7: Add the new tenant's custom ID to the parent's tenant list
      if (!parent.tenants) {
        parent.tenants = [];
      }
      parent.tenants.push(newTenant._id);
      await parent.save();

      // Step 8: Respond with success message
      res.status(200).json({ message: "Tenant signed up successfully!" });
    } catch (error) {
      console.error("Error in tenant signup:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
