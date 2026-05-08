const supabase = require('../config/supabase');

const ADOPTION_REQUEST_SELECT = `
  id,
  pet_id,
  pet:pets (
    name,
    type
  ),
  adopter_id,
  status,
  requested_at,
  reviewed_at,
  reviewed_by,
  admin_notes,
  adopted_pet_id,
  adopter:adopters (
    id,
    full_name,
    email,
    phone,
    message,
    created_at
  )
`;

const formatAdoptionRequest = (row) => {
  if (!row) return row;

  const adopter = row.adopter || null;
  const pet = row.pet || null;

  return {
    ...row,
    adopter_name: adopter?.full_name || null,
    adopter_email: adopter?.email || null,
    adopter_phone: adopter?.phone || null,
    notes: adopter?.message || null,
    pet: pet ? { name: pet.name, type: pet.type } : null
  };
};

const AdoptionRequestModel = {
  createRequest: async (requestData) => {
    const { data, error } = await supabase
      .from('adoption_requests')
      .insert([requestData])
      .select(ADOPTION_REQUEST_SELECT)
      .single();

    if (error) throw error;
    return formatAdoptionRequest(data);
  },

  getAllRequests: async () => {
    const { data, error } = await supabase
      .from('adoption_requests')
      .select(ADOPTION_REQUEST_SELECT)
      .order('requested_at', { ascending: false });

    if (error) throw error;
    return data.map(formatAdoptionRequest);
  },

  getRequestsByStatus: async (status) => {
    const { data, error } = await supabase
      .from('adoption_requests')
      .select(ADOPTION_REQUEST_SELECT)
      .eq('status', status)
      .order('requested_at', { ascending: false });

    if (error) throw error;
    return data.map(formatAdoptionRequest);
  },

  getRequestById: async (id) => {
    const { data, error } = await supabase
      .from('adoption_requests')
      .select(ADOPTION_REQUEST_SELECT)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return formatAdoptionRequest(data);
  },

  updateRequest: async (id, updateData) => {
    const { data, error } = await supabase
      .from('adoption_requests')
      .update(updateData)
      .eq('id', id)
      .select(ADOPTION_REQUEST_SELECT)
      .single();

    if (error) throw error;
    return formatAdoptionRequest(data);
  },

  checkPendingRequestByPetId: async (petId) => {
    const { data, error } = await supabase
      .from('adoption_requests')
      .select('id')
      .eq('pet_id', petId)
      .eq('status', 'pending')
      .limit(1);

    if (error) throw error;
    return data.length > 0;
  }
};

module.exports = AdoptionRequestModel;
