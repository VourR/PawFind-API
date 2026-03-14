const supabase = require("../config/supabase");

class ShelterModel {
  static async getAll() {
    return await supabase.from("shelters").select("*");
  }

  static async getById(id) {
    return await supabase.from("shelters").select("*").eq("id", id).single();
  }

  static async create(data) {
    return await supabase.from("shelters").insert(data);
  }

  static async update(id, data) {
    return await supabase.from("shelters").update(data).eq("id", id);
  }

  static async delete(id) {
    return await supabase.from("shelters").delete().eq("id", id);
  }
}

module.exports = ShelterModel;
