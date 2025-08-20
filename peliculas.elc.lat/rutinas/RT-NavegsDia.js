"use strict";

module.exports = {
	porRuta: {
		control: async function (navegsDia) {
			// Elimina las rutas que correspondan
			let navegsDiaPulido = this.pulido(navegsDia);

			// Obtiene la fechaSig
			let fechaSig = await FN.fechaSig("navegsDiaRutaAcum", navegsDiaPulido);

			// Rutina por fecha mientras la fecha sea menor al día vigente
			while (fechaSig < hoy) {
				// Variables
				const fechaTope = comp.fechaHora.anoMesDia(new Date(fechaSig).getTime() + unDia);
				const navegsDeUnDia = navegsDiaPulido.filter((ruta) => ruta.fecha >= fechaSig && ruta.fecha < fechaTope); // obtiene las rutas del día

				// Si no hay navegsDeUnDia, aumenta el día y saltea el ciclo
				if (!navegsDeUnDia.length) {
					fechaSig = comp.fechaHora.anoMesDia(new Date(fechaSig).getTime() + unDia);
					continue;
				}

				// Consolida la información
				const consolidado = {};
				for (let naveg of navegsDeUnDia) {
					const ruta = comp.rutasConHistorial(naveg.ruta);
					if (ruta) consolidado[ruta] ? consolidado[ruta]++ : (consolidado[ruta] = 1);
				}

				// Agrega un registro con los valores recogidos
				let espera = [];
				const fecha = fechaSig;
				for (let ruta in consolidado)
					espera.push(baseDatos.agregaRegistro("navegsDiaRutaAcum", {fecha, ruta, cant: consolidado[ruta]})); // no importa el orden en el que se guardan dentro del día
				await Promise.all(espera);

				// Actualiza la fecha siguiente
				fechaSig = comp.fechaHora.anoMesDia(new Date(fechaSig).getTime() + unDia);
			}

			// Elimina los registros antiguos
			await FN.eliminaRegsAntiguos("navegsDiaRutaAcum");

			// Fin
			return;
		},
		pulido: (navegsDia) => {
			// Quita el horario de las fechas
			navegsDia = navegsDia.map((n) => ({...n, fecha: comp.fechaHora.anoMesDia(n.fecha)}));

			// Quita las navegaciones que correspondan
			for (let i = navegsDia.length - 1; i > 0; i--) {
				// Variables
				const {id, fecha, cliente_id, ruta} = navegsDia[i];
				const rutaAnt = navegsDia[i - 1];
				const tieneQuery = ruta.includes("/?");

				// Revisa las rutas
				if (
					(tieneQuery &&
						navegsDia.find((n) => n.ruta == ruta && n.cliente_id == cliente_id && n.fecha == fecha && n.id != id)) || // si tiene query, se fija que no esté repetido por el mismo cliente en el día
					(!tieneQuery && rutaAnt.ruta == ruta && rutaAnt.cliente_id == cliente_id && rutaAnt.fecha == fecha) || // si no tiene query, se fija que no sea un 'refresh'
					false
				)
					navegsDia.splice(i, 1);
			}

			// Fin
			return navegsDia;
		},
	},
	porProd: {
		control: async function (navegsDia) {
			// Variables
			let navegsDiaPulido = await this.pulido(navegsDia);
			let fechaSig = await FN.fechaSig("navegsDiaProdAcum", navegsDiaPulido);

			// Rutina por fecha mientras la fecha sea menor al día vigente
			while (fechaSig < hoy) {
				// Variables
				const fechaTope = comp.fechaHora.anoMesDia(new Date(fechaSig).getTime() + unDia);
				const navegsDeUnDia = navegsDiaPulido.filter((ruta) => ruta.fecha >= fechaSig && ruta.fecha < fechaTope); // obtiene las rutas del día

				// Si no hay navegsDeUnDia, aumenta el día e interrumpe el ciclo
				if (!navegsDeUnDia.length) {
					fechaSig = comp.fechaHora.anoMesDia(new Date(fechaSig).getTime() + unDia);
					continue;
				}

				// Consolida la información
				const consolidado = {};
				for (let naveg of navegsDeUnDia) {
					const {entidad, id, nombreCastellano} = naveg;
					const identif = entidad.slice(0, 3).toUpperCase() + id + " - " + nombreCastellano;
					consolidado[identif] ? consolidado[identif]++ : (consolidado[identif] = 1);
				}

				// Agrega un registro con los valores recogidos
				let espera = [];
				const fecha = fechaSig;
				for (let producto in consolidado)
					espera.push(baseDatos.agregaRegistro("navegsDiaProdAcum", {fecha, producto, cant: consolidado[producto]})); // no importa el orden en el que se guardan dentro del día
				await Promise.all(espera);

				// Actualiza la fecha siguiente
				fechaSig = comp.fechaHora.anoMesDia(new Date(fechaSig).getTime() + unDia);
			}

			// Elimina los registros antiguos
			await FN.eliminaRegsAntiguos("navegsDiaProdAcum");

			// Fin
			return;
		},
		pulido: async (navegsDia) => {
			// Quita el horario de las fechas
			navegsDia = navegsDia.map((n) => ({...n, fecha: comp.fechaHora.anoMesDia(n.fecha)}));

			// Deja solamente las rutas 'mirar link'
			navegsDia = navegsDia.filter((n) => n.ruta.startsWith("/links/mirar/l"));

			// Quita las navegaciones que estén repetidas por el mismo cliente en el día
			for (let i = navegsDia.length - 1; i > 0; i--) {
				const {id, fecha, cliente_id, ruta} = navegsDia[i];
				if (navegsDia.find((n) => n.ruta == ruta && n.cliente_id == cliente_id && n.fecha == fecha && n.id != id))
					navegsDia.splice(i, 1);
			}

			// Obtiene los datos de los productos
			navegsDia = navegsDia.map(async (n) => {
				// Obtiene el link con su producto
				const linkId = parseFloat(n.ruta.split("id=")[1]);
				const {prodAsocs} = variables.entidades;
				const link = await baseDatos.obtienePorId("links", linkId, prodAsocs);

				// Obtiene el producto
				const prodAsoc = comp.obtieneDesdeCampo_id.prodAsoc(link);
				const producto = link[prodAsoc];

				// Completa la info
				const datos = {fecha: n.fecha, entidad: prodAsoc, id: producto.id, nombreCastellano: producto.nombreCastellano};
				return datos;
			});
			navegsDia = await Promise.all(navegsDia);

			// Fin
			return navegsDia;
		},
	},
	porHora: {
		control: async function (navegsDia) {
			// Variables
			let navegsDiaPulido = this.pulido(navegsDia);

			// Obtiene la fechaSig
			let fechaSig = await FN.fechaSig("navegsDiaHoraAcum", navegsDiaPulido);

			// Rutina por fecha mientras la fecha sea menor al día vigente
			while (fechaSig < hoy) {
				// Variables
				const fechaTope = comp.fechaHora.anoMesDia(new Date(fechaSig).getTime() + unDia);
				const navegsDeUnDia = navegsDiaPulido.filter((ruta) => ruta.fecha >= fechaSig && ruta.fecha < fechaTope); // obtiene las rutas del día

				// Consolida la información
				const consolidado = {};
				for (const naveg of navegsDeUnDia)
					consolidado[naveg.hora] ? consolidado[naveg.hora]++ : (consolidado[naveg.hora] = 1);

				// Agrega un registro por hora
				for (let hora = 0; hora < 24; hora++) {
					const fecha = fechaSig;
					const diaSem = comp.fechaHora.diaSemUTC(fechaSig);
					const cant = consolidado[hora] ? consolidado[hora] : 0;
					const datos = {fecha, diaSem, hora, cant};
					await baseDatos.agregaRegistro("navegsDiaHoraAcum", datos); // importa el orden en el que se guarda dentro del día
				}

				// Actualiza la fecha siguiente
				fechaSig = comp.fechaHora.anoMesDia(new Date(fechaSig).getTime() + unDia);
			}

			// Elimina los registros antiguos
			await FN.eliminaRegsAntiguos("navegsDiaHoraAcum");

			// Fin
			return;
		},
		pulido: (navegsDia) => {
			// Quita los minutos y segundos de las fechas
			navegsDia = navegsDia.map((n) => ({...n, fechaHora: n.fecha.setMinutes(0, 0)}));

			// Quita las navegaciones que correspondan - repeticiones de las combinaciones cliente-fechaHora
			for (let i = navegsDia.length - 1; i > 0; i--) {
				// Variables
				const {id, fechaHora, cliente_id} = navegsDia[i];

				// Revisa las rutas
				if (navegsDia.find((n) => n.cliente_id == cliente_id && n.fechaHora == fechaHora && n.id != id))
					navegsDia.splice(i, 1);
			}

			// Terminación
			navegsDia = navegsDia.map((n) => {
				n.fecha = comp.fechaHora.anoMesDia(n.fecha);
				n.diaSem = comp.fechaHora.diaSemUTC(n.fechaHora);
				n.hora = new Date(n.fechaHora).getUTCHours();
				return n;
			});

			// Fin
			return navegsDia;
		},
	},
};

// Funciones auxiliares
const FN = {
	// Auxiliares
	fechaSig: async (tabla, navegsDiaPulido) => {
		// Obtiene el último registro de acumuladas
		let ultRegistro = await baseDatos.obtienePorCondicionElUltimo(tabla);
		if (!ultRegistro) ultRegistro = {fecha: {[Op.is]: null}};

		// Obtiene la fecha siguiente
		let fechaSig = ultRegistro.fecha
			? new Date(ultRegistro.fecha).getTime() + unDia // el día siguiente de la del último registro de 'ultRegistro'
			: navegsDiaPulido[0].fecha; // la del primer registro de 'navegsDiaPulido'
		fechaSig = comp.fechaHora.anoMesDia(fechaSig); // sólo importa la fecha

		// Fin
		return fechaSig;
	},
	eliminaRegsAntiguos: async (tabla) => {
		// Variables
		const ultRegistro = await baseDatos.obtienePorCondicionElUltimo(tabla);
		if (!ultRegistro) return;

		// Obtiene la fecha desde la cual eliminar registros
		const ultFecha = ultRegistro.fecha;
		const fechaEliminar = new Date(new Date(ultFecha).getTime() - unaSemana * 4);

		// Elimina los registros antiguos
		await baseDatos.eliminaPorCondicion(tabla, {fecha: {[Op.lte]: fechaEliminar}});

		// Fin
		return;
	},
};
