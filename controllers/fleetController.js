const { admin, db, auth } = require("../config/firebaseAdmin");

// ✅ Helper: generate random password
function generatePassword(length = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$";
  let pass = "";
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

// ✅ Generate loginId from plate number
function generateLoginId(plate) {
  const normalizedPlate = plate.replace(/\s+/g, "").toUpperCase();
  return `BUS-${normalizedPlate}`;
}

exports.createFleetBusAccount = async (req, res) => {
  try {
    if (!db || !auth) {
      return res.status(500).json({
        message: "Firebase Admin is not initialized properly.",
      });
    }

    const { busNo, plate, capacity, model, status } = req.body;

    if (!busNo || !plate || !capacity || !model) {
      return res.status(400).json({ message: "Missing required bus fields." });
    }

    // ✅ Generate credentials
    const loginId = generateLoginId(plate);
    const defaultPassword = generatePassword();
    const fleetEmail = `${loginId}@fleet.elulan`;

    // ✅ Create Firebase Auth user
    const userRecord = await auth.createUser({
      email: fleetEmail,
      password: defaultPassword,
      emailVerified: true,
      disabled: false,
    });

    const uid = userRecord.uid;

    // ✅ BusAccount profile for fleet portal
    const busAccountData = {
      uid,
      loginId,
      busNo: busNo.toString(),
      plate: plate.toUpperCase(),
      capacity: parseInt(capacity),
      model,
      status: status || "Active",
      role: "bus",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("busAccounts").doc(uid).set(busAccountData);

    // ✅ Bus inventory record
    const busInventoryData = {
      busNo: busNo.toString(),
      plate: plate.toUpperCase(),
      capacity: parseInt(capacity),
      model,
      status: status || "Active",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      fleetAuthUid: uid,
      loginId,
    };

    const busDocRef = await db.collection("buses").add(busInventoryData);

    return res.status(201).json({
      bus: {
        id: busDocRef.id,
        ...busInventoryData,
      },
      fleetCredentials: {
        loginId,
        defaultPassword,
      },
    });
  } catch (error) {
    console.error("❌ createFleetBusAccount error:", error);

    if (error.code === "auth/email-already-exists") {
      return res.status(409).json({
        message: "Fleet account already exists for this plate number.",
      });
    }

    return res.status(500).json({
      message: "Failed to create fleet bus account.",
      error: error.message,
    });
  }
};