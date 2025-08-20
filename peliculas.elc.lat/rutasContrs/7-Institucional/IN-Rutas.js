"use strict";
// Variables
const router = express.Router();
const API = require("./IN-ControlAPI");
const vista = require("./IN-ControlVista");

// Middlewares
const contactanos = require("../../middlewares/varios/contactanos");
const revisaVistasInst = require("../../middlewares/varios/revisaVistasInst");

// API
router.get("/api/in-contactanos-valida", API.contactanos.valida);
router.get("/api/in-contactanos-envia-mail", API.contactanos.enviaMail);

// Vistas - se quitó el 'aptoUsuario', para probar la experiencia
// router.get("/contactanos", aptoUsuario, vista.contactanos.form);
router.get("/contactanos", contactanos, vista.contactanos.form);
router.get("/contactanos/envio-exitoso", vista.contactanos.envioExitoso);
router.get("/contactanos/envio-fallido", vista.contactanos.envioFallido);
router.get("/:codigo", revisaVistasInst, vista.institucional); // institucional

// Fin
module.exports = router;
