const express = require('express');
const router = express.Router();
const adoptedPetController = require('../controllers/adoptedPetController');

// Route untuk adopsi pet
router.post('/adopt', adoptedPetController.adoptPet);

// Route untuk mendapatkan request adopsi (admin)
router.get('/requests', adoptedPetController.getAdoptionRequests);

// Route untuk approve request adopsi (admin)
router.post('/requests/:requestId/approve', adoptedPetController.approveAdoptionRequest);

// Route untuk reject request adopsi (admin)
router.post('/requests/:requestId/reject', adoptedPetController.rejectAdoptionRequest);

// Route untuk mendapatkan adopted pets berdasarkan shelter
router.get('/shelter/:shelterId', adoptedPetController.getAdoptedPetsByShelterId);

// Route untuk cek status adopsi pet
router.get('/check/:petId', adoptedPetController.checkAdoptionStatus);

// Route untuk mendapatkan semua adopted pets
router.get('/', adoptedPetController.getAllAdoptedPets);

// Route untuk mendapatkan adopted pet berdasarkan ID
router.get('/:id', adoptedPetController.getAdoptedPetById);

// Route untuk update adopted pet
router.put('/:id', adoptedPetController.updateAdoptedPet);

// Route untuk hapus adopted pet (batalkan adopsi)
router.delete('/:id', adoptedPetController.deleteAdoptedPet);

module.exports = router;
