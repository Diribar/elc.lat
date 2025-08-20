"use strict";

window.addEventListener("load", async () => {
	// Variables
	const DOM = {
		form: document.querySelector("form"),
		submit: document.querySelector("form button[type='submit']"),
	};

	// Eventos - Change
	DOM.form.addEventListener("change", () => DOM.submit.classList.remove("inactivo"));

	// Eventos - Submit
	DOM.form.addEventListener("submit", (e) => {
		if (DOM.submit.className.includes("inactivo")) e.preventDefault();
	});
	DOM.submit.addEventListener("click", (e) => {
		if (DOM.submit.className.includes("inactivo")) e.preventDefault();
	});
});
