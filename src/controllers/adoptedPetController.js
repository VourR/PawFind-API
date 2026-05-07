const AdoptedPetModel = require('../models/AdoptedPetModel');
const AdopterModel = require('../models/AdopterModel');
const AdoptionRequestModel = require('../models/AdoptionRequestModel');
const PetModel = require('../models/PetModel');

const adoptedPetController = {
  // Adopter mengajukan adopsi (status pending)
  adoptPet: async (req, res) => {
    try {
      const {
        pet_id,
        adopter_name,
        adopter_email,
        adopter_phone,
        message,
        notes
      } = req.body;

      if (!pet_id || !adopter_name || !adopter_email || !adopter_phone) {
        return res.status(400).json({
          error: 'pet_id, adopter_name, adopter_email, dan adopter_phone wajib diisi'
        });
      }

      const isAdopted = await AdoptedPetModel.checkIfPetAdopted(pet_id);
      if (isAdopted) {
        return res.status(400).json({
          error: 'Pet ini sudah diadopsi'
        });
      }

      const hasPendingRequest = await AdoptionRequestModel.checkPendingRequestByPetId(pet_id);
      if (hasPendingRequest) {
        return res.status(400).json({
          error: 'Pet ini sedang menunggu persetujuan adopsi dari admin'
        });
      }

      const { data: pet, error: petError } = await PetModel.getById(pet_id);
      if (petError || !pet) {
        return res.status(404).json({
          error: 'Pet tidak ditemukan'
        });
      }

      const adopter = await AdopterModel.createAdopter({
        full_name: adopter_name,
        email: adopter_email,
        phone: adopter_phone,
        message: message || notes || null
      });

      let adoptionRequest;
      try {
        adoptionRequest = await AdoptionRequestModel.createRequest({
          pet_id: pet.id,
          adopter_id: adopter.id,
          status: 'pending'
        });
      } catch (insertError) {
        await AdopterModel.deleteAdopter(adopter.id);
        throw insertError;
      }

      res.status(201).json({
        message: 'Pengajuan adopsi berhasil dikirim dan menunggu persetujuan admin',
        data: adoptionRequest
      });
    } catch (error) {
      console.error('Error creating adoption request:', error);
      res.status(500).json({
        error: 'Gagal membuat pengajuan adopsi',
        details: error.message
      });
    }
  },

  // Mendapatkan semua adopted pets
  getAllAdoptedPets: async (req, res) => {
    try {
      const adoptedPets = await AdoptedPetModel.getAllAdoptedPets();
      res.status(200).json({
        message: 'Berhasil mendapatkan data adopted pets',
        data: adoptedPets
      });
    } catch (error) {
      console.error('Error fetching adopted pets:', error);
      res.status(500).json({
        error: 'Gagal mengambil data adopted pets',
        details: error.message
      });
    }
  },

  // Mendapatkan adopted pet berdasarkan ID
  getAdoptedPetById: async (req, res) => {
    try {
      const { id } = req.params;
      const adoptedPet = await AdoptedPetModel.getAdoptedPetById(id);

      if (!adoptedPet) {
        return res.status(404).json({
          error: 'Adopted pet tidak ditemukan'
        });
      }

      res.status(200).json({
        message: 'Berhasil mendapatkan data adopted pet',
        data: adoptedPet
      });
    } catch (error) {
      console.error('Error fetching adopted pet:', error);
      res.status(500).json({
        error: 'Gagal mengambil data adopted pet',
        details: error.message
      });
    }
  },

  // Mendapatkan adopted pets berdasarkan shelter
  getAdoptedPetsByShelterId: async (req, res) => {
    try {
      const { shelterId } = req.params;
      const adoptedPets = await AdoptedPetModel.getAdoptedPetsByShelterId(shelterId);

      res.status(200).json({
        message: 'Berhasil mendapatkan data adopted pets dari shelter',
        data: adoptedPets
      });
    } catch (error) {
      console.error('Error fetching adopted pets by shelter:', error);
      res.status(500).json({
        error: 'Gagal mengambil data adopted pets',
        details: error.message
      });
    }
  },

  // Cek status adopsi pet
  checkAdoptionStatus: async (req, res) => {
    try {
      const { petId } = req.params;
      const isAdopted = await AdoptedPetModel.checkIfPetAdopted(petId);
      const hasPendingRequest = await AdoptionRequestModel.checkPendingRequestByPetId(petId);

      res.status(200).json({
        pet_id: petId,
        is_adopted: isAdopted,
        has_pending_request: hasPendingRequest
      });
    } catch (error) {
      console.error('Error checking adoption status:', error);
      res.status(500).json({
        error: 'Gagal mengecek status adopsi',
        details: error.message
      });
    }
  },

  // Mendapatkan semua request adopsi (opsional filter status)
  getAdoptionRequests: async (req, res) => {
    try {
      const { status } = req.query;
      const allowedStatuses = ['pending', 'approved', 'rejected'];

      if (status && !allowedStatuses.includes(status)) {
        return res.status(400).json({
          error: 'Status tidak valid. Gunakan: pending, approved, atau rejected'
        });
      }

      const requests = status
        ? await AdoptionRequestModel.getRequestsByStatus(status)
        : await AdoptionRequestModel.getAllRequests();

      res.status(200).json({
        message: 'Berhasil mendapatkan data request adopsi',
        data: requests
      });
    } catch (error) {
      console.error('Error fetching adoption requests:', error);
      res.status(500).json({
        error: 'Gagal mengambil data request adopsi',
        details: error.message
      });
    }
  },

  // Approve request adopsi oleh admin
  approveAdoptionRequest: async (req, res) => {
    try {
      const { requestId } = req.params;
      const { reviewed_by, admin_notes } = req.body || {};

      const request = await AdoptionRequestModel.getRequestById(requestId);
      if (!request) {
        return res.status(404).json({
          error: 'Request adopsi tidak ditemukan'
        });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({
          error: 'Request ini sudah direview sebelumnya'
        });
      }

      const isAdopted = await AdoptedPetModel.checkIfPetAdopted(request.pet_id);
      if (isAdopted) {
        return res.status(400).json({
          error: 'Pet ini sudah diadopsi'
        });
      }

      const { data: pet, error: petError } = await PetModel.getById(request.pet_id);
      if (petError || !pet) {
        return res.status(404).json({
          error: 'Pet tidak ditemukan'
        });
      }

      const adoptionData = {
        pet_id: pet.id,
        pet_name: pet.name,
        pet_type: pet.type,
        pet_breed: pet.breed,
        pet_age: pet.age,
        pet_gender: pet.gender,
        pet_description: pet.description,
        pet_image_url: pet.image_url,
        shelter_id: pet.shelter_id,
        shelter_name: pet.shelter_name,
        adopter_id: request.adopter_id
      };

      const adoptedPet = await AdoptedPetModel.adoptPet(adoptionData);
      const updatedRequest = await AdoptionRequestModel.updateRequest(requestId, {
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewed_by || null,
        admin_notes: admin_notes || null,
        adopted_pet_id: adoptedPet.id
      });

      res.status(200).json({
        message: 'Request adopsi berhasil disetujui',
        request: updatedRequest,
        adopted_pet: adoptedPet
      });
    } catch (error) {
      console.error('Error approving adoption request:', error);
      res.status(500).json({
        error: 'Gagal menyetujui request adopsi',
        details: error.message
      });
    }
  },

  // Reject request adopsi oleh admin
  rejectAdoptionRequest: async (req, res) => {
    try {
      const { requestId } = req.params;
      const { reviewed_by, admin_notes } = req.body || {};

      const request = await AdoptionRequestModel.getRequestById(requestId);
      if (!request) {
        return res.status(404).json({
          error: 'Request adopsi tidak ditemukan'
        });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({
          error: 'Request ini sudah direview sebelumnya'
        });
      }

      const updatedRequest = await AdoptionRequestModel.updateRequest(requestId, {
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewed_by || null,
        admin_notes: admin_notes || null
      });

      res.status(200).json({
        message: 'Request adopsi berhasil ditolak',
        data: updatedRequest
      });
    } catch (error) {
      console.error('Error rejecting adoption request:', error);
      res.status(500).json({
        error: 'Gagal menolak request adopsi',
        details: error.message
      });
    }
  },

  // Update data adopted pet
  updateAdoptedPet: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        adopter_name,
        adopter_email,
        adopter_phone,
        message,
        notes,
        ...updateData
      } = req.body;

      const existingAdoption = await AdoptedPetModel.getAdoptedPetById(id);
      if (!existingAdoption) {
        return res.status(404).json({
          error: 'Adopted pet tidak ditemukan'
        });
      }

      const adopterUpdateData = {};
      if (adopter_name !== undefined) adopterUpdateData.full_name = adopter_name;
      if (adopter_email !== undefined) adopterUpdateData.email = adopter_email;
      if (adopter_phone !== undefined) adopterUpdateData.phone = adopter_phone;
      if (message !== undefined || notes !== undefined) {
        adopterUpdateData.message = message !== undefined ? message : notes;
      }

      if (Object.keys(adopterUpdateData).length > 0 && existingAdoption.adopter_id) {
        await AdopterModel.updateAdopter(existingAdoption.adopter_id, adopterUpdateData);
      }

      const updatedPet = Object.keys(updateData).length > 0
        ? await AdoptedPetModel.updateAdoptedPet(id, updateData)
        : await AdoptedPetModel.getAdoptedPetById(id);

      if (!updatedPet) {
        return res.status(404).json({
          error: 'Adopted pet tidak ditemukan'
        });
      }

      res.status(200).json({
        message: 'Adopted pet berhasil diupdate',
        data: updatedPet
      });
    } catch (error) {
      console.error('Error updating adopted pet:', error);
      res.status(500).json({
        error: 'Gagal mengupdate adopted pet',
        details: error.message
      });
    }
  },

  // Hapus adopted pet (jika adopsi dibatalkan)
  deleteAdoptedPet: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedPet = await AdoptedPetModel.deleteAdoptedPet(id);

      if (!deletedPet) {
        return res.status(404).json({
          error: 'Adopted pet tidak ditemukan'
        });
      }

      res.status(200).json({
        message: 'Adopted pet berhasil dihapus',
        data: deletedPet
      });
    } catch (error) {
      console.error('Error deleting adopted pet:', error);
      res.status(500).json({
        error: 'Gagal menghapus adopted pet',
        details: error.message
      });
    }
  }
};

module.exports = adoptedPetController;
