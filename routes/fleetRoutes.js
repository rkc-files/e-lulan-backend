const express = require("express");
const router = express.Router();
const { createFleetBusAccount } = require("../controllers/fleetController");

router.post("/bus/create", createFleetBusAccount);

module.exports = router;