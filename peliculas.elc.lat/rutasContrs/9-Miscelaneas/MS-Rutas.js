"use strict";
// Variables
const router = express.Router();
const API = require("./MS-ControlAPI");
const vista = require("./MS-ControlVista");

// Middlewares
const m = {
	// Específicos de usuarios
	usAltaTerm: require(path.join(carpCompUs.mdw, "usAltaTerm")),
	usAptoInput: require(path.join(carpCompUs.mdw, "usAptoInput")),
	usPenalizaciones: require(path.join(carpCompUs.mdw, "usPenalizaciones")),
	usRolRevPERL: require("../../middlewares/porUsuario/usRolRevPERL"),

	// Middlewares - Varios
	entValida: require("../../middlewares/porRegistro/entidadValida"),
	capturaInactivar: require("../../middlewares/varios/capturaInactivar"),
};

// Middlewares - Consolidado
const aptoUsuario = [m.usAltaTerm, m.usAptoInput, m.usPenalizaciones];

// APIs
router.get("/api/cmp-horario-inicial", API.horarioInicial);
router.get("/api/cmp-busqueda-rapida", API.busquedaRapida);
router.get("/api/cmp-guarda-url-br", API.guardaUrlBusqRap);
router.get("/api/cmp-bienvenido-aceptado", API.bienvenidoAceptado);
router.get("/api/obtiene-cookies", API.obtieneCookies);

// Vista
router.get("/mantenimiento", aptoUsuario, vista.mantenim);
router.get("/movimientos-del-dia", aptoUsuario, m.usRolRevPERL, vista.navegsDia);

// Redireciona
router.get("/:entidad/inactivar-captura", m.entValida, m.capturaInactivar, vista.redirecciona.urlDeDestino); // inactivar captura

// Información para mostrar en el explorador
router.get("/session", vista.listados.session);
router.get("/cookies", vista.listados.cookies);
router.get("/listados/links", vista.listados.links); // busca las películas con más cantidad de links

// Fin
module.exports = router;
