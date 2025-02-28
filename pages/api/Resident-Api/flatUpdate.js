import connectToDatabase from "../../../lib/mongodb";
import Society from "../../../models/Society";
import Resident from "../../../models/Resident";

export default async function handler(req, res) {
    if (req.method === 'POST') {
        var { societyId, blockName, floorIndex, flatNumber, residentId } = req.body;
        var floorIndex = floorIndex-1;

        if (!societyId || !blockName || floorIndex === undefined || !flatNumber || !residentId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        await connectToDatabase();
        console.log(societyId, blockName, floorIndex, flatNumber, residentId)


        try {
            const society = await Society.findOne({ societyId });
            if (!society) {
                return res.status(404).json({ message: 'Society ID not found' });
            }

            const block = society.apartmentStructure.find(b => b.blockName === blockName);
            if (!block) {
                return res.status(404).json({ message: 'Block not found' });
            }

            const floor = block.floors[floorIndex];
            if (!floor) {
                return res.status(404).json({ message: 'Floor not found' });
            }

            let flat = floor.flats.find(f => f.flatNumber === flatNumber);
            if (!flat) {
                flat = { flatNumber, residents: [] };
                floor.flats.push(flat);
            }

            const resident = await Resident.findById(residentId);
            if (!resident) {
                return res.status(404).json({ message: 'Resident not found' });
            }

            flat.residents.push(resident._id);
            society.residents.push(resident._id);
            resident.flatDetails = { blockName, floorIndex, flatNumber };

            await resident.save();
            await society.save();

            res.status(201).json({ message: 'Flat details stored successfully in both models' });
        } catch (error) {
            console.error('Error in storing flat details:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
}
