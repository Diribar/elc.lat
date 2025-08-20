"use strict";
// Variables
const router = express.Router();
const API = require("./RCLV-ControlAPI");
const vista = require("./RCLV-ControlVista");

// Middlewares
const m = {
	// Específicos de usuarios
	usAltaTerm: require(path.join(carpCompUs.mdw, "usAltaTerm")),
	usAptoInput: require(path.join(carpCompUs.mdw, "usAptoInput")),
	usPenalizaciones: require(path.join(carpCompUs.mdw, "usPenalizaciones")),

	// Middlewares - Específicos del registro
	rutaOrigen: require("../../middlewares/varios/rutaOrigen"),
	entValida: require("../../middlewares/porRegistro/entidadValida"),
	idValido: require("../../middlewares/porRegistro/idValido"),
	edicion: require("../../middlewares/porRegistro/edicionVista"),
	statusCorrecto: require("../../middlewares/porRegistro/statusCorrecto"),
	rclvNoEditable: require("../../middlewares/porRegistro/rclvNoEditable"),

	// Middlewares - Temas de captura
	permUserReg: require("../../middlewares/porRegistro/permUserReg"),
	capturaActivar: require("../../middlewares/varios/capturaActivar"),
	capturaInactivar: require("../../middlewares/varios/capturaInactivar"),

	// Middlewares - Otros
	multer: require(rutaNombreMulter),
};

// Middlewares - Consolidados
const get = [m.rutaOrigen];
const aptoUsuario = [m.usAltaTerm, m.usPenalizaciones, m.usAptoInput];
const aptoAgregar = [m.entValida, ...aptoUsuario];
const aptoDetalle = [m.entValida, m.idValido, m.capturaInactivar];
const aptoCRUD = [m.entValida, m.idValido, m.statusCorrecto, ...aptoUsuario, m.permUserReg];
const aptoEdicion = [...aptoCRUD, m.edicion, m.rclvNoEditable];

// APIs - Detalle
router.get("/api/rc-obtiene-variables-detalle", API.obtieneVars.detalle);

// APIs - Agregar/Editar
router.get("/api/rc-obtiene-variables-edicion", API.obtieneVars.edicion);
router.get("/api/rc-valida-sector-edicion", API.validaSector);
router.get("/api/rc-registros-con-esa-fecha", API.registrosConEsaFecha);
router.get("/api/rc-prefijos", API.prefijos);
router.get("/api/rc-obtiene-leyenda-nombre", API.obtieneLeyNombre);

// Vistas - Form
router.get("/agregar/r", aptoAgregar, vista.altaEdic.form);
router.get("/detalle/r", get, aptoDetalle, vista.detalle);
router.get("/edicion/r", get, aptoEdicion, m.capturaActivar, vista.altaEdic.form);
router.get("/productos-por-registro/r", m.entValida, vista.prodsPorReg); // busca los rclvs con más cantidad de productos

// Vistas - Post
router.post("/agregar/r", aptoAgregar, m.multer.single("avatar"), vista.altaEdic.guardar);
router.post("/edicion/r", aptoEdicion, m.multer.single("avatar"), m.capturaInactivar, vista.altaEdic.guardar);

// Fin
module.exports = router;
