const { admin, db, auth } = require("../config/firebaseAdmin");

// ✅ Helper: generate random password (strong but human-friendly)
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
  const normalizedPlate = plate
    .replace(/\s+/g, "")       // remove spaces
    .replace(/[^A-Z0-9]/gi, "") // remove symbols
    .toUpperCase();

  return `BUS-${normalizedPlate}`;
}

exports.createFleetBusAccount = async (req, res) => {
  try {
    if (!db || !auth) {
      return res.status(500).json({
        message: "Firebase Admin is not initialized properly.",
      });
    }

    let { busNo, plate, capacity, model, status } = req.body;

    if (!busNo || !plate || !capacity || !model) {
      return res.status(400).json({ message: "Missing required bus fields." });
    }

    // ✅ Normalize inputs
    busNo = busNo.toString().trim();
    plate = plate.toString().trim().toUpperCase();
    capacity = parseInt(capacity);

    if (isNaN(capacity) || capacity <= 0) {
      return res.status(400).json({ message: "Capacity must be a valid number." });
    }

    status = status || "Active";

    // ✅ Generate credentials
    const loginId = generateLoginId(plate);
    const defaultPassword = generatePassword();
    const fleetEmail = `${loginId}@fleet.elulan`;

    // ✅ 1) Prevent duplicate busAccounts by loginId
    const existingSnap = await db
      .collection("busAccounts")
      .where("loginId", "==", loginId)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      return res.status(409).json({
        message: "Fleet account already exists for this bus plate.",
      });
    }

    // ✅ 2) Create Firebase Auth user FIRST
    const userRecord = await auth.createUser({
      email: fleetEmail,
      password: defaultPassword,
      emailVerified: true,
      disabled: false,
      displayName: loginId,
    });

    const uid = userRecord.uid;

    // ✅ 3) BusAccount profile for fleet portal
    const busAccountData = {
      uid,
      loginId,
      fleetEmail,
      busNo,
      plate,
      capacity,
      model,
      status,
      role: "bus",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // ✅ Store as doc(uid) so frontend can getDoc(uid)
    await db.collection("busAccounts").doc(uid).set(busAccountData);

    // ✅ 4) Bus inventory record
    const busInventoryData = {
      busNo,
      plate,
      capacity,
      model,
      status,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      fleetAuthUid: uid,
      loginId,
    };

    const busDocRef = await db.collection("buses").add(busInventoryData);

    return res.status(201).json({
      message: "✅ Fleet bus account created successfully!",
      bus: {
        id: busDocRef.id,
        ...busInventoryData,
      },
      fleetCredentials: {
        loginId,
        defaultPassword,
        fleetEmail,
      },
    });
  } catch (error) {
    console.error("❌ createFleetBusAccount error:", error);

    // ✅ If email already exists in Auth
    if (error.code === "auth/email-already-exists") {
      return res.status(409).json({
        message: "Fleet account already exists for this bus plate number.",
      });
    }

    return res.status(500).json({
      message: "Failed to create fleet bus account.",
      error: error.message,
    });
  }
};