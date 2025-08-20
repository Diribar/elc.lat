"use strict";
// Variables
const router = express.Router();
const vistaMS = require("../9-Miscelaneas/MS-ControlVista.js");

// Middlewares - Específicos del registro
const entValidaAnt = require("../../middlewares/porRegistro/entValidaAnt.js");
const idValidoAnt = require("../../middlewares/porRegistro/idValidoAnt.js");
const linkIdValidoAnt = require("../../middlewares/porRegistro/linkIdValidoAnt.js");
const entId = [entValidaAnt, idValidoAnt];

// Vistas
router.get("/abm", entValidaAnt, idValidoAnt, vistaMS.redirecciona.rutasAntiguas);
router.get("/visualizacion", linkIdValidoAnt, vistaMS.redirecciona.rutasAntiguas);

// Fin
module.exports = router;
