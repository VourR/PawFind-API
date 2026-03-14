const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();

const petController = require("../controllers/petController");

router.get("/", petController.getPets);
router.get("/:id", petController.getPetById);
router.post("/", upload.single("image"), petController.createPet);
router.put("/:id", upload.single("image"), petController.updatePet);
router.delete("/:id", petController.deletePet);

module.exports = router;
