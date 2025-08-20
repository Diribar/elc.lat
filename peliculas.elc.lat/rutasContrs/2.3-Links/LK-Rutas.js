"use strict";
// Variables
const router = express.Router();
const API = require("./LK-ControlAPI");
const vista = require("./LK-ControlVista");

// Middlewares
const m = {
	// Específicos de usuarios
	usAltaTerm: require(path.join(carpCompUs.mdw,"usAltaTerm")),
	usAptoInput: require(path.join(carpCompUs.mdw,"usAptoInput")),
	usPenalizaciones: require(path.join(carpCompUs.mdw,"usPenalizaciones")),

	// Middlewares - Específicos del registro
	entValida: require("../../middlewares/porRegistro/entidadValida"),
	idValido: require("../../middlewares/porRegistro/idValido"),
	statusCorrecto: require("../../middlewares/porRegistro/statusCorrecto"),

	// Middlewares - Otros
	permUserReg: require("../../middlewares/porRegistro/permUserReg"),
	capturaActivar: require("../../middlewares/varios/capturaActivar"),
	rutaOrigen: require("../../middlewares/varios/rutaOrigen"),
};

// Middlewares - Consolidados
const entIdValidos = [m.entValida, m.idValido, m.rutaOrigen];
const aptoUsuario = [m.usAltaTerm, m.usPenalizaciones, m.usAptoInput];
const aptoABM = [...entIdValidos, ...aptoUsuario, m.statusCorrecto, m.permUserReg];

// APIs - Links
router.get("/api/lk-valida", API.valida);
router.get("/api/lk-obtiene-provs", API.obtieneProvs);
router.get("/api/lk-obtiene-embeded", API.obtieneEmbededLink);

// APIs - ABM
router.get("/api/lk-guardar", API.guarda);
router.get("/api/lk-inactiva-o-elimina", API.inactivaElimina);
router.get("/api/lk-recuperar", API.recupera);
router.get("/api/lk-deshacer", API.deshace);

// Vistas
router.get("/abm-links/p", aptoABM, m.capturaActivar, vista.abm);
router.get("/mirar/l", entIdValidos, vista.mirarLink);

// Fin
module.exports = router;
