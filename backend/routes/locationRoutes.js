import express from 'express';

const router = express.Router();

// Mock database of serviceable pincodes and dark store hubs
const serviceablePincodes = {
  '400050': { city: 'Mumbai', area: 'Bandra West', estTime: '15-20 Mins', storeHub: 'Big Market 👌 Bandra Hub #04', isAvailable: true },
  '400051': { city: 'Mumbai', area: 'BKC, Bandra East', estTime: '15-25 Mins', storeHub: 'Big Market 👌 BKC Hub #02', isAvailable: true },
  '400069': { city: 'Mumbai', area: 'Andheri East', estTime: '18 Mins', storeHub: 'Big Market 👌 Andheri Hub #08', isAvailable: true },
  '400076': { city: 'Mumbai', area: 'Powai, Hiranandani', estTime: '20 Mins', storeHub: 'Big Market 👌 Powai Hub #11', isAvailable: true },
  '110001': { city: 'Delhi', area: 'Connaught Place', estTime: '15 Mins', storeHub: 'Big Market 👌 CP Hub #01', isAvailable: true },
  '122002': { city: 'Gurugram', area: 'DLF Phase 5', estTime: '15 Mins', storeHub: 'Big Market 👌 Gurugram Hub #05', isAvailable: true },
  '560038': { city: 'Bengaluru', area: 'Indiranagar 100ft Rd', estTime: '12 Mins', storeHub: 'Big Market 👌 Indiranagar Hub #03', isAvailable: true },
  '560095': { city: 'Bengaluru', area: 'Koramangala 5th Block', estTime: '15 Mins', storeHub: 'Big Market 👌 Koramangala Hub #07', isAvailable: true }
};

// Check Pincode Logistics & Delivery Availability
router.post('/check-pincode', (req, res) => {
  try {
    const { pincode } = req.body;
    if (!pincode || pincode.trim().length !== 6) {
      return res.status(400).json({ message: 'Please enter a valid 6-digit Indian Pincode (e.g. 400050)' });
    }

    const cleanPincode = pincode.trim();
    const logisticsInfo = serviceablePincodes[cleanPincode];

    if (logisticsInfo) {
      res.json({
        servicable: true,
        pincode: cleanPincode,
        city: logisticsInfo.city,
        area: logisticsInfo.area,
        estimatedTime: logisticsInfo.estTime,
        storeHub: logisticsInfo.storeHub,
        message: `⚡ Great news! Express 15-minute delivery available in ${logisticsInfo.area} from ${logisticsInfo.storeHub}.`
      });
    } else {
      res.json({
        servicable: false,
        pincode: cleanPincode,
        message: `Currently not serviceable for 15-min delivery. Standard 2-day delivery available.`
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Nearby Store / Location Hubs
router.get('/nearby-stores', (req, res) => {
  try {
    const stores = [
      { id: 'hub-1', name: 'Big Market 👌 Bandra Hub #04', pincode: '400050', address: 'Plot 12, Hill Road, Bandra West, Mumbai', activeOrders: 14, status: 'OPEN' },
      { id: 'hub-2', name: 'Big Market 👌 BKC Hub #02', pincode: '400051', address: 'Tower B, G Block, BKC, Mumbai', activeOrders: 22, status: 'OPEN' },
      { id: 'hub-3', name: 'Big Market 👌 Andheri Hub #08', pincode: '400069', address: 'SV Road, Andheri West, Mumbai', activeOrders: 18, status: 'OPEN' },
      { id: 'hub-4', name: 'Big Market 👌 Indiranagar Hub #03', pincode: '560038', address: '100ft Road, Indiranagar, Bengaluru', activeOrders: 9, status: 'OPEN' }
    ];
    res.json(stores);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
