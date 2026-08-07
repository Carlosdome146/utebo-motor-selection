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

const search = document.querySelector('#vehicleSearch');
if (search) {
  search.addEventListener('input', e => {
    const q = e.target.value.trim().toLowerCase();
    document.querySelectorAll('.vehicle-card').forEach(card => {
      const text = card.innerText.toLowerCase();
      card.style.display = text.includes(q) ? '' : 'none';
    });
  });
}

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

    data.vehiculos.forEach((vehiculo) => {
      const card = crearTarjetaVehiculo(vehiculo);
      container.appendChild(card);
    });

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

  const article = document.createElement("article");
  article.className = "vehicle-card";

  if (v.destacado) {
    article.classList.add("vehicle-featured");
  }

  // ----------------------------------------------------------
  // IMAGEN
  // ----------------------------------------------------------

  const media = document.createElement("div");
  media.className = "vehicle-media";

  if (v.fotos && v.fotos.length > 0) {
    const img = document.createElement("img");

    img.src = v.fotos[0].url;
    img.alt = v.vehiculo || `${v.marca} ${v.modelo}`;
    img.loading = "lazy";

    media.appendChild(img);
  } else {
    const noImage = document.createElement("div");
    noImage.className = "vehicle-no-image";
    noImage.textContent = "UTEBO MOTOR SELECTION";

    media.appendChild(noImage);
  }

  // ----------------------------------------------------------
  // ESTADO
  // ----------------------------------------------------------

  const estado = document.createElement("span");

  estado.className =
    "vehicle-status " +
    (v.estado === "Reservado"
      ? "vehicle-status-reserved"
      : "vehicle-status-available");

  estado.textContent = v.estado;

  media.appendChild(estado);

  // ----------------------------------------------------------
  // DESTACADO
  // ----------------------------------------------------------

  if (v.destacado) {
    const destacado = document.createElement("span");
    destacado.className = "vehicle-highlight";
    destacado.textContent = "DESTACADO";

    media.appendChild(destacado);
  }

  article.appendChild(media);

  // ----------------------------------------------------------
  // CONTENIDO
  // ----------------------------------------------------------

  const content = document.createElement("div");
  content.className = "vehicle-content";

  const title = document.createElement("h2");
  title.className = "vehicle-title";
  title.textContent =
    v.vehiculo ||
    `${v.marca || ""} ${v.modelo || ""} ${v.version || ""}`.trim();

  content.appendChild(title);

  // ----------------------------------------------------------
  // PRECIO
  // ----------------------------------------------------------

  const price = document.createElement("div");
  price.className = "vehicle-price";

  if (v.precio !== null) {
    price.textContent = formatearPrecio(v.precio);
  } else {
    price.textContent = "Consultar precio";
  }

  content.appendChild(price);

  // ----------------------------------------------------------
  // DATOS PRINCIPALES
  // ----------------------------------------------------------

  const specs = document.createElement("div");
  specs.className = "vehicle-specs";

  const datos = [
    v.ano ? `${v.ano}` : null,

    v.kilometros !== null
      ? `${formatearNumero(v.kilometros)} km`
      : null,

    v.combustible || null,

    v.cambio || null,

    v.potencia
      ? `${v.potencia} CV`
      : null
  ].filter(Boolean);

  datos.forEach((dato) => {
    const item = document.createElement("span");
    item.textContent = dato;

    specs.appendChild(item);
  });

  content.appendChild(specs);

  // ----------------------------------------------------------
  // PROCEDENCIA
  // ----------------------------------------------------------

  if (v.procedencia) {
    const origin = document.createElement("div");
    origin.className = "vehicle-origin";

    origin.textContent =
      v.procedencia === "Alemania"
        ? "Importación Alemania"
        : v.procedencia;

    content.appendChild(origin);
  }

  // ----------------------------------------------------------
  // DESCRIPCIÓN
  // ----------------------------------------------------------

  if (v.descripcion) {
    const description = document.createElement("p");
    description.className = "vehicle-description";
    description.textContent = v.descripcion;

    content.appendChild(description);
  }

  // ----------------------------------------------------------
  // WHATSAPP
  // ----------------------------------------------------------

  const whatsapp = document.createElement("a");

  whatsapp.className = "vehicle-whatsapp";
  whatsapp.target = "_blank";
  whatsapp.rel = "noopener noreferrer";

  const mensaje =
    `Hola, estoy interesado/a en el vehículo ` +
    `${title.textContent} que tenéis anunciado en vuestra web.`;

  whatsapp.href =
    "https://wa.me/34614601189?text=" +
    encodeURIComponent(mensaje);

  whatsapp.innerHTML = `
    <span>Consultar por WhatsApp</span>
    <span class="vehicle-whatsapp-arrow">→</span>
  `;

  content.appendChild(whatsapp);

  article.appendChild(content);

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
