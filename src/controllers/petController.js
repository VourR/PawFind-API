const PetModel = require("../models/PetModel");
const supabase = require("../config/supabase");

module.exports = {
  async getPets(req, res) {
    const { data, error } = await PetModel.getAll();
    if (error) return res.status(400).json(error);
    res.json({ success: true, message: "Pets fetched successfully", data });
  },

  async getPetById(req, res) {
    const { id } = req.params;
    const { data, error } = await PetModel.getById(id);
    if (error) return res.status(404).json(error);
    res.json({ success: true, message: "Pet fetched successfully", data });
  },

  async createPet(req, res) {
    let image_url = null;

    if (req.file) {
      const fileName = `pets/${Date.now()}-${req.file.originalname}`;
      await supabase.storage.from(process.env.SUPABASE_BUCKET)
        .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });

      const { data } = supabase.storage
        .from(process.env.SUPABASE_BUCKET)
        .getPublicUrl(fileName);
      image_url = data.publicUrl;
    }

    const payload = { ...req.body, image_url };
    const { data, error } = await PetModel.create(payload);
    if (error) return res.status(400).json(error);

    res.json({ success: true, message: "Pet created successfully", data });
  },

  async updatePet(req, res) {
    const { id } = req.params;
    let image_url = null;

    if (req.file) {
      const fileName = `pets/${Date.now()}-${req.file.originalname}`;
      await supabase.storage.from(process.env.SUPABASE_BUCKET)
        .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });

      const { data } = supabase.storage
        .from(process.env.SUPABASE_BUCKET)
        .getPublicUrl(fileName);
      image_url = data.publicUrl;
    }

    const payload = { ...req.body };
    if (image_url) {
      payload.image_url = image_url;
    }

    const { data, error } = await PetModel.update(id, payload);
    if (error) return res.status(400).json(error);

    res.json({ success: true, message: "Pet updated successfully", data });
  },

  async deletePet(req, res) {
    const { id } = req.params;
    const { data, error } = await PetModel.delete(id);
    if (error) return res.status(400).json(error);
    res.json({ success: true, message: "Pet deleted successfully" });
  }
};
