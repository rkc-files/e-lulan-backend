const { db } = require("../config/firebaseAdmin");

const formatEmployeeId = (role, number) => {
  const padded = String(number).padStart(2, "0");
  if (role === "driver") return `DVR-${padded}`;
  if (role === "conductor") return `CDR-${padded}`;
  if (role === "staff") return `STF-${padded}`;
  if (role === "admin") return `ADM-${padded}`;
  return `EMP-${padded}`;
};

const generateNextAvailableId = async (role) => {
  const snap = await db
    .collection("users")
    .where("role", "==", role)
    .where("status", "!=", "Deleted")
    .get();

  const usedNumbers = snap.docs
    .map((doc) => doc.data().employeeId || "")
    .map((id) => parseInt(id.split("-")[1]))
    .filter((num) => !isNaN(num))
    .sort((a, b) => a - b);

  let next = 1;
  for (let num of usedNumbers) {
    if (num === next) next++;
    else break;
  }

  return formatEmployeeId(role, next);
};

module.exports = { generateNextAvailableId };