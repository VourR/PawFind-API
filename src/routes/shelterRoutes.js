const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();

const shelterController = require("../controllers/shelterController");
const adminAuth = require("../middlewares/adminAuth");

router.get("/", shelterController.getShelters);
router.get("/:id", shelterController.getShelterById);
router.post("/", adminAuth, upload.single("image"), shelterController.createShelter);
router.put("/:id", adminAuth, upload.single("image"), shelterController.updateShelter);
router.delete("/:id", adminAuth, shelterController.deleteShelter);

module.exports = router;
