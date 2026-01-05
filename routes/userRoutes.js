const express = require("express");
const router = express.Router();

const { auth, db } = require("../firebaseAdmin");
const { generateNextAvailableId } = require("../utils/generateEmployeeId");

/* ======================================================
    ✅ CREATE Employee/Admin User
====================================================== */
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

    // ✅ Create User in Firebase Auth
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

    // ✅ Better error messages
    if (error.code === "auth/email-already-exists") {
      return res.status(400).json({ error: "Email already exists." });
    }

    return res.status(500).json({ error: error.message });
  }
});

/* ======================================================
    ✅ UPDATE User Info (Firestore + Auth email update)
====================================================== */
router.put("/update/:uid", async (req, res) => {
  try {
    const { uid } = req.params;

    const {
      firstName,
      lastName,
      email,
      phone,
      gender,
      birthday,
      role,
      status,
    } = req.body;

    if (!uid) {
      return res.status(400).json({ error: "UID is required" });
    }

    // ✅ Update Firebase Auth user (only update if email exists in request)
    if (email) {
      await auth.updateUser(uid, {
        email,
        displayName: `${firstName || ""} ${lastName || ""}`.trim(),
      });
    } else if (firstName || lastName) {
      await auth.updateUser(uid, {
        displayName: `${firstName || ""} ${lastName || ""}`.trim(),
      });
    }

    // ✅ Update Firestore user profile
    await db.collection("users").doc(uid).update({
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(email && { email }),
      ...(phone && { phone }),
      ...(gender && { gender }),
      ...(birthday && { birthday }),
      ...(role && { role }),
      ...(status && { status }),
      updatedAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: "✅ User updated successfully!",
    });
  } catch (error) {
    console.error("UPDATE USER ERROR:", error);

    // ✅ Handle Auth-specific errors
    if (error.code === "auth/email-already-exists") {
      return res.status(400).json({ error: "Email already exists." });
    }

    if (error.code === "auth/invalid-email") {
      return res.status(400).json({ error: "Invalid email format." });
    }

    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
