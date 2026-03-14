const ShelterModel = require("../models/ShelterModel");
const supabase = require("../config/supabase");

module.exports = {
  async getShelters(req, res) {
    const { data, error } = await ShelterModel.getAll();
    if (error) return res.status(400).json(error);
    res.json({ success: true, message: "Shelters fetched successfully", data });
  },

  async getShelterById(req, res) {
    const { id } = req.params;
    const { data, error } = await ShelterModel.getById(id);
    if (error) return res.status(404).json(error);
    res.json({ success: true, message: "Shelter fetched successfully", data });
  },

  async createShelter(req, res) {
    let image_url = null;

    if (req.file) {
      const fileName = `shelters/${Date.now()}-${req.file.originalname}`;
      await supabase.storage.from(process.env.SUPABASE_BUCKET)
        .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });
      const { data } = supabase.storage.from(process.env.SUPABASE_BUCKET)
        .getPublicUrl(fileName);
      image_url = data.publicUrl;
    }

    const payload = { ...req.body, image_url };
    const { data, error } = await ShelterModel.create(payload);
    if (error) return res.status(400).json(error);
    res.json({ success: true, message: "Shelter created successfully", data });
  },

  async updateShelter(req, res) {
    const { id } = req.params;
    let image_url = null;

    if (req.file) {
      const fileName = `shelters/${Date.now()}-${req.file.originalname}`;
      await supabase.storage.from(process.env.SUPABASE_BUCKET)
        .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });
      const { data } = supabase.storage.from(process.env.SUPABASE_BUCKET)
        .getPublicUrl(fileName);
      image_url = data.publicUrl;
    }

    const payload = { ...req.body };
    if (image_url) {
      payload.image_url = image_url;
    }

    const { data, error } = await ShelterModel.update(id, payload);
    if (error) return res.status(400).json(error);
    res.json({ success: true, message: "Shelter updated successfully", data });
  },

  async deleteShelter(req, res) {
    const { id } = req.params;
    const { data, error } = await ShelterModel.delete(id);
    if (error) return res.status(400).json(error);
    res.json({ success: true, message: "Shelter deleted successfully" });
  }
};
