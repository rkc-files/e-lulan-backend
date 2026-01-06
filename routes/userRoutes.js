const express = require("express");
const router = express.Router();

const { auth, db, admin } = require("../config/firebaseAdmin");
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

    // ✅ Normalize role
    const normalizedRole = role.trim().toLowerCase();

    // ✅ Generate Employee ID based on role
    const employeeId = await generateNextAvailableId(normalizedRole);

    // ✅ Employees get default password if not provided
    const finalPassword = password || "password123";

    // ✅ Create User in Firebase Auth
    const userRecord = await auth.createUser({
      email: email.trim().toLowerCase(),
      password: finalPassword,
      displayName: `${firstName.trim()} ${lastName.trim()}`,
    });

    const uid = userRecord.uid;

    // ✅ Save User to Firestore
    await db.collection("users").doc(uid).set({
      uid,
      employeeId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone || "",
      gender: gender || "",
      birthday: birthday || "",
      role: normalizedRole,
      status: "Active",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      success: true,
      uid,
      employeeId,
      message: `${normalizedRole} created successfully`,
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

    // ✅ Normalize optional role
    const normalizedRole = role ? role.trim().toLowerCase() : undefined;

    // ✅ Update Firebase Auth user
    if (email) {
      await auth.updateUser(uid, {
        email: email.trim().toLowerCase(),
        displayName: `${firstName || ""} ${lastName || ""}`.trim(),
      });
    } else if (firstName || lastName) {
      await auth.updateUser(uid, {
        displayName: `${firstName || ""} ${lastName || ""}`.trim(),
      });
    }

    // ✅ Update Firestore user profile
    await db.collection("users").doc(uid).update({
      ...(firstName && { firstName: firstName.trim() }),
      ...(lastName && { lastName: lastName.trim() }),
      ...(email && { email: email.trim().toLowerCase() }),
      ...(phone && { phone }),
      ...(gender && { gender }),
      ...(birthday && { birthday }),
      ...(normalizedRole && { role: normalizedRole }),
      ...(status && { status }),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      success: true,
      message: "✅ User updated successfully!",
    });
  } catch (error) {
    console.error("UPDATE USER ERROR:", error);

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
