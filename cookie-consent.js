(() => {

  // ============================================================
  // CONFIGURACIÓN
  // ============================================================

  const STORAGE_KEY =
    "utebo_cookie_consent_v1";


  // ============================================================
  // LEER / GUARDAR PREFERENCIA
  // ============================================================

  function obtenerPreferencia() {

    try {

      return localStorage.getItem(
        STORAGE_KEY
      );

    } catch {

      return null;

    }

  }


  function guardarPreferencia(
    valor
  ) {

    try {

      localStorage.setItem(
        STORAGE_KEY,
        valor
      );

    } catch {}

  }


  // ============================================================
  // ESTILOS
  // ============================================================

  function cargarEstilos() {

    if (
      document.getElementById(
        "utebo-cookie-styles"
      )
    ) {

      return;

    }


    const style =
      document.createElement(
        "style"
      );


    style.id =
      "utebo-cookie-styles";


    style.textContent = `

      /* ========================================================
         BANNER
      ======================================================== */

      .utebo-cookie-banner,
      .utebo-cookie-settings {

        position: fixed;

        z-index: 99999;

        font-family:
          Arial,
          Helvetica,
          sans-serif;

      }


      .utebo-cookie-banner {

        left: 24px;
        right: 24px;
        bottom: 24px;

        max-width: 1180px;

        margin:
          0 auto;

        padding:
          24px;

        background:
          #111214;

        color:
          #ffffff;

        border:
          1px solid
          rgba(255,255,255,.12);

        border-top:
          3px solid
          #d71920;

        box-shadow:
          0 24px 70px
          rgba(0,0,0,.38);

      }


      .utebo-cookie-grid {

        display: grid;

        grid-template-columns:
          minmax(0, 1fr)
          auto;

        gap:
          28px;

        align-items:
          center;

      }


      .utebo-cookie-kicker {

        display:
          block;

        margin-bottom:
          7px;

        color:
          #d71920;

        font-size:
          10px;

        font-weight:
          900;

        letter-spacing:
          .16em;

        text-transform:
          uppercase;

      }


      .utebo-cookie-banner h2,
      .utebo-cookie-settings h2 {

        margin:
          0 0 8px;

        color:
          #ffffff;

        font-size:
          22px;

        line-height:
          1.2;

      }


      .utebo-cookie-banner p,
      .utebo-cookie-settings p {

        margin:
          0;

        color:
          #d4d5d7;

        font-size:
          13px;

        line-height:
          1.6;

      }


      .utebo-cookie-banner a,
      .utebo-cookie-settings a {

        color:
          #ffffff;

        text-decoration:
          underline;

        text-underline-offset:
          3px;

      }


      /* ========================================================
         BOTONES
      ======================================================== */

      .utebo-cookie-actions {

        display:
          flex;

        flex-wrap:
          wrap;

        gap:
          9px;

        justify-content:
          flex-end;

      }


      .utebo-cookie-btn {

        min-height:
          42px;

        padding:
          10px 15px;

        border:
          1px solid
          rgba(255,255,255,.24);

        background:
          transparent;

        color:
          #ffffff;

        font:
          inherit;

        font-size:
          12px;

        font-weight:
          800;

        cursor:
          pointer;

        transition:
          .2s ease;

      }


      .utebo-cookie-btn:hover {

        border-color:
          #ffffff;

      }


      .utebo-cookie-btn-primary {

        background:
          #d71920;

        border-color:
          #d71920;

      }


      .utebo-cookie-btn-primary:hover {

        background:
          #b81319;

        border-color:
          #b81319;

      }


      /* ========================================================
         FONDO MODAL
      ======================================================== */

      .utebo-cookie-overlay {

        position:
          fixed;

        inset:
          0;

        z-index:
          99998;

        background:
          rgba(5,6,7,.58);

        backdrop-filter:
          blur(4px);

      }


      /* ========================================================
         CONFIGURACIÓN
      ======================================================== */

      .utebo-cookie-settings {

        left:
          50%;

        top:
          50%;

        width:
          min(
            560px,
            calc(100vw - 32px)
          );

        transform:
          translate(
            -50%,
            -50%
          );

        background:
          #111214;

        color:
          #ffffff;

        border:
          1px solid
          rgba(255,255,255,.12);

        box-shadow:
          0 28px 90px
          rgba(0,0,0,.48);

      }


      .utebo-cookie-settings-header {

        padding:
          24px;

        border-bottom:
          1px solid
          rgba(255,255,255,.12);

      }


      .utebo-cookie-settings-body {

        padding:
          5px 24px 22px;

      }


      .utebo-cookie-row {

        display:
          grid;

        grid-template-columns:
          1fr auto;

        gap:
          18px;

        align-items:
          center;

        padding:
          18px 0;

        border-bottom:
          1px solid
          rgba(255,255,255,.12);

      }


      .utebo-cookie-row strong {

        display:
          block;

        margin-bottom:
          5px;

        font-size:
          13px;

      }


      .utebo-cookie-status {

        padding:
          7px 9px;

        background:
          rgba(255,255,255,.07);

        color:
          #d8d8da;

        font-size:
          10px;

        font-weight:
          900;

        text-transform:
          uppercase;

        letter-spacing:
          .08em;

        white-space:
          nowrap;

      }


      .utebo-cookie-settings-actions {

        display:
          flex;

        flex-wrap:
          wrap;

        gap:
          9px;

        justify-content:
          flex-end;

        padding-top:
          20px;

      }


      /* ========================================================
         ENLACE FOOTER
      ======================================================== */

      .utebo-cookie-settings-link {

        appearance:
          none;

        border:
          0;

        padding:
          0;

        background:
          transparent;

        color:
          inherit;

        font:
          inherit;

        cursor:
          pointer;

        text-decoration:
          underline;

        text-underline-offset:
          3px;

      }


      /* ========================================================
         MÓVIL
      ======================================================== */

      @media
      (max-width: 760px) {

        .utebo-cookie-banner {

          left:
            12px;

          right:
            12px;

          bottom:
            12px;

          padding:
            18px;

        }


        .utebo-cookie-grid {

          grid-template-columns:
            1fr;

          gap:
            18px;

        }


        .utebo-cookie-actions {

          justify-content:
            stretch;

        }


        .utebo-cookie-actions
        .utebo-cookie-btn {

          flex:
            1 1 130px;

        }


        .utebo-cookie-row {

          grid-template-columns:
            1fr;

        }

      }

    `;


    document.head.appendChild(
      style
    );

  }


  // ============================================================
  // CERRAR TODO
  // ============================================================

  function cerrarTodo() {

    document
      .querySelectorAll(
        `
          .utebo-cookie-banner,
          .utebo-cookie-settings,
          .utebo-cookie-overlay
        `
      )
      .forEach(
        elemento =>
          elemento.remove()
      );

  }


  // ============================================================
  // ACEPTAR / RECHAZAR
  // ============================================================

  function seleccionar(
    valor
  ) {

    guardarPreferencia(
      valor
    );


    cerrarTodo();


    window.dispatchEvent(
      new CustomEvent(
        "utebo-cookie-consent",
        {
          detail: {
            value:
              valor
          }
        }
      )
    );

  }


  // ============================================================
  // MODAL CONFIGURACIÓN
  // ============================================================

  function mostrarConfiguracion() {

    cerrarTodo();

    cargarEstilos();


    const overlay =
      document.createElement(
        "div"
      );


    overlay.className =
      "utebo-cookie-overlay";


    const panel =
      document.createElement(
        "section"
      );


    panel.className =
      "utebo-cookie-settings";


    panel.setAttribute(
      "role",
      "dialog"
    );


    panel.setAttribute(
      "aria-modal",
      "true"
    );


    panel.innerHTML = `

      <div
        class="utebo-cookie-settings-header"
      >

        <span
          class="utebo-cookie-kicker"
        >
          Privacidad
        </span>


        <h2>
          Configurar cookies
        </h2>


        <p>

          Puedes consultar las tecnologías
          utilizadas actualmente por la web.

          <a
            href="/cookies.html"
          >
            Política de cookies
          </a>.

        </p>

      </div>


      <div
        class="utebo-cookie-settings-body"
      >


        <div
          class="utebo-cookie-row"
        >

          <div>

            <strong>
              Cookies necesarias
            </strong>

            <p>

              Son necesarias para el
              funcionamiento técnico y
              la seguridad de la web.

              No pueden desactivarse.

            </p>

          </div>


          <span
            class="utebo-cookie-status"
          >
            Siempre activas
          </span>

        </div>


        <div
          class="utebo-cookie-row"
        >

          <div>

            <strong>
              Cookies analíticas
            </strong>

            <p>

              Actualmente Utebo Motor
              Selection no utiliza
              cookies analíticas.

            </p>

          </div>


          <span
            class="utebo-cookie-status"
          >
            No utilizadas
          </span>

        </div>


        <div
          class="utebo-cookie-row"
        >

          <div>

            <strong>
              Cookies publicitarias
            </strong>

            <p>

              Actualmente no utilizamos
              cookies de publicidad ni
              seguimiento comercial.

            </p>

          </div>


          <span
            class="utebo-cookie-status"
          >
            No utilizadas
          </span>

        </div>


        <div
          class="utebo-cookie-settings-actions"
        >

          <button
            class="utebo-cookie-btn"
            type="button"
            data-cookie-reject
          >
            Rechazar todas
          </button>


          <button
            class="
              utebo-cookie-btn
              utebo-cookie-btn-primary
            "
            type="button"
            data-cookie-save
          >
            Guardar preferencias
          </button>

        </div>

      </div>

    `;


    document.body.append(
      overlay,
      panel
    );


    overlay.addEventListener(
      "click",
      cerrarTodo
    );


    panel
      .querySelector(
        "[data-cookie-reject]"
      )
      .addEventListener(
        "click",
        () => {

          seleccionar(
            "necessary"
          );

        }
      );


    panel
      .querySelector(
        "[data-cookie-save]"
      )
      .addEventListener(
        "click",
        () => {

          seleccionar(
            "necessary"
          );

        }
      );

  }


  // ============================================================
  // BANNER PRINCIPAL
  // ============================================================

  function mostrarBanner(
    forzar = false
  ) {

    if (
      !forzar &&
      obtenerPreferencia()
    ) {

      return;

    }


    cerrarTodo();

    cargarEstilos();


    const banner =
      document.createElement(
        "section"
      );


    banner.className =
      "utebo-cookie-banner";


    banner.setAttribute(
      "role",
      "dialog"
    );


    banner.setAttribute(
      "aria-label",
      "Configuración de cookies"
    );


    banner.innerHTML = `

      <div
        class="utebo-cookie-grid"
      >

        <div>

          <span
            class="utebo-cookie-kicker"
          >
            Cookies
          </span>


          <h2>
            Tu privacidad
          </h2>


          <p>

            Utilizamos cookies técnicas
            necesarias para el correcto
            funcionamiento de la web.

            Actualmente no utilizamos
            cookies analíticas ni
            publicitarias.

            Puedes aceptar, rechazar
            o revisar la configuración.

            <a
              href="/cookies.html"
            >
              Política de cookies
            </a>.

          </p>

        </div>


        <div
          class="utebo-cookie-actions"
        >

          <button
            class="utebo-cookie-btn"
            type="button"
            data-cookie-reject
          >
            Rechazar todas
          </button>


          <button
            class="utebo-cookie-btn"
            type="button"
            data-cookie-configure
          >
            Configurar
          </button>


          <button
            class="
              utebo-cookie-btn
              utebo-cookie-btn-primary
            "
            type="button"
            data-cookie-accept
          >
            Aceptar todas
          </button>

        </div>

      </div>

    `;


    document.body.appendChild(
      banner
    );


    banner
      .querySelector(
        "[data-cookie-reject]"
      )
      .addEventListener(
        "click",
        () => {

          seleccionar(
            "necessary"
          );

        }
      );


    banner
      .querySelector(
        "[data-cookie-configure]"
      )
      .addEventListener(
        "click",
        mostrarConfiguracion
      );


    banner
      .querySelector(
        "[data-cookie-accept]"
      )
      .addEventListener(
        "click",
        () => {

          seleccionar(
            "all"
          );

        }
      );

  }


  // ============================================================
  // ENLACE "CONFIGURAR COOKIES" EN FOOTER
  // ============================================================

  function anadirEnlaceFooter() {

    const footer =

      document.querySelector(
        ".footer-legal"
      )

      ||

      document.querySelector(
        ".legal-footer-links"
      )

      ||

      document.querySelector(
        ".footer-bottom"
      );


    if (!footer) {

      return;

    }


    if (
      footer.querySelector(
        "[data-cookie-settings-link]"
      )
    ) {

      return;

    }


    const boton =
      document.createElement(
        "button"
      );


    boton.type =
      "button";


    boton.className =
      "utebo-cookie-settings-link";


    boton.setAttribute(
      "data-cookie-settings-link",
      ""
    );


    boton.textContent =
      "Configurar cookies";


    boton.addEventListener(
      "click",
      mostrarConfiguracion
    );


    footer.appendChild(
      boton
    );

  }


  // ============================================================
  // INICIAR
  // ============================================================

  function iniciar() {

    cargarEstilos();

    anadirEnlaceFooter();

    mostrarBanner();

  }


  // ============================================================
  // API GLOBAL
  // ============================================================

  window.UteboCookieConsent = {

    open:
      mostrarConfiguracion,


    reset() {

      try {

        localStorage.removeItem(
          STORAGE_KEY
        );

      } catch {}


      mostrarBanner(
        true
      );

    },


    getPreference:
      obtenerPreferencia

  };


  // ============================================================
  // DOM READY
  // ============================================================

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      iniciar,
      {
        once: true
      }
    );

  } else {

    iniciar();

  }

})();