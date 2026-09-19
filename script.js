const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
}

const current = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(link => {
  const href = link.getAttribute('href');
  if (href === current) link.classList.add('active');
});

// ============================================================
// FILTROS DEL CATÁLOGO
// ============================================================

const search = document.querySelector("#vehicleSearch");
const statusButtons = document.querySelectorAll(".catalog-status-filter");
const fuelFilter = document.querySelector("#filterFuel");
const transmissionFilter = document.querySelector("#filterTransmission");
const priceMinFilter = document.querySelector("#filterPriceMin");
const priceMaxFilter = document.querySelector("#filterPriceMax");
const kmMaxFilter = document.querySelector("#filterKmMax");
const kmEnabledFilter = document.querySelector("#filterKmEnabled");
const kmValue = document.querySelector("#filterKmValue");
const clearFiltersButton = document.querySelector("#clearCatalogFilters");
const clearFiltersEmptyButton = document.querySelector("#clearCatalogFiltersEmpty");
const resultsLabel = document.querySelector("#catalogResults");
const noResults = document.querySelector("#catalogNoResults");

let estadoCatalogoActual = "Todos";

function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function leerNumero(elemento) {
  if (!elemento || elemento.value === "") return null;
  const numero = Number(elemento.value);
  return Number.isFinite(numero) ? numero : null;
}

function formatearFiltroKm(valor) {
  return `${new Intl.NumberFormat("es-ES").format(Number(valor))} km`;
}

function actualizarLimiteKilometraje(vehiculos) {
  if (!kmMaxFilter) return;
  const kilometrajes = vehiculos
    .map(vehiculo => Number(vehiculo.kilometros))
    .filter(Number.isFinite);
  const maxReal = kilometrajes.length ? Math.max(...kilometrajes) : 0;
  const maxSlider = Math.max(300000, Math.ceil(maxReal / 50000) * 50000);
  kmMaxFilter.max = String(maxSlider);
  kmMaxFilter.value = String(maxSlider);
  if (kmEnabledFilter) {
    kmEnabledFilter.checked = false;
    kmEnabledFilter.disabled = kilometrajes.length === 0;
  }
  if (kmValue) kmValue.textContent = "Sin límite";
}

function aplicarFiltrosCatalogo() {
  const textoBusqueda = normalizarTexto(search?.value);
  const combustible = normalizarTexto(fuelFilter?.value);
  const cambio = normalizarTexto(transmissionFilter?.value);
  const precioMinimo = leerNumero(priceMinFilter);
  const precioMaximo = leerNumero(priceMaxFilter);
  const kilometrajeMaximo = kmEnabledFilter?.checked ? leerNumero(kmMaxFilter) : null;
  let visibles = 0;

  document.querySelectorAll(".vehicle-card").forEach(card => {
    const precio = card.dataset.precio === "" ? null : Number(card.dataset.precio);
    const kilometros = card.dataset.kilometros === "" ? null : Number(card.dataset.kilometros);
    const textoTarjeta = normalizarTexto(card.dataset.busqueda || card.innerText);
    const estado = normalizarTexto(card.dataset.estado || "Disponible");
    const tarjetaCombustible = normalizarTexto(card.dataset.combustible);
    const tarjetaCambio = normalizarTexto(card.dataset.cambio);

    const coincide =
      (!textoBusqueda || textoTarjeta.includes(textoBusqueda)) &&
      (estadoCatalogoActual === "Todos" || estado === normalizarTexto(estadoCatalogoActual)) &&
      (!combustible || tarjetaCombustible === combustible) &&
      (!cambio || tarjetaCambio === cambio) &&
      (precioMinimo === null || (Number.isFinite(precio) && precio >= precioMinimo)) &&
      (precioMaximo === null || (Number.isFinite(precio) && precio <= precioMaximo)) &&
      (kilometrajeMaximo === null || !Number.isFinite(kilometros) || kilometros <= kilometrajeMaximo);

    card.hidden = !coincide;
    if (coincide) visibles++;
  });

  if (resultsLabel) {
    resultsLabel.textContent = visibles === 1
      ? "1 vehículo encontrado"
      : `${visibles} vehículos encontrados`;
  }
  if (noResults) noResults.hidden = visibles !== 0;
  if (kmValue) kmValue.textContent = kilometrajeMaximo === null ? "Sin límite" : formatearFiltroKm(kilometrajeMaximo);
}

function limpiarFiltrosCatalogo() {
  if (search) search.value = "";
  if (fuelFilter) fuelFilter.value = "";
  if (transmissionFilter) transmissionFilter.value = "";
  if (priceMinFilter) priceMinFilter.value = "";
  if (priceMaxFilter) priceMaxFilter.value = "";
  if (kmEnabledFilter) {
    kmEnabledFilter.checked = false;
    kmEnabledFilter.disabled = false;
  }
  if (kmMaxFilter) kmMaxFilter.disabled = true;
  if (kmMaxFilter) kmMaxFilter.value = kmMaxFilter.max;
  if (kmValue) kmValue.textContent = "Sin límite";
  estadoCatalogoActual = "Todos";
  statusButtons.forEach(button => button.classList.toggle("active", button.dataset.status === "Todos"));
  aplicarFiltrosCatalogo();
}

if (search) search.addEventListener("input", aplicarFiltrosCatalogo);
[fuelFilter, transmissionFilter, priceMinFilter, priceMaxFilter, kmMaxFilter]
  .filter(Boolean)
  .forEach(elemento => elemento.addEventListener("input", aplicarFiltrosCatalogo));

if (kmEnabledFilter) {
  kmEnabledFilter.addEventListener("change", () => {
    if (kmMaxFilter) kmMaxFilter.disabled = !kmEnabledFilter.checked;
    aplicarFiltrosCatalogo();
  });
}

statusButtons.forEach(button => {
  button.addEventListener("click", () => {
    estadoCatalogoActual = button.dataset.status || "Todos";
    statusButtons.forEach(item => item.classList.toggle("active", item === button));
    aplicarFiltrosCatalogo();
  });
});

[clearFiltersButton, clearFiltersEmptyButton]
  .filter(Boolean)
  .forEach(button => button.addEventListener("click", event => {
    event.preventDefault();
    limpiarFiltrosCatalogo();
  }));

// ============================================================
// CATÁLOGO DINÁMICO - UTEBO MOTOR SELECTION
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  const vehicleGrid = document.getElementById("vehicleGrid");

  // Solo ejecutar en catalogo.html
  if (!vehicleGrid) return;

  cargarVehiculos(vehicleGrid);
});


async function cargarVehiculos(container) {
  try {
    const response = await fetch("/api/vehiculos", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("No se pudo cargar el catálogo");
    }

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || "Error cargando vehículos");
    }

    container.innerHTML = "";

    if (!data.vehiculos || data.vehiculos.length === 0) {
      mostrarCatalogoVacio(container);
      return;
    }

    actualizarLimiteKilometraje(data.vehiculos);

    data.vehiculos.forEach((vehiculo) => {
      const card = crearTarjetaVehiculo(vehiculo);
      container.appendChild(card);
    });

    aplicarFiltrosCatalogo();

  } catch (error) {
    console.error("Error cargando vehículos:", error);

    container.innerHTML = `
      <div class="catalog-error">
        <strong>No hemos podido cargar el stock.</strong>
        <span>Contacta con nosotros por WhatsApp para consultar los vehículos disponibles.</span>
      </div>
    `;
  }
}


function crearTarjetaVehiculo(v) {

  const article =
    document.createElement(
      "article"
    );

  article.className =
    "vehicle-card";

article.dataset.estado =
  v.estado ||
  "Disponible";


  if (v.destacado) {
    article.classList.add(
      "vehicle-featured"
    );
  }


  // ==========================================================
  // NOMBRE DEL VEHÍCULO
  // ==========================================================

  const nombreVehiculo =
    v.vehiculo ||
    `${v.marca || ""} ${v.modelo || ""} ${v.version || ""}`.trim();

  article.dataset.precio =
    v.precio === null || v.precio === undefined ? "" : String(v.precio);
  article.dataset.kilometros =
    v.kilometros === null || v.kilometros === undefined ? "" : String(v.kilometros);
  article.dataset.combustible = v.combustible || "";
  article.dataset.cambio = v.cambio || "";
  article.dataset.busqueda = [
    nombreVehiculo, v.marca, v.modelo, v.version, v.combustible,
    v.cambio, v.procedencia, v.ano, v.kilometros, v.precio
  ].filter(Boolean).join(" ");


  // ==========================================================
  // SLUG + URL FICHA
  // ==========================================================

  const slug =
    String(
      nombreVehiculo ||
      "vehiculo"
    )

      .normalize(
        "NFD"
      )

      .replace(
        /[\u0300-\u036f]/g,
        ""
      )

      .toLowerCase()

      .replace(
        /[^a-z0-9]+/g,
        "-"
      )

      .replace(
        /^-+|-+$/g,
        ""
      );


  const fichaUrl =
    `/vehiculo/${v.id}-${slug}`;


  // ==========================================================
  // IMAGEN / GALERÍA
  // ==========================================================

  const media =
    document.createElement(
      "div"
    );

  media.className =
    "vehicle-media";


  if (
    v.fotos &&
    v.fotos.length > 0
  ) {

    const img =
      document.createElement(
        "img"
      );


    img.src =
      v.fotos[0].url;


    img.alt =
      nombreVehiculo;


    img.loading =
      "lazy";


    media.appendChild(
      img
    );


    // Abrir galería al pulsar la foto

    media.classList.add(
      "vehicle-media-clickable"
    );


    media.addEventListener(
      "click",
      () => {

        abrirGaleriaVehiculo(
          v.fotos,
          nombreVehiculo
        );

      }
    );


    // Número de fotografías

    if (
      v.fotos.length > 1
    ) {

      const photoCount =
        document.createElement(
          "span"
        );


      photoCount.className =
        "vehicle-photo-count";


      photoCount.innerHTML = `

        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >

          <path
            d="M4 6.5h3l1.5-2h7l1.5 2h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Zm8 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0-2a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z"
          />

        </svg>

        ${v.fotos.length} fotos

      `;


      media.appendChild(
        photoCount
      );

    }

  } else {

    const noImage =
      document.createElement(
        "div"
      );


    noImage.className =
      "vehicle-no-image";


    noImage.textContent =
      "UTEBO MOTOR SELECTION";


    media.appendChild(
      noImage
    );

  }


// ==========================================================
// ESTADO
// ==========================================================

const estado =
  document.createElement(
    "span"
  );


let claseEstado =
  "vehicle-status-available";


if (
  v.estado ===
  "Reservado"
) {

  claseEstado =
    "vehicle-status-reserved";

}


if (
  v.estado ===
  "En Preparación"
) {

  claseEstado =
    "vehicle-status-preparing";

}


estado.className =
  "vehicle-status " +
  claseEstado;


estado.textContent =
  v.estado;


media.appendChild(
  estado
);


  // ==========================================================
  // DESTACADO
  // ==========================================================

  if (v.destacado) {

    const destacado =
      document.createElement(
        "span"
      );


    destacado.className =
      "vehicle-highlight";


    destacado.textContent =
      "DESTACADO";


    media.appendChild(
      destacado
    );

  }


  article.appendChild(
    media
  );


  // ==========================================================
  // CONTENIDO
  // ==========================================================

  const content =
    document.createElement(
      "div"
    );


  content.className =
    "vehicle-content";


  // ==========================================================
  // TÍTULO
  // ==========================================================

  const title =
    document.createElement(
      "h2"
    );


  title.className =
    "vehicle-title";


  title.textContent =
    nombreVehiculo;


  content.appendChild(
    title
  );


  // ==========================================================
  // PRECIO
  // ==========================================================

  const price =
    document.createElement(
      "div"
    );


  price.className =
    "vehicle-price";


  if (
    v.precio !== null &&
    v.precio !== undefined
  ) {

    price.textContent =
      formatearPrecio(
        v.precio
      );

  } else {

    price.textContent =
      "Consultar precio";

  }


  content.appendChild(
    price
  );


  // ==========================================================
  // DATOS PRINCIPALES
  // ==========================================================

  const specs =
    document.createElement(
      "div"
    );


  specs.className =
    "vehicle-specs";


  const datos = [

    v.ano
      ? `${v.ano}`
      : null,


    v.kilometros !== null &&
    v.kilometros !== undefined

      ? `${formatearNumero(
          v.kilometros
        )} km`

      : null,


    v.combustible ||
    null,


    v.cambio ||
    null,


    v.potencia

      ? `${v.potencia} CV`

      : null

  ].filter(
    Boolean
  );


  datos.forEach(
    dato => {

      const item =
        document.createElement(
          "span"
        );


      item.textContent =
        dato;


      specs.appendChild(
        item
      );

    }
  );


  content.appendChild(
    specs
  );


  // ==========================================================
  // PROCEDENCIA
  // ==========================================================

  if (v.procedencia) {

    const origin =
      document.createElement(
        "div"
      );


    origin.className =
      "vehicle-origin";


    origin.textContent =

      v.procedencia ===
      "Alemania"

        ? "Importación Alemania"

        : v.procedencia;


    content.appendChild(
      origin
    );

  }

  // ==========================================================
// FECHA DISPONIBLE
// ==========================================================

if (
  v.estado ===
    "En Preparación" &&
  v.fecha_disponible
) {

  const availability =
    document.createElement(
      "div"
    );


  availability.className =
    "vehicle-preparation-date";


  availability.innerHTML = `

    <span>
      Disponible a partir del
    </span>

    <strong>
      ${formatearFechaDisponible(
        v.fecha_disponible
      )}
    </strong>

  `;


  content.appendChild(
    availability
  );

}

  // ==========================================================
  // ACCIONES
  // ==========================================================

  const actions =
    document.createElement(
      "div"
    );


  actions.className =
    "vehicle-card-actions";


  // ==========================================================
  // VER VEHÍCULO
  // ==========================================================

  const verVehiculo =
    document.createElement(
      "a"
    );


  verVehiculo.className =
    "vehicle-detail-link";


  verVehiculo.href =
    fichaUrl;


  verVehiculo.innerHTML = `

    <span>
      Ver vehículo
    </span>

    <span
      class="vehicle-detail-arrow"
    >
      →
    </span>

  `;


  actions.appendChild(
    verVehiculo
  );


  // ==========================================================
  // WHATSAPP
  // ==========================================================

  const whatsapp =
    document.createElement(
      "a"
    );


  whatsapp.className =
    "vehicle-whatsapp";


  whatsapp.target =
    "_blank";


  whatsapp.rel =
    "noopener noreferrer";


  const mensaje =
    `Hola, estoy interesado/a en el vehículo ` +
    `${nombreVehiculo} que tenéis anunciado en vuestra web.`;


  whatsapp.href =
    "https://wa.me/34614601189?text=" +
    encodeURIComponent(
      mensaje
    );


  whatsapp.innerHTML = `

    <span>
      Consultar por WhatsApp
    </span>

    <span
      class="vehicle-whatsapp-arrow"
    >
      →
    </span>

  `;


  actions.appendChild(
    whatsapp
  );


  // ==========================================================
  // AÑADIR ACCIONES
  // ==========================================================

  content.appendChild(
    actions
  );


  article.appendChild(
    content
  );


  return article;

}
function mostrarCatalogoVacio(container) {
  container.innerHTML = `
    <div class="catalog-empty">
      <span class="catalog-empty-small">STOCK</span>

      <h2>Estamos preparando nuevos vehículos</h2>

      <p>
        Si buscas un vehículo concreto, podemos encontrarlo
        tanto a nivel nacional como mediante importación desde Alemania.
      </p>

      <a
        href="https://wa.me/34614601189?text=Hola%2C%20estoy%20buscando%20un%20veh%C3%ADculo%20y%20me%20gustar%C3%ADa%20recibir%20informaci%C3%B3n."
        target="_blank"
        rel="noopener noreferrer"
        class="vehicle-whatsapp"
      >
        Solicitar búsqueda
        <span class="vehicle-whatsapp-arrow">→</span>
      </a>
    </div>
  `;
}


function formatearPrecio(numero) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(numero);
}


function formatearNumero(numero) {
  return new Intl.NumberFormat("es-ES").format(numero);
}

// ============================================================
// CREAR SLUG PARA FICHA DE VEHÍCULO
// ============================================================

function crearSlugCatalogo(
  texto
) {

  return String(
    texto || "vehiculo"
  )

    .normalize(
      "NFD"
    )

    .replace(
      /[\u0300-\u036f]/g,
      ""
    )

    .toLowerCase()

    .replace(
      /[^a-z0-9]+/g,
      "-"
    )

    .replace(
      /^-+|-+$/g,
      ""
    )

    ||
    "vehiculo";

}

// ============================================================
// GALERÍA DE FOTOGRAFÍAS DE VEHÍCULOS
// ============================================================

function abrirGaleriaVehiculo(fotos, tituloVehiculo) {

  if (!fotos || fotos.length === 0) return;

  let indiceActual = 0;

  // ----------------------------------------------------------
  // MODAL
  // ----------------------------------------------------------

  const modal = document.createElement("div");

  modal.className = "vehicle-gallery-modal";

  modal.innerHTML = `
    <div class="vehicle-gallery-backdrop"></div>

    <div class="vehicle-gallery-window">

      <div class="vehicle-gallery-header">

        <div class="vehicle-gallery-title"></div>

        <button
          class="vehicle-gallery-close"
          type="button"
          aria-label="Cerrar galería"
        >
          ×
        </button>

      </div>


      <div class="vehicle-gallery-main">

        <button
          class="vehicle-gallery-arrow vehicle-gallery-prev"
          type="button"
          aria-label="Foto anterior"
        >
          ‹
        </button>


        <div class="vehicle-gallery-image-wrap">

          <img
            class="vehicle-gallery-image"
            src=""
            alt=""
          >

        </div>


        <button
          class="vehicle-gallery-arrow vehicle-gallery-next"
          type="button"
          aria-label="Foto siguiente"
        >
          ›
        </button>

      </div>


      <div class="vehicle-gallery-footer">

        <div class="vehicle-gallery-counter"></div>

        <div class="vehicle-gallery-thumbnails"></div>

      </div>

    </div>
  `;


  document.body.appendChild(modal);

  document.body.classList.add("gallery-open");


  // ----------------------------------------------------------
  // ELEMENTOS
  // ----------------------------------------------------------

  const imagen =
    modal.querySelector(".vehicle-gallery-image");

  const contador =
    modal.querySelector(".vehicle-gallery-counter");

  const titulo =
    modal.querySelector(".vehicle-gallery-title");

  const thumbnails =
    modal.querySelector(".vehicle-gallery-thumbnails");

  const anterior =
    modal.querySelector(".vehicle-gallery-prev");

  const siguiente =
    modal.querySelector(".vehicle-gallery-next");

  const cerrar =
    modal.querySelector(".vehicle-gallery-close");

  const backdrop =
    modal.querySelector(".vehicle-gallery-backdrop");


  titulo.textContent = tituloVehiculo;


  // ----------------------------------------------------------
  // MINIATURAS
  // ----------------------------------------------------------

  fotos.forEach((foto, index) => {

    const thumb = document.createElement("button");

    thumb.type = "button";
    thumb.className = "vehicle-gallery-thumb";

    const thumbImg = document.createElement("img");

    thumbImg.src = foto.url;
    thumbImg.alt =
      `${tituloVehiculo} - fotografía ${index + 1}`;

    thumb.appendChild(thumbImg);

    thumb.addEventListener("click", () => {

      indiceActual = index;

      mostrarFoto();

    });

    thumbnails.appendChild(thumb);

  });


  // ----------------------------------------------------------
  // MOSTRAR FOTO
  // ----------------------------------------------------------

  function mostrarFoto() {

    const foto = fotos[indiceActual];

    imagen.src = foto.url;

    imagen.alt =
      `${tituloVehiculo} - fotografía ${indiceActual + 1}`;

    contador.textContent =
      `${indiceActual + 1} / ${fotos.length}`;


    // Miniatura activa

    const thumbs =
      modal.querySelectorAll(".vehicle-gallery-thumb");

    thumbs.forEach((thumb, index) => {

      thumb.classList.toggle(
        "active",
        index === indiceActual
      );

    });


    // Llevar miniatura activa a la zona visible

    if (thumbs[indiceActual]) {

      thumbs[indiceActual].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center"
      });

    }

  }


  // ----------------------------------------------------------
  // ANTERIOR
  // ----------------------------------------------------------

  function fotoAnterior() {

    indiceActual--;

    if (indiceActual < 0) {
      indiceActual = fotos.length - 1;
    }

    mostrarFoto();

  }


  // ----------------------------------------------------------
  // SIGUIENTE
  // ----------------------------------------------------------

  function fotoSiguiente() {

    indiceActual++;

    if (indiceActual >= fotos.length) {
      indiceActual = 0;
    }

    mostrarFoto();

  }


  anterior.addEventListener(
    "click",
    fotoAnterior
  );


  siguiente.addEventListener(
    "click",
    fotoSiguiente
  );


  // Si solo hay una fotografía, no necesitamos flechas

  if (fotos.length <= 1) {

    anterior.style.display = "none";
    siguiente.style.display = "none";
    thumbnails.style.display = "none";

  }


  // ----------------------------------------------------------
  // CERRAR
  // ----------------------------------------------------------

  function cerrarGaleria() {

    document.body.classList.remove("gallery-open");

    document.removeEventListener(
      "keydown",
      controlTeclado
    );

    modal.remove();

  }


  cerrar.addEventListener(
    "click",
    cerrarGaleria
  );


  backdrop.addEventListener(
    "click",
    cerrarGaleria
  );


  // ----------------------------------------------------------
  // TECLADO
  // ----------------------------------------------------------

  function controlTeclado(event) {

    if (event.key === "Escape") {

      cerrarGaleria();

    }

    if (event.key === "ArrowLeft") {

      fotoAnterior();

    }

    if (event.key === "ArrowRight") {

      fotoSiguiente();

    }

  }


  document.addEventListener(
    "keydown",
    controlTeclado
  );


  // ----------------------------------------------------------
  // SWIPE EN MÓVIL
  // ----------------------------------------------------------

  let touchInicio = 0;

  imagen.addEventListener(
    "touchstart",
    (event) => {

      touchInicio =
        event.changedTouches[0].screenX;

    },
    { passive: true }
  );


  imagen.addEventListener(
    "touchend",
    (event) => {

      const touchFin =
        event.changedTouches[0].screenX;

      const diferencia =
        touchInicio - touchFin;


      if (Math.abs(diferencia) < 50) {
        return;
      }


      if (diferencia > 0) {

        fotoSiguiente();

      } else {

        fotoAnterior();

      }

    },
    { passive: true }
  );


  // ----------------------------------------------------------
  // PRIMERA FOTO
  // ----------------------------------------------------------

  mostrarFoto();

}

function formatearFechaDisponible(
  fecha
) {

  if (!fecha) {
    return "";
  }


  const partes =
    fecha.split(
      "-"
    );


  if (
    partes.length !== 3
  ) {

    return fecha;

  }


  return (
    `${partes[2]}/` +
    `${partes[1]}/` +
    `${partes[0]}`
  );

}
