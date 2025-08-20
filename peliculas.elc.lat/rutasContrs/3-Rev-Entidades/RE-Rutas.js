"use strict";
// Variables
const router = express.Router();
const API = require("./RE-ControlAPI");
const vista = require("./RE-ControlVista");
const vistaRclv = require("../2.2-RCLVs/RCLV-ControlVista");
const vistaFM = require("../2.0-Familias/FM-ControlVista");

// Middlewares particulares
const m = {
	// Específicos de usuarios
	usAltaTerm: require(path.join(carpCompUs.mdw, "usAltaTerm")),
	usAptoInput: require(path.join(carpCompUs.mdw, "usAptoInput")),
	usPenalizaciones: require(path.join(carpCompUs.mdw, "usPenalizaciones")),
	usRolAutTablEnts: require(path.join(carpCompUs.mdw, "usRolAutTablEnts")),
	loginApi: require(path.join(carpCompUs.mdw, "loginApi")),
	usRolRevPERL: require("../../middlewares/porUsuario/usRolRevPERL"),
	usRolRevLinks: require("../../middlewares/porUsuario/usRolRevLinks"),

	// Específicos del registro
	entValida: require("../../middlewares/porRegistro/entidadValida"),
	idValido: require("../../middlewares/porRegistro/idValido"),
	rutaOrigen: require("../../middlewares/varios/rutaOrigen"),
	statusCorrecto: require("../../middlewares/porRegistro/statusCorrecto"),
	statusCompara: require("../../middlewares/porRegistro/statusCompara"),
	edicionAPI: require("../../middlewares/porRegistro/edicionAPI"),
	edicionVista: require("../../middlewares/porRegistro/edicionVista"),
	prodSinRclvAprob: require("../../middlewares/porRegistro/prodSinRclvAprob"),
	linksEnSemana: require("../../middlewares/porRegistro/linksEnSemana"),
	linkAltaBaja: require("../../middlewares/porRegistro/linkAltaBaja"),
	motivoNecesario: require("../../middlewares/porRegistro/motivoNecesario"),
	motivoOpcional: require("../../middlewares/porRegistro/motivoOpcional"),

	// Temas de captura
	permUserReg: require("../../middlewares/porRegistro/permUserReg"),
	capturaActivar: require("../../middlewares/varios/capturaActivar"),
	capturaInactivar: require("../../middlewares/varios/capturaInactivar"),

	// Middlewares - Otros
	multer: require(rutaNombreMulter),
};

// Middlewares - Consolidados GET
const get = [m.capturaActivar, m.rutaOrigen];
const entIdValidos = [m.entValida, m.idValido];
const aptoUsuario = [m.usAltaTerm, m.usPenalizaciones, m.usAptoInput];
const combo = [...entIdValidos, ...aptoUsuario, m.permUserReg, m.usRolRevPERL];
const aptoCrud = [...combo, m.statusCorrecto];
const correcs = [...combo, m.statusCompara];
const aptoEdicion = [...aptoCrud, m.edicionVista];
const abmLinks = [...aptoCrud, m.linksEnSemana, m.usRolRevLinks];
const post = [m.capturaInactivar];

// APIs - Tablero
router.get("/api/re-actualiza-visibles", API.actualizaVisibles);

// APIs - Producto y Rclv
router.get("/api/re-motivo-generico", API.obtieneMotivoGenerico);
router.get("/api/re-edicion-aprob-rech", m.loginApi, m.edicionAPI, API.edicAprobRech);

// APIs- Links
router.get("/api/re-edicion-link", m.loginApi, m.edicionAPI, API.edicAprobRech);
router.get("/api/lk-aprob-inactivo", m.loginApi, m.linkAltaBaja, API.aprobInactivo);

// Vistas - Tablero de Control
router.get("/tablero", aptoUsuario, m.usRolAutTablEnts, vista.tableroControl);

// Vistas - GET
router.get("/alta/p/:entidad", aptoCrud, get, m.prodSinRclvAprob, vista.form.altaProd);
router.get("/alta/r/:entidad", aptoCrud, get, vistaRclv.altaEdic.form);
router.get("/edicion/:entidad", aptoEdicion, get, vista.form.edicion);
router.get("/rechazar/:entidad", aptoCrud, get, vistaFM.form.motivos);
router.get("/inactivar/:entidad", aptoCrud, get, vistaFM.form.historial);
router.get("/recuperar/:entidad", aptoCrud, get, vistaFM.form.historial);
router.get("/solapamiento/r/:entidad", aptoCrud, get, vistaRclv.altaEdic.form);
router.get("/abm-links/p/:entidad", abmLinks, get, vista.form.links);
router.get("/cambiar-el-motivo/:entidad", correcs, get, m.statusCorrecto, vista.form.cambiarMotivo);
router.get("/unificar-status/:entidad", correcs, get, vista.form.unificarStatus);
router.get("/registros-sin-historial/:entidad", correcs, get, vista.form.regSinHistorial);

// Vistas - POST
router.post("/alta/p/:entidad", aptoCrud, post, m.prodSinRclvAprob, vista.guardar.cambioStatus); // Cambios de status
router.post("/alta/r/:entidad", aptoCrud, post, m.multer.single("avatar"), vista.guardar.cambioStatus); // se puede cambiar el avatar
router.post("/edicion/:entidad", aptoEdicion, post, m.motivoOpcional, vista.guardar.avatar);
router.post("/rechazar/:entidad", aptoCrud, post, m.motivoNecesario, vista.guardar.cambioStatus);
router.post("/inactivar/:entidad", aptoCrud, post, vista.guardar.cambioStatus); // Va sin 'motivo'
router.post("/recuperar/:entidad", aptoCrud, post, vista.guardar.cambioStatus); // Va sin 'motivo'
router.post("/solapamiento/r/:entidad", aptoCrud, post, vista.guardar.solapam);
router.post("/cambiar-el-motivo/:entidad", correcs, post, m.statusCorrecto, m.motivoNecesario, vista.guardar.cambiarMotivo);
router.post("/unificar-status/:entidad", correcs, post, vista.guardar.unificarStatus);

// Fin
module.exports = router;
