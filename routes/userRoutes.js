const express = require("express");
const router = express.Router();

const { auth, db } = require("../firebaseAdmin");
const { generateNextAvailableId } = require("../utils/generateEmployeeId");

// ✅ Create Employee/Admin User
router.post("/create", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      gender,
      birthday,
      role,
      password,
    } = req.body;

    if (!email || !firstName || !lastName || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ✅ Generate Employee ID based on role
    const employeeId = await generateNextAvailableId(role);

    // ✅ Employees get default password if not provided
    const finalPassword = password || "password123";

    // ✅ Create User in Firebase Auth (does NOT affect admin session!)
    const userRecord = await auth.createUser({
      email,
      password: finalPassword,
      displayName: `${firstName} ${lastName}`,
    });

    const uid = userRecord.uid;

    // ✅ Save User to Firestore
    await db.collection("users").doc(uid).set({
      uid,
      employeeId,
      firstName,
      lastName,
      email,
      phone,
      gender,
      birthday,
      role,
      status: "Active",
      createdAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      uid,
      employeeId,
      message: `${role} created successfully`,
    });
  } catch (error) {
    console.error("CREATE USER ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
