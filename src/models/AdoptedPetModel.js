const supabase = require('../config/supabase');

const ADOPTED_PET_SELECT = `
  id,
  pet_id,
  pet_name,
  pet_type,
  pet_breed,
  pet_age,
  pet_gender,
  pet_description,
  pet_image_url,
  shelter_id,
  shelter_name,
  adopter_id,
  adoption_date,
  created_at,
  adopter:adopters (
    id,
    full_name,
    email,
    phone,
    message,
    created_at
  )
`;

const formatAdoptedPet = (row) => {
  if (!row) return row;

  const adopter = row.adopter || null;

  return {
    ...row,
    adopter_name: adopter?.full_name || null,
    adopter_email: adopter?.email || null,
    adopter_phone: adopter?.phone || null,
    notes: adopter?.message || null
  };
};

const AdoptedPetModel = {
  // Mengadopsi pet (menambahkan ke tabel adopted_pets)
  adoptPet: async (adoptionData) => {
    const { data, error } = await supabase
      .from('adopted_pets')
      .insert([adoptionData])
      .select(ADOPTED_PET_SELECT)
      .single();
    
    if (error) throw error;
    return formatAdoptedPet(data);
  },

  // Mendapatkan semua adopted pets
  getAllAdoptedPets: async () => {
    const { data, error } = await supabase
      .from('adopted_pets')
      .select(ADOPTED_PET_SELECT)
      .order('adoption_date', { ascending: false });
    
    if (error) throw error;
    return data.map(formatAdoptedPet);
  },

  // Mendapatkan adopted pet berdasarkan ID
  getAdoptedPetById: async (id) => {
    const { data, error } = await supabase
      .from('adopted_pets')
      .select(ADOPTED_PET_SELECT)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return formatAdoptedPet(data);
  },

  // Mendapatkan adopted pets berdasarkan pet_id
  getAdoptedPetByPetId: async (petId) => {
    const { data, error } = await supabase
      .from('adopted_pets')
      .select(ADOPTED_PET_SELECT)
      .eq('pet_id', petId);
    
    if (error) throw error;
    return data.map(formatAdoptedPet);
  },

  // Mendapatkan adopted pets berdasarkan shelter_id
  getAdoptedPetsByShelterId: async (shelterId) => {
    const { data, error } = await supabase
      .from('adopted_pets')
      .select(ADOPTED_PET_SELECT)
      .eq('shelter_id', shelterId)
      .order('adoption_date', { ascending: false });
    
    if (error) throw error;
    return data.map(formatAdoptedPet);
  },

  // Update data adopted pet
  updateAdoptedPet: async (id, updateData) => {
    const { data, error } = await supabase
      .from('adopted_pets')
      .update(updateData)
      .eq('id', id)
      .select(ADOPTED_PET_SELECT)
      .single();
    
    if (error) throw error;
    return formatAdoptedPet(data);
  },

  // Hapus adopted pet (jika adopsi dibatalkan)
  deleteAdoptedPet: async (id) => {
    const { data, error } = await supabase
      .from('adopted_pets')
      .delete()
      .eq('id', id)
      .select(ADOPTED_PET_SELECT)
      .single();
    
    if (error) throw error;
    return formatAdoptedPet(data);
  },

  // Cek apakah pet sudah diadopsi
  checkIfPetAdopted: async (petId) => {
    const { data, error } = await supabase
      .from('adopted_pets')
      .select('id')
      .eq('pet_id', petId)
      .limit(1);
    
    if (error) throw error;
    return data.length > 0;
  }
};

module.exports = AdoptedPetModel;
