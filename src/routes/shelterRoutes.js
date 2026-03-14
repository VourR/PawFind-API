const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();

const shelterController = require("../controllers/shelterController");

router.get("/", shelterController.getShelters);
router.get("/:id", shelterController.getShelterById);
router.post("/", upload.single("image"), shelterController.createShelter);
router.put("/:id", upload.single("image"), shelterController.updateShelter);
router.delete("/:id", shelterController.deleteShelter);

module.exports = router;
