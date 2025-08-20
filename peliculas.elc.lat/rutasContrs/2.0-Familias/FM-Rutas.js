"use strict";
// Variables
const router = express.Router();
const vista = require("./FM-ControlVista");
const API = require("./FM-ControlAPI");

// Middlewares
const m = {
	// Específicos de usuarios
	usAltaTerm: require(path.join(carpCompUs.mdw, "usAltaTerm")),
	usAptoInput: require(path.join(carpCompUs.mdw, "usAptoInput")),
	usPenalizaciones: require(path.join(carpCompUs.mdw, "usPenalizaciones")),
	usRolRevPERL: require("../../middlewares/porUsuario/usRolRevPERL"),

	// Específicos del registro
	entValida: require("../../middlewares/porRegistro/entidadValida"),
	idValido: require("../../middlewares/porRegistro/idValido"),
	statusCorrecto: require("../../middlewares/porRegistro/statusCorrecto"),
	creadoPorUsuario: require("../../middlewares/porRegistro/creadoPorUsuario"),
	motivoNecesario: require("../../middlewares/porRegistro/motivoNecesario"),
	comentNecesario: require("../../middlewares/porRegistro/comentNecesario"),
	rutaOrigen: require("../../middlewares/varios/rutaOrigen"),
	statusCompara: require("../../middlewares/porRegistro/statusCompara"),

	// Temas de captura
	permUserReg: require("../../middlewares/porRegistro/permUserReg"),
	capturaActivar: require("../../middlewares/varios/capturaActivar"),
	capturaInactivar: require("../../middlewares/varios/capturaInactivar"),
};

// Middlewares Consolidados
const get = [m.rutaOrigen];
const entIdValidos = [m.entValida, m.idValido];
const aptoUsuario = [m.usAltaTerm, m.usPenalizaciones, m.usAptoInput];
const aptoCombo = [...aptoUsuario, ...entIdValidos, m.statusCorrecto];
const aptoCRUD = [...aptoCombo, m.statusCompara, m.permUserReg];
const aptoEliminarCreador = [...aptoCombo, m.creadoPorUsuario];
const aptoEliminarTodos = [...aptoCombo, m.statusCompara, m.usRolRevPERL];
const post = [m.capturaInactivar];

// APIs
router.get("/api/fm-obtiene-info-del-be", API.obtieneInfo);
router.get("/api/fm-obtiene-registro", API.obtieneRegistro);

// Vistas - GET
router.get("/historial/:siglaFam", entIdValidos, get, m.statusCompara, vista.form.historial);
router.get("/eliminado-por-creador/:siglaFam", aptoEliminarCreador, get, vista.form.elimina);
router.get("/eliminado/:siglaFam", aptoEliminarTodos, get, vista.form.elimina);
router.get("/inactivar/:siglaFam", aptoCRUD, get, m.capturaActivar, vista.form.motivos);
router.get("/recuperar/:siglaFam", aptoCRUD, get, m.capturaActivar, vista.form.historial);

// Vistas - POST
router.post("/inactivar/:siglaFam", aptoCRUD, m.motivoNecesario, post, vista.inacRecupGuardar);
router.post("/recuperar/:siglaFam", aptoCRUD, m.comentNecesario, post, vista.inacRecupGuardar);

// Fin
module.exports = router;
