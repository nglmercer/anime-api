
class ModalFormulario {
    /**
     * Crea una instancia de ModalFormulario.
     * @param {object} [options={}] Opciones de configuración.
     * @param {string} [options.idModal='modal-formulario-unico'] ID único para el elemento <dialog>.
     * @param {string} [options.titulo='Formulario'] Título a mostrar en el encabezado del modal.
     * @param {string} [options.htmlFormulario] HTML interno para el formulario (elementos <input>, <label>, etc.). Si no se provee, usa un formulario de ejemplo.
     * @param {string} [options.textoBotonEnviar='Enviar'] Texto para el botón de envío.
     * @param {string} [options.textoBotonCerrar='Cerrar'] Texto para el botón de cierre.
     * @param {function(object): void} [options.onSubmit] Callback a ejecutar al enviar el formulario. Recibe un objeto con los datos del formulario.
     */
    constructor(options = {}) {
      // Valores por defecto y asignación de opciones
      const defaults = {
        idModal: `modal-formulario-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, // ID más único
        titulo: 'Formulario',
        textoBotonEnviar: 'Enviar',
        textoBotonCerrar: 'Cerrar',
        onSubmit: (datos) => { console.warn('ModalFormulario: onSubmit no definido. Datos recibidos:', datos); },
      };
      // Fusiona defaults con options. Las options proporcionadas sobreescriben los defaults.
      this.config = { ...defaults, ...options };
      
      // Asignar htmlFormulario después de tener this.config disponible
      if (!this.config.htmlFormulario) {
        this.config.htmlFormulario = this.generarFormularioEjemplo(this.config.tipoFormulario || 'default');
      };
      // Fusiona defaults con options. Las options proporcionadas sobreescriben los defaults.
      this.config = { ...defaults, ...options };
  
      // Validación básica de opciones
      if (typeof this.config.idModal !== 'string' || !this.config.idModal) {
        throw new Error('ModalFormulario: El idModal debe ser una cadena válida.');
      }
      if (typeof this.config.onSubmit !== 'function') {
          throw new Error('ModalFormulario: onSubmit debe ser una función.');
      }
  
      // Propiedades internas
      this.modalElement = null;
      this.formElement = null;
      this.closeButtonElement = null;
      this._boundHandleSubmit = this.handleSubmit.bind(this);
      this._boundHandleDialogClose = this.handleDialogClose.bind(this);
    }
  
    /**
     * Genera el HTML para un formulario de ejemplo simple.
     * @returns {string} HTML del formulario.
     */
    generarFormularioEjemplo(tipo = 'default') {
      switch(tipo) {
        case 'catalogo':
          return `
            <div class="form-control w-full mb-4">
              <label class="label" for="${this.config.idModal}-nombre">
                <span class="label-text">Nombre del Catálogo:</span>
              </label>
              <input type="text" id="${this.config.idModal}-nombre" name="nombre" class="input input-bordered w-full" required />
            </div>
            <div class="form-control w-full">
              <label class="label" for="${this.config.idModal}-imagen">
                <span class="label-text">URL de Imagen de Fondo:</span>
              </label>
              <input type="url" id="${this.config.idModal}-imagen" name="imagen_fondo" class="input input-bordered w-full" />
            </div>
          `;
          
        case 'temporada':
          return `
            <div class="form-control w-full mb-4">
              <label class="label" for="${this.config.idModal}-nombre">
                <span class="label-text">Nombre de Temporada:</span>
              </label>
              <input type="text" id="${this.config.idModal}-nombre" name="nombre" class="input input-bordered w-full" required />
            </div>
            <div class="form-control w-full mb-4">
              <label class="label" for="${this.config.idModal}-portada">
                <span class="label-text">URL de Portada:</span>
              </label>
              <input type="url" id="${this.config.idModal}-portada" name="portada" class="input input-bordered w-full" />
            </div>
            <div class="form-control w-full">
              <label class="label" for="${this.config.idModal}-numero">
                <span class="label-text">Número de Temporada:</span>
              </label>
              <input type="number" id="${this.config.idModal}-numero" name="numero" min="1" class="input input-bordered w-full" required />
            </div>
          `;
          
        case 'capitulo':
          return `
            <div class="form-control w-full">
              <label class="label" for="${this.config.idModal}-numero">
                <span class="label-text">Número de Capítulo:</span>
              </label>
              <input type="number" id="${this.config.idModal}-numero" name="numero" min="1" class="input input-bordered w-full" required />
            </div>
          `;
          
        case 'lenguaje':
          return `
            <div class="form-control w-full mb-4">
              <label class="label" for="${this.config.idModal}-nombre">
                <span class="label-text">Nombre del Idioma:</span>
              </label>
              <input type="text" id="${this.config.idModal}-nombre" name="nombre" class="input input-bordered w-full" required />
            </div>
            <div class="form-control w-full mb-4">
              <label class="label" for="${this.config.idModal}-codigo">
                <span class="label-text">Código de Idioma (ej: es, en):</span>
              </label>
              <input type="text" id="${this.config.idModal}-codigo" name="codigo" maxlength="2" class="input input-bordered w-full" required />
            </div>
            <div class="form-control w-full">
              <label class="label" for="${this.config.idModal}-ruta">
                <span class="label-text">Ruta del Archivo:</span>
              </label>
              <input type="text" id="${this.config.idModal}-ruta" name="ruta" class="input input-bordered w-full" required />
            </div>
          `;
          
        default:
          return `
            <div class="form-control w-full mb-4">
              <label class="label" for="${this.config.idModal}-nombre">
                <span class="label-text">Nombre:</span>
              </label>
              <input type="text" id="${this.config.idModal}-nombre" name="nombre" placeholder="Tu nombre" class="input input-bordered w-full" required />
            </div>
            <div class="form-control w-full">
              <label class="label" for="${this.config.idModal}-email">
                <span class="label-text">Email:</span>
              </label>
              <input type="email" id="${this.config.idModal}-email" name="email" placeholder="tu@email.com" class="input input-bordered w-full" required />
            </div>
          `;
      }
    }
  
    /**
     * Crea el HTML completo del modal (dialog).
     * @returns {string} HTML del elemento <dialog>.
     */
    crearHTML() {
      // Usamos data-attributes para seleccionar fácilmente el formulario y el botón de cerrar
      return `
        <dialog id="${this.config.idModal}" class="modal modal-bottom sm:modal-middle">
          <div class="modal-box">
            <h3 class="font-bold text-lg mb-4">${this.config.titulo}</h3>
  
            {/* Formulario: data-modal-form para identificarlo */}
            <form data-modal-form novalidate>
              ${this.config.htmlFormulario} {/* Inyecta el HTML del formulario */}
  
              {/* Acciones del Modal */}
              <div class="modal-action mt-6">
                {/* Botón de cierre: data-modal-close para identificarlo */}
                <button type="button" class="btn btn-ghost" data-modal-close>${this.config.textoBotonCerrar}</button>
                <button type="submit" class="btn btn-primary">${this.config.textoBotonEnviar}</button>
              </div>
            </form>
  
            {/* Botón de cierre absoluto (opcional, para esquina superior derecha) */}
            {/*
            <form method="dialog">
               <button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            </form>
            */}
  
          </div>
          {/* Permite cerrar el modal haciendo click fuera (backdrop) */}
          <form method="dialog" class="modal-backdrop">
            <button>close</button>
          </form>
        </dialog>
      `;
    }
  
    /**
     * Inserta el modal en el DOM si no existe, lo inicializa y lo muestra.
     */
    abrir() {
      // Si ya existe, solo lo abre. Si no, lo crea.
      if (!document.getElementById(this.config.idModal)) {
        const modalHTML = this.crearHTML();
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modalElement = document.getElementById(this.config.idModal);
  
        if (!this.modalElement) {
          console.error(`ModalFormulario: No se pudo encontrar o crear el elemento modal con ID ${this.config.idModal}.`);
          return;
        }
        this.inicializarElementosInternos();
        this.asignarEventos();
      } else {
          this.modalElement = document.getElementById(this.config.idModal);
      }
  
      // Muestra el modal usando la API de <dialog>
      if (this.modalElement && typeof this.modalElement.showModal === 'function') {
          this.modalElement.showModal();
      } else {
           console.error(`ModalFormulario: El elemento modal (ID: ${this.config.idModal}) no es un <dialog> válido o no se encontró.`);
      }
    }
  
    /**
     * Selecciona los elementos internos importantes (formulario, botón de cierre).
     * @private
     */
    inicializarElementosInternos() {
      if (!this.modalElement) return;
      // Busca usando data-attributes dentro del modal
      this.formElement = this.modalElement.querySelector('[data-modal-form]');
      this.closeButtonElement = this.modalElement.querySelector('[data-modal-close]');
  
      if (!this.formElement) {
        console.warn(`ModalFormulario (ID: ${this.config.idModal}): No se encontró el elemento form con [data-modal-form].`);
      }
      if (!this.closeButtonElement) {
          console.warn(`ModalFormulario (ID: ${this.config.idModal}): No se encontró el botón con [data-modal-close].`);
      }
    }
  
    /**
     * Asigna los listeners de eventos necesarios.
     * @private
     */
    asignarEventos() {
      // Listener para submit del formulario
      if (this.formElement) {
        this.formElement.addEventListener('submit', this._boundHandleSubmit);
      }
      // Listener para el botón de cerrar explícito
      if (this.closeButtonElement) {
          this.closeButtonElement.addEventListener('click', () => this.cerrar());
      }
      // Listener para el evento 'close' del <dialog> (se dispara al cerrar por cualquier método)
      if (this.modalElement) {
        this.modalElement.addEventListener('close', this._boundHandleDialogClose);
      }
    }
  
    /**
     * Maneja el evento submit del formulario.
     * @param {Event} e El evento submit.
     * @private
     */
    handleSubmit(e) {
      e.preventDefault(); // Evita el envío real del formulario
      const datos = this.obtenerDatosFormulario();
      if (datos) {
        try {
          // Llama al callback proporcionado
          this.config.onSubmit(datos);
        } catch (error) {
          console.error(`ModalFormulario (ID: ${this.config.idModal}): Error ejecutando el callback onSubmit:`, error);
        }
      } else {
         console.warn(`ModalFormulario (ID: ${this.config.idModal}): No se pudieron obtener datos del formulario.`);
      }
      this.cerrar(); // Cierra el modal después de procesar
    }
  
    /**
     * Cierra el modal programáticamente.
     */
    cerrar() {
      if (this.modalElement && typeof this.modalElement.close === 'function') {
        this.modalElement.close();
      }
    }
  
    /**
     * Maneja el evento 'close' del elemento <dialog>.
     * Este evento se dispara cuando el dialog se cierra (por .close(), Esc, o backdrop click).
     * Aquí es donde realizamos la limpieza final.
     * @private
     */
    handleDialogClose() {
      console.log(`ModalFormulario (ID: ${this.config.idModal}): Dialog cerrado, limpiando...`);
      this.destruirModal();
    }
  
  
    /**
     * Obtiene los datos del formulario como un objeto.
     * @returns {object | null} Objeto con pares clave/valor de los campos del formulario, o null si no hay formulario.
     */
    obtenerDatosFormulario() {
      if (!this.formElement) {
        console.warn(`ModalFormulario (ID: ${this.config.idModal}): Formulario no encontrado para obtener datos.`);
        return null;
      }
      const formData = new FormData(this.formElement);
      const datos = {};
      formData.forEach((value, key) => {
        // Podrías agregar lógica para manejar checkboxes múltiples u otros casos aquí si fuera necesario
        datos[key] = value;
      });
      return datos;
    }
  
    /**
     * Elimina los event listeners y remueve el elemento modal del DOM.
     * Se llama automáticamente cuando el dialog se cierra.
     * @private
     */
    destruirModal() {
      // Eliminar listeners
      if (this.formElement) {
        this.formElement.removeEventListener('submit', this._boundHandleSubmit);
      }
      if (this.closeButtonElement) {
         // No es estrictamente necesario remover el listener de click si el botón se va con el modal,
         // pero es buena práctica hacerlo explícitamente si separamos la lógica.
         // this.closeButtonElement.removeEventListener('click', ...); // Podríamos guardar la referencia a la función anónima si fuera necesario
      }
      if (this.modalElement) {
        this.modalElement.removeEventListener('close', this._boundHandleDialogClose);
        // Eliminar el elemento del DOM
        this.modalElement.parentNode?.removeChild(this.modalElement);
         console.log(`ModalFormulario (ID: ${this.config.idModal}): Elemento modal eliminado del DOM.`);
      }
  
      // Limpiar referencias internas
      this.modalElement = null;
      this.formElement = null;
      this.closeButtonElement = null;
    }
  }
  

/*   document.addEventListener('DOMContentLoaded', () => {
  
    // Botón para abrir el modal de ejemplo
    const botonAbrir = document.getElementById('abrir-modal-btn');
  
    if (botonAbrir) {
      botonAbrir.addEventListener('click', () => {
        // Crear instancia del modal con configuración personalizada
        const miModal = new ModalFormulario({
          idModal: 'mi-modal-personalizado', // ID opcional pero recomendado
          titulo: 'Registrar Usuario',
          // Puedes pasar HTML complejo aquí si lo necesitas
          htmlFormulario: `
            <p class="text-sm mb-4">Por favor, completa tus datos.</p>
            <div class="form-control w-full mb-3">
              <label class="label" for="usuario-nombre"><span class="label-text">Nombre Completo:</span></label>
              <input type="text" id="usuario-nombre" name="nombre_completo" placeholder="Ej: Ana García" class="input input-bordered w-full" required />
            </div>
            <div class="form-control w-full mb-3">
              <label class="label" for="usuario-email"><span class="label-text">Correo Electrónico:</span></label>
              <input type="email" id="usuario-email" name="email_usuario" placeholder="ana.garcia@mail.com" class="input input-bordered w-full" required />
            </div>
             <div class="form-control w-full mb-3">
              <label class="label" for="usuario-pais"><span class="label-text">País:</span></label>
              <select id="usuario-pais" name="pais" class="select select-bordered w-full" required>
                <option disabled selected value="">Selecciona un país</option>
                <option value="mx">México</option>
                <option value="es">España</option>
                <option value="ar">Argentina</option>
              </select>
            </div>
            <div class="form-control w-full">
              <label class="label cursor-pointer">
                <span class="label-text">Acepto los términos</span>
                <input type="checkbox" name="acepta_terminos" value="si" class="checkbox checkbox-primary" required />
              </label>
            </div>
          `,
          textoBotonEnviar: 'Registrarme',
          textoBotonCerrar: 'Cancelar',
          onSubmit: (datosRecibidos) => {
            console.log('Datos del formulario recibidos:', datosRecibidos);
            // Aquí harías algo con los datos, como enviarlos a un servidor
            alert(`¡Gracias ${datosRecibidos.nombre_completo}! Datos recibidos.`);
          }
        });
  
        // Abrir el modal
        miModal.abrir();
      });
    } else {
      console.warn("No se encontró el botón con ID 'abrir-modal-btn' para el ejemplo.");
    }
    
    // Ejemplo para el catálogo de anime
    const botonCatalogo = document.getElementById('abrir-modal-catalogo-btn');
    if (botonCatalogo) {
      botonCatalogo.addEventListener('click', () => {
        const modalCatalogo = new ModalFormulario({
          titulo: 'Nuevo Catálogo de Anime',
          tipoFormulario: 'catalogo',
          textoBotonEnviar: 'Guardar',
          textoBotonCerrar: 'Cancelar',
          onSubmit: (datos) => {
            console.log('Datos del catálogo:', datos);
            // Aquí se enviarían los datos al servidor
            fetch('/api/catalogos', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(datos)
            })
            .then(response => response.json())
            .then(data => {
              alert(`Catálogo "${data.nombre}" creado exitosamente!`);
            })
            .catch(error => {
              console.error('Error:', error);
              alert('Error al guardar el catálogo');
            });
          }
        });
        modalCatalogo.abrir();
      });
    } else {
      console.warn("No se encontró el botón con ID 'abrir-modal-catalogo-btn' para el ejemplo.");
    }
  
    // Ejemplo 2: Modal con configuración por defecto
    const botonAbrirDefault = document.getElementById('abrir-modal-default-btn');
     if (botonAbrirDefault) {
          botonAbrirDefault.addEventListener('click', () => {
              const modalDefault = new ModalFormulario({
                  onSubmit: datos => {
                       console.log("Datos del modal por defecto:", datos);
                       alert(`Recibido: ${datos.nombre} - ${datos.email}`);
                  }
              });
              modalDefault.abrir();
          });
     } else {
         console.warn("No se encontró el botón con ID 'abrir-modal-default-btn' para el ejemplo.");
     }
  
  }); */