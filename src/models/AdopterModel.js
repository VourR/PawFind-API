const supabase = require('../config/supabase');

const AdopterModel = {
  createAdopter: async (adopterData) => {
    const { data, error } = await supabase
      .from('adopters')
      .insert([adopterData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateAdopter: async (id, updateData) => {
    const { data, error } = await supabase
      .from('adopters')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteAdopter: async (id) => {
    const { error } = await supabase
      .from('adopters')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

module.exports = AdopterModel;
