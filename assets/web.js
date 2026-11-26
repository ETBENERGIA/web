/* ETB Energía · interacciones de la web (cabecera, menú, gráficas, animaciones).
   El formulario vive aparte en form.js y no depende de este archivo. */
(function () {
  var quieto = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Cabecera: transparente sobre la portada, sólida al bajar; sección activa */
  var cab = document.getElementById("cab");
  var portada = document.getElementById("inicio");
  function alScroll() {
    var y = window.scrollY || 0;
    if (cab) cab.classList.toggle("solida", y > (portada ? portada.offsetHeight - 90 : 40));
    if (!quieto) parallax(y);
  }

  /* Menú móvil */
  var menu = document.getElementById("menu");
  var nav = document.getElementById("nav");
  if (menu && nav) {
    menu.addEventListener("click", function () {
      var abierto = cab.classList.toggle("abierto");
      menu.setAttribute("aria-expanded", abierto ? "true" : "false");
      menu.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") { cab.classList.remove("abierto"); menu.setAttribute("aria-expanded", "false"); menu.setAttribute("aria-label", "Abrir menú"); }
    });
  }

  /* Parallax suave del paisaje */
  var capas = Array.prototype.slice.call(document.querySelectorAll(".paisaje .capa"));
  function parallax(y) {
    if (!portada || y > portada.offsetHeight) return;
    capas.forEach(function (c) { c.style.transform = "translateY(" + (y * parseFloat(c.getAttribute("data-vel"))).toFixed(1) + "px)"; });
  }
  var pendiente = false;
  window.addEventListener("scroll", function () {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(function () { pendiente = false; alScroll(); });
  }, { passive: true });
  alScroll();

  /* Aparición al hacer scroll + sección activa en el menú */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("visto"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    document.querySelectorAll(".aparece, .colab").forEach(function (el) { io.observe(el); });

    var flujo = document.getElementById("flujo");
    if (flujo) new IntersectionObserver(function (e, o) {
      if (e[0].isIntersecting) { flujo.style.setProperty("--avance", "1"); o.disconnect(); }
    }, { threshold: 0.4 }).observe(flujo);

    var enlaces = {};
    document.querySelectorAll("#nav a").forEach(function (a) { enlaces[a.getAttribute("href").slice(1)] = a; });
    var spy = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        var a = enlaces[en.target.id];
        if (!a && en.isIntersecting) { Object.keys(enlaces).forEach(function (k) { enlaces[k].classList.remove("activo"); }); return; }
        if (!a) return;
        if (en.isIntersecting) {
          Object.keys(enlaces).forEach(function (k) { enlaces[k].classList.remove("activo"); });
          a.classList.add("activo");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(enlaces).concat(["inicio", "como", "factura"]).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
  } else {
    document.querySelectorAll(".aparece").forEach(function (el) { el.classList.add("visto"); });
  }

  /* Periodos de la tarifa 2.0TD por horas (esquema, no precios) */
  var barras = document.getElementById("barras");
  var burbuja = document.getElementById("burbuja");
  var notaDia = document.getElementById("nota-dia");
  if (barras) {
    var nombres = { p: "Punta", l: "Llano", v: "Valle" };
    var colores = { p: "var(--rojo)", l: "var(--sol)", v: "var(--valle)" };
    var alto = { v: 30, l: 60, p: 94 };
    var vaiven = [0, 3, -2, 4, -3, 2, 5, -4, 3, -2, 4, 1, -3, 2, 5, -2, 3, -4, 2, 5, -3, 1, 4, -2];
    var finde = false;
    var notas = {
      laborable: "En días laborables, la punta va de 10 a 14 y de 18 a 22. Mover consumo fuera de esas horas, o pagarlas a mejor precio, es donde suele estar el ahorro.",
      finde: "Sábados, domingos y festivos nacionales, todo el día es valle. Si tu negocio abre en fin de semana, eso cambia qué tarifa te conviene."
    };
    function periodo(h) {
      if (finde || h < 8) return "v";
      if ((h >= 10 && h < 14) || (h >= 18 && h < 22)) return "p";
      return "l";
    }
    var celdas = [];
    for (var h = 0; h < 24; h++) {
      var b = document.createElement("div");
      b.className = "barra";
      b.setAttribute("data-h", h);
      var s = document.createElement("span");
      if (!quieto) s.style.setProperty("--h", "0%");
      b.appendChild(s);
      barras.appendChild(b);
      celdas.push(s);
    }
    function pintar() {
      celdas.forEach(function (s, i) {
        var p = periodo(i);
        s.style.setProperty("--h", (alto[p] + vaiven[i]) + "%");
        s.style.setProperty("--c", colores[p]);
        s.parentNode.setAttribute("data-p", p);
      });
      notaDia.textContent = finde ? notas.finde : notas.laborable;
    }
    function mostrar(e) {
      var b = e.target.closest(".barra");
      if (!b) { burbuja.classList.remove("ver"); return; }
      var i = +b.getAttribute("data-h");
      burbuja.textContent = (i < 10 ? "0" : "") + i + ":00–" + (i + 1 < 10 ? "0" : "") + (i + 1) + ":00 · " + nombres[b.getAttribute("data-p")];
      burbuja.style.left = (b.offsetLeft + b.offsetWidth / 2) + "px";
      burbuja.classList.add("ver");
    }
    barras.addEventListener("mousemove", mostrar);
    barras.addEventListener("mouseleave", function () { burbuja.classList.remove("ver"); });
    barras.addEventListener("touchstart", mostrar, { passive: true });
    document.querySelectorAll("[data-dia]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        finde = btn.getAttribute("data-dia") === "finde";
        document.querySelectorAll("[data-dia]").forEach(function (o) { o.setAttribute("aria-pressed", o === btn ? "true" : "false"); });
        pintar();
      });
    });
    if (quieto || !("IntersectionObserver" in window)) pintar();
    else new IntersectionObserver(function (e, o) {
      if (e[0].isIntersecting) { celdas.forEach(function (s, i) { s.style.transitionDelay = (i * 25) + "ms"; }); pintar(); setTimeout(function () { celdas.forEach(function (s) { s.style.transitionDelay = ""; }); }, 1400); o.disconnect(); }
    }, { threshold: 0.3 }).observe(barras);
  }

  /* Autoconsumo: consumo de día o de noche frente a la curva solar (esquema) */
  var g = document.getElementById("barras-solar");
  var sol = document.getElementById("sol");
  if (g && sol) {
    var W = 500, X0 = 40, Y0 = 250, H = 200, ancho = W / 24;
    var perfiles = {
      dia: [.18,.17,.17,.17,.18,.2,.32,.58,.82,.9,.92,.9,.8,.84,.9,.88,.8,.6,.38,.28,.24,.22,.2,.19],
      noche: [.78,.8,.82,.8,.76,.66,.48,.3,.22,.2,.19,.18,.2,.19,.2,.22,.26,.36,.52,.66,.74,.78,.8,.79]
    };
    var notasSolar = {
      dia: "Si tu empresa gasta sobre todo de día, suele tener sentido.",
      noche: "Si consume de noche, menos. Lo vemos con tus facturas antes de darte presupuesto."
    };
    function solEn(t) { return Math.max(0, Math.sin(Math.PI * (t - 6.5) / 13)) * .95; }
    var d = "M " + (X0 + 6.5 * ancho) + " " + Y0;
    for (var t = 6.5; t <= 19.5; t += .25) d += " L " + (X0 + t * ancho).toFixed(1) + " " + (Y0 - solEn(t) * H).toFixed(1);
    sol.setAttribute("d", d + " Z");
    var rects = [];
    for (var k = 0; k < 24; k++) {
      var r = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      r.setAttribute("x", (X0 + k * ancho + 3).toFixed(1));
      r.setAttribute("width", (ancho - 6).toFixed(1));
      r.setAttribute("rx", "3");
      r.setAttribute("y", Y0); r.setAttribute("height", 0);
      g.appendChild(r); rects.push(r);
    }
    function dibujar(p) {
      perfiles[p].forEach(function (v, i) {
        var coincide = solEn(i + .5) > .15;
        var y = (Y0 - v * H).toFixed(1), alt = (v * H).toFixed(1);
        rects[i].setAttribute("y", y); rects[i].setAttribute("height", alt);
        rects[i].style.y = y + "px"; rects[i].style.height = alt + "px";
        rects[i].setAttribute("fill", coincide ? "#FFF4DC" : "rgba(233,230,240,.38)");
      });
      document.getElementById("nota-solar").textContent = notasSolar[p];
    }
    document.querySelectorAll("[data-perfil]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll("[data-perfil]").forEach(function (o) { o.setAttribute("aria-pressed", o === btn ? "true" : "false"); });
        dibujar(btn.getAttribute("data-perfil"));
      });
    });
    if (quieto || !("IntersectionObserver" in window)) dibujar("dia");
    else new IntersectionObserver(function (e, o) { if (e[0].isIntersecting) { dibujar("dia"); o.disconnect(); } }, { threshold: 0.3 }).observe(g.ownerSVGElement);
  }
})();
