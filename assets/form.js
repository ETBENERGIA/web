(function () {
  // URL de la aplicación web de Google Apps Script (cuenta gorka@etbenergia.es) que envía la factura a estudios@etbenergia.es
  var ENDPOINT = "https://script.google.com/macros/s/AKfycby62uy7Mf4j99jseh_0DzTb_5emMykpDD0oqc-xLw6ce99wZkz9N8CIfgZiS7kgNBLf/exec";
  var MAX_ARCHIVOS = 3;
  var MAX_BYTES = 10 * 1024 * 1024;

  var form = document.getElementById("form");
  var input = document.getElementById("archivo");
  var zona = document.getElementById("zona");
  var lista = document.getElementById("lista");
  var aviso = document.getElementById("aviso");
  var boton = document.getElementById("enviar");
  var ok = document.getElementById("ok");
  var motivo = document.getElementById("motivo");
  var archivos = [];

  document.getElementById("anio").textContent = new Date().getFullYear();

  document.querySelectorAll("[data-motivo]").forEach(function (a) {
    a.addEventListener("click", function () { motivo.value = a.getAttribute("data-motivo"); });
  });

  function tam(b) { return b > 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB"; }
  function total() { return archivos.reduce(function (s, f) { return s + f.size; }, 0); }
  function error(t) { aviso.textContent = t; aviso.className = "aviso error"; }
  function limpiar() { aviso.textContent = ""; aviso.className = "aviso"; }

  function pintar() {
    lista.innerHTML = "";
    archivos.forEach(function (f, i) {
      var li = document.createElement("li");
      var n = document.createElement("span");
      n.textContent = f.name + " · " + tam(f.size);
      var q = document.createElement("button");
      q.type = "button";
      q.textContent = "Quitar";
      q.setAttribute("aria-label", "Quitar " + f.name);
      q.addEventListener("click", function () { archivos.splice(i, 1); pintar(); });
      li.appendChild(n); li.appendChild(q); lista.appendChild(li);
    });
  }

  function añadir(files) {
    limpiar();
    Array.prototype.forEach.call(files, function (f) {
      if (archivos.length >= MAX_ARCHIVOS) { error("Puedes subir hasta " + MAX_ARCHIVOS + " archivos."); return; }
      if (total() + f.size > MAX_BYTES) { error("Los archivos superan 10 MB. Si tu factura pesa más, envíala a estudios@etbenergia.es."); return; }
      archivos.push(f);
    });
    pintar();
  }

  input.addEventListener("change", function () { añadir(input.files); input.value = ""; });
  ["dragenter", "dragover"].forEach(function (e) { zona.addEventListener(e, function (ev) { ev.preventDefault(); zona.classList.add("encima"); }); });
  ["dragleave", "drop"].forEach(function (e) { zona.addEventListener(e, function () { zona.classList.remove("encima"); }); });
  zona.addEventListener("drop", function (ev) { ev.preventDefault(); añadir(ev.dataTransfer.files); });

  function leer(f) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res({ nombre: f.name, tipo: f.type || "application/octet-stream", datos: String(r.result).split(",")[1] }); };
      r.onerror = rej;
      r.readAsDataURL(f);
    });
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    limpiar();
    var d = new FormData(form);
    if (d.get("web")) return;
    if (!d.get("nombre") || !d.get("empresa")) return error("Escribe tu nombre y el de tu empresa.");
    var email = String(d.get("email") || "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error("Revisa el correo electrónico.");
    var esEstudio = /^Estudio/.test(d.get("motivo"));
    if (esEstudio && !archivos.length) return error("Sube tu última factura para poder hacer el estudio.");
    if (!d.get("acepto")) return error("Para enviarla, acepta la política de privacidad.");

    boton.disabled = true;
    boton.textContent = "Enviando…";
    Promise.all(archivos.map(leer)).then(function (adj) {
      var datos = {
        nombre: d.get("nombre"), empresa: d.get("empresa"), email: email,
        telefono: d.get("telefono") || "", motivo: d.get("motivo"), mensaje: d.get("mensaje") || "",
        acepto: true, pagina: location.href, archivos: adj
      };
      return fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(datos) });
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (!j || !j.ok) throw new Error("respuesta");
      form.style.display = "none";
      ok.style.display = "flex";
      ok.focus();
    }).catch(function () {
      boton.disabled = false;
      boton.textContent = "Enviar factura";
      error("No hemos podido enviarla. Inténtalo de nuevo o mándala a estudios@etbenergia.es.");
    });
  });
})();
