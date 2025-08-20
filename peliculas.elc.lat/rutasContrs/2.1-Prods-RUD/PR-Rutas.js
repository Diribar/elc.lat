"use strict";
// Variables
const router = express.Router();
const API = require("./PR-ControlAPI");
const vista = require("./PR-ControlVista");

// Middlewares
const m = {
	// Específicos de usuarios
	usAltaTerm: require(path.join(carpCompUs.mdw, "usAltaTerm")),
	usAptoInput: require(path.join(carpCompUs.mdw, "usAptoInput")),
	usPenalizaciones: require(path.join(carpCompUs.mdw, "usPenalizaciones")),
	loginApi: require(path.join(carpCompUs.mdw, "loginApi")),

	// Middlewares - Específicos del registro
	entValida: require("../../middlewares/porRegistro/entidadValida"),
	idValido: require("../../middlewares/porRegistro/idValido"),
	rutaOrigen: require("../../middlewares/varios/rutaOrigen"),
	misDetalleProd: require("../../middlewares/varios/misDetalleProd"),
	ordenaCaps: require("../../middlewares/porRegistro/ordenaCaps"),
	edicion: require("../../middlewares/porRegistro/edicionVista"),
	statusCorrecto: require("../../middlewares/porRegistro/statusCorrecto"),

	// Middlewares - Temas de captura
	permUserReg: require("../../middlewares/porRegistro/permUserReg"),
	capturaActivar: require("../../middlewares/varios/capturaActivar"),
	capturaInactivar: require("../../middlewares/varios/capturaInactivar"),

	// Middlewares - Otros
	multer: require(rutaNombreMulter),
};

// Middlewares - Consolidados
const get = [m.rutaOrigen];
const entIdValidos = [m.entValida, m.idValido];
const aptoUsuario = [m.usAltaTerm, m.usPenalizaciones, m.usAptoInput];
const aptoCalificar = [...entIdValidos, m.statusCorrecto, ...aptoUsuario];
const aptoOrdenaCaps = [...aptoCalificar, m.permUserReg, m.ordenaCaps];
const aptoEdicion = [...aptoCalificar, m.permUserReg, m.edicion];

// API - Calificaciones
router.get("/api/pr-obtiene-las-calificaciones", API.califics.delProducto);
router.get("/api/pr-calificacion-del-usuario", m.loginApi, API.califics.delUsuarioProducto);
router.get("/api/pr-elimina-la-calificacion", API.califics.elimina);

// API - Preferencias por producto
router.get("/api/pr-obtiene-opciones-de-preferencia", API.prefsDeCampo.obtieneOpciones);
router.get("/api/pr-guarda-la-preferencia-del-usuario", API.prefsDeCampo.guardaLaPreferencia);

// API - Edición
router.get("/api/pr-valida-edicion-prod", m.loginApi, API.edicion.valida);
router.get("/api/pr-obtiene-original-y-edicion", m.loginApi, API.edicion.obtieneVersionesProd);
router.get("/api/pr-obtiene-variables-prod", API.edicion.variablesProd);
router.get("/api/pr-obtiene-variables-rclv", API.edicion.variablesRclv);
router.get("/api/pr-envia-a-req-session", API.edicion.envioParaSession);
router.get("/api/pr-elimina-nueva", API.edicion.eliminaNueva);
router.get("/api/pr-elimina-guardada", m.loginApi, API.edicion.eliminaGuardada);
router.get("/api/pr-obtiene-rclv", API.edicion.obtieneRclv);

// Vistas - GET
router.get("/detalle/p", entIdValidos, get, m.misDetalleProd, m.capturaInactivar, vista.detalle);
router.get("/edicion/p", aptoEdicion, get, m.capturaActivar, vista.edicion.form);
router.get("/ordena-capitulos/p", aptoOrdenaCaps, get, m.capturaActivar, vista.ordenaCaps.enConstruccion);
router.get("/ordena-capitulos/p", aptoOrdenaCaps, get, m.capturaActivar, vista.ordenaCaps.form);
router.get("/califica/p", aptoCalificar, get, vista.califica.form);

// Vistas - POST
router.post("/edicion/p", aptoEdicion, m.multer.single("avatar"), m.capturaInactivar, vista.edicion.guardar);
router.post("/califica/p", aptoCalificar, vista.califica.guardar);

// Fin
module.exports = router;
