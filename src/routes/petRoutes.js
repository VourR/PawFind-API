const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();

const petController = require("../controllers/petController");
const adminAuth = require("../middlewares/adminAuth");

router.get("/", petController.getPets);
router.get("/:id", petController.getPetById);
router.post("/", adminAuth, upload.single("image"), petController.createPet);
router.put("/:id", adminAuth, upload.single("image"), petController.updatePet);
router.delete("/:id", adminAuth, petController.deletePet);

module.exports = router;
