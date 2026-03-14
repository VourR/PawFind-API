const express = require("express");
const cors = require("cors");

require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const petRoutes = require("./src/routes/petRoutes");
const shelterRoutes = require("./src/routes/shelterRoutes");
const adoptedPetRoutes = require("./src/routes/adoptedPetRoutes");

app.use("/api/pets", petRoutes);
app.use("/api/shelters", shelterRoutes);
app.use("/api/adopted-pets", adoptedPetRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log("Server running on port " + PORT));
