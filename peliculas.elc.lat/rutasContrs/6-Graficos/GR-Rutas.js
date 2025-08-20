"use strict";
// Variables
const router = express.Router();
const API = require("./GR-ControlAPI");
const vista = require("./GR-ControlVista");

// Middlewares - Específicos de usuarios
const usAltaTerm = require(path.join(carpCompUs.mdw,"usAltaTerm"));
const usRolAutTablEnts = require(path.join(carpCompUs.mdw,"usRolAutTablEnts"));
const combinados = [usAltaTerm, usRolAutTablEnts];

// API y Vistas
for (let codigo in graficos) router.get("/api/gr-" + graficos[codigo].url, API[codigo]);
for (let codigo in graficos) router.get("/" + graficos[codigo].url, combinados, vista[codigo]);

// Fin
module.exports = router;
