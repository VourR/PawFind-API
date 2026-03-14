const supabase = require("../config/supabase");

class PetModel {
  static async getAll() {
    return await supabase.from("pets").select("*");
  }

  static async getById(id) {
    return await supabase.from("pets").select("*").eq("id", id).single();
  }

  static async create(data) {
    return await supabase.from("pets").insert(data);
  }

  static async update(id, data) {
    return await supabase.from("pets").update(data).eq("id", id);
  }

  static async delete(id) {
    return await supabase.from("pets").delete().eq("id", id);
  }
}

module.exports = PetModel;
