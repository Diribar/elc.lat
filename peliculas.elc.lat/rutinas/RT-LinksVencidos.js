"use strict";
// Variables
const puppeteer = require("puppeteer");
const procsFM = require("../rutasContrs/2.0-Familias/FM-FN-Procesos");
const apiKey = require("../variables/API-keys").google;
const motivoVideoNoDisp_id = 31;

module.exports = {
	porProv: async function ({links, prov}) {
		// Variables - portales de videos
		const OK = prov == "okRu";
		const YT = prov == "youTube";
		const DM = prov == "dm";
		if ((!OK && !YT && !DM) || !links.length) return;

		// Variables - generales
		const inicio = Date.now();
		const cantLinks = links.length;
		let cantLinksOk = 0;
		let espera = [];
		let browser, page, anterior;

		// Configuración inicial para ok.ru
		if (OK || DM) {
			const datosDelBrowser = {headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox"]};
			if (!entDesarr) datosDelBrowser.executablePath = "/usr/bin/google-chrome";
			browser = await puppeteer.launch(datosDelBrowser); // Abre el browser
			page = await browser.newPage();
			if (entDesarr) await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
			await page.setViewport({width: 1280, height: 720});
		}

		// Rutina
		let contador = 0;
		for (const link of links) {
			// Obtiene el código necesario para validar
			const codigo = OK || DM ? "https://" + link.url : link.url.split("v=")[1];

			// Obtiene el resultado de la validación
			const respuesta =
				(YT &&
					this.porLinkYT(codigo).then(async (res) => {
						if (res.sinAccesoAlSitio) return "break";
						if (res.linkOk) cantLinksOk++;
						await this.porLinkTerm(link, res.linkOk);
					})) ||
				(OK &&
					(await this.porLinkOK(codigo, page).then((res) => {
						if (res.sinAccesoAlSitio) return "break";
						if (res.linkOk) cantLinksOk++;
						this.porLinkTerm(link, res.linkOk); // no se necesita el 'await', porque el proveedor va más lento
					}))) ||
				(DM &&
					(await this.porLinkDM(codigo, page).then((res) => {
						if (res.sinAccesoAlSitio) return "break";
						if (res.linkOk) cantLinksOk++;
						this.porLinkTerm(link, res.linkOk); // no se necesita el 'await', porque el proveedor va más lento
					})));
			espera.push(respuesta);

			// Progreso
			contador++;
			if (!(contador % 5)) {
				// Completa los procesos
				espera = await Promise.all(espera);
				if (espera.includes("break")) break;
				espera.length = 0;

				// Progreso
				const ahora = Date.now();
				console.log(
					prov.toUpperCase(), // portal
					Math.round((contador / links.length) * 100) + "%", // avance
					Math.round((ahora - (anterior || inicio)) / 5) + "ms", // velocidad
					"✅ " + cantLinksOk,
					"- ❌ " + (contador - cantLinksOk),
					"- " + Math.round((cantLinksOk / contador) * 100) + "%"
				);
				anterior = ahora;
			}
		}
		await Promise.all(espera);
		if (OK) browser.close(); // no hace falta el 'await', ya que no se vuelve a abrir

		// Estadísticas
		const fin = Date.now();
		const duracion = fin - inicio;
		const promedio = Math.round(duracion / cantLinks);
		const cantNoVigentes = cantLinks - cantLinksOk;
		const porcVigentes = Math.round((cantLinksOk / cantLinks) * 100);
		const plural = cantNoVigentes != 1 ? "s" : "";
		console.log(
			prov.toUpperCase() + ":",
			promedio + "ms en promedio -",
			cantNoVigentes + " link" + plural + " no vigente" + plural + " -",
			"precisión " + porcVigentes + "%\n"
		);

		// Fin
		return;
	},
	porLinkYT: async (videoId) => {
		// Variables
		const url = `https://www.googleapis.com/youtube/v3/videos?part=status&id=${videoId}&key=${apiKey}`;

		// Validaciones
		try {
			// Lectura del link
			const response = await fetch(url);
			if (!response.ok) {
				console.log("Sin acceso al sitio - !response.ok");
				return {sinAccesoAlSitio: true};
			}

			// Verifica si es una lectura con el formato esperado
			const data = await response.json();
			const items = data.items;
			if (!items.length) return {linkOk: false}; // video no disponible

			// Verifica el status
			const status = items[0].status;
			const linkOk = status.uploadStatus == "processed" && status.privacyStatus != "private";
			if (!linkOk) console.log(status.uploadStatus, status.privacyStatus);

			// Fin
			return {linkOk};
		} catch (error) {
			console.log("Sin acceso al sitio - timeout");
			return {sinAccesoAlSitio: true};
		}
	},
	porLinkOK: async (url, page) => {
		// Variables
		const inicio = Date.now();

		// Averigua si existe el link
		try {
			// Verifica el status de la lectura
			const response = await page.goto(url, {waitUntil: "domcontentloaded", timeout: 20000}); // 20segs.
			if (response.status() != 200) {
				console.log("Sin acceso al sitio - status != 200");
				return {sinAccesoAlSitio: true};
			}

			// Verifica el reproductor
			try {
				await page.waitForSelector("div.vp-layer", {timeout: 2000});
				return {linkOk: true};
			} catch {
				return {linkOk: false};
			}
		} catch (error) {
			console.log("Sin acceso al sitio - timeout - " + (Date.now() - inicio));
			return {sinAccesoAlSitio: true};
		} finally {
			// console.timeEnd("procesoOkRu");
		}
	},
	porLinkDM: async (url, page) => {
		try {
			// Verifica el status de la lectura
			const response = await page.goto(url, {waitUntil: "domcontentloaded", timeout: 20000});
			if (response.status() != 200) console.log("mal - status " + response.status());
			if (response.status() != 200) return false;

			// Verifica el reproductor
			console.time("procesoDM");
			try {
				await page.waitForSelector("body > iframe[name='googlefcPresent']", {timeout: 8000});
				console.log("bien - reproductor");
				return true;
			} catch {
				console.log("mal - reproductor");
				return false;
			} finally {
				console.timeEnd("procesoDM");
			}
		} catch (error) {
			console.log("mal - domcontentloaded dm");
			return false;
		}
	},
	porLinkTerm: async (link, vigente) => {
		// Actualiza en la BD
		if (!link.anoEstreno) {
			const prodAsoc = comp.obtieneDesdeCampo_id.prodAsoc(link);
			baseDatos
				.obtienePorId("links", link.id, variables.entidades.prodAsocs)
				.then((n) => n[prodAsoc] && n[prodAsoc].anoEstreno)
				.then((anoEstreno) => anoEstreno && baseDatos.actualizaPorId("links", link.id, {anoEstreno}));
		}

		// CONSECUENCIAS - Actualiza el registro del link
		const statusRegistro_id = vigente ? aprobado_id : inactivar_id;
		const datosLink = {
			statusSugeridoPor_id: usAutom_id,
			statusSugeridoEn: new Date(),
			statusRegistro_id,
			motivo_id: vigente ? null : motivoVideoNoDisp_id,
			fechaVencim: null,
		};
		await baseDatos.actualizaPorId("links", link.id, datosLink);

		// CONSECUENCIAS - Actualiza los productos en los campos de 'links' y la variable de links vencidos
		await procsFM.accsEnDepsPorCambioDeStatus("links", {...link, statusRegistro_id});

		// Fin
		return;
	},
};
