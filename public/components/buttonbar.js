// icon-button-bar.js

class IconButtonBar extends HTMLElement {
    #buttons = [];
    #data = null;

    // 1. Definir los atributos que queremos observar
    static get observedAttributes() {
        return ['dark-mode'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        // No llamamos a #render aquí todavía, esperamos a connectedCallback
        // o a que se seteen los botones por primera vez.
        // Inicialmente renderizamos la estructura básica con estilos.
        this.#setupInitialStructure();
        this.#attachListeners();
    }

    // --- Getters y Setters ---

    set buttons(newButtons) {
        if (Array.isArray(newButtons)) {
            this.#buttons = newButtons;
            this.#renderButtons(); // Solo renderizar los botones, no toda la estructura
        } else {
            console.error('IconButtonBar: La propiedad "buttons" debe ser un array.');
            this.#buttons = [];
            this.#renderButtons();
        }
    }

    get buttons() {
        return this.#buttons;
    }

    set data(newData) {
        this.#data = newData;
    }

    get data() {
        return this.#data;
    }

    // 2. Propiedad para controlar el modo oscuro programáticamente
    get darkMode() {
        return this.hasAttribute('dark-mode');
    }

    set darkMode(isDark) {
        if (isDark) {
            this.setAttribute('dark-mode', ''); // Añadir atributo si es true
        } else {
            this.removeAttribute('dark-mode'); // Quitar atributo si es false
        }
    }

    // --- Ciclo de vida ---

    connectedCallback() {
        // Es un buen lugar para asegurarse de que el renderizado inicial ocurra
        // si los botones ya fueron seteados antes de conectar.
        // console.log('IconButtonBar conectado al DOM');
        if (!this.shadowRoot.querySelector('.button-bar-container')) {
           this.#setupInitialStructure(); // Asegurarse que la estructura base existe
        }
        this.#renderButtons(); // Renderizar botones actuales
    }

    // 3. Reaccionar a cambios en los atributos observados
    attributeChangedCallback(name, oldValue, newValue) {
        // console.log(`Atributo ${name} cambiado de ${oldValue} a ${newValue}`);
        if (name === 'dark-mode') {
            // Los estilos se aplican automáticamente vía CSS (:host([dark-mode]))
            // No necesitamos hacer nada más aquí para el estilo visual,
            // pero podríamos añadir lógica si fuera necesario (ej. emitir un evento)
        }
    }

    // --- Métodos privados ---

    #setupInitialStructure() {
        // Limpiar el shadow root
        this.shadowRoot.innerHTML = '';

        // Crear contenedor de estilos
        const style = document.createElement('style');
        style.textContent = this.#getStyles(); // Obtener estilos del método dedicado
        this.shadowRoot.appendChild(style);

        // Crear el contenedor principal para los botones (inicialmente vacío)
        const container = document.createElement('div');
        container.className = 'button-bar-container';
        this.shadowRoot.appendChild(container);
    }

    #renderButtons() {
        const container = this.shadowRoot.querySelector('.button-bar-container');
        if (!container) {
            console.error("Error interno: Contenedor de botones no encontrado.");
            return; // Salir si el contenedor base no existe
        }

        // Limpiar solo los botones anteriores
        container.innerHTML = '';

        // Crear cada botón basado en la configuración actual
        this.#buttons.forEach(buttonConfig => {
            const button = document.createElement('button');
            button.dataset.action = buttonConfig.action;
            button.setAttribute('aria-label', buttonConfig.text); // Añadir ARIA label
            button.setAttribute('title', buttonConfig.text); // Tooltip básico

            if (buttonConfig.icon) {
                const iconSpan = document.createElement('span');
                iconSpan.className = 'icon';
                iconSpan.innerHTML = buttonConfig.icon;
                button.appendChild(iconSpan);
            }

            const textSpan = document.createElement('span');
            textSpan.className = 'text';
            textSpan.textContent = buttonConfig.text;
            button.appendChild(textSpan);

            container.appendChild(button);
        });
    }

    #getStyles() {
        // Usar CSS Custom Properties para theming
        return `
            :host {
                display: block;
                font-family: sans-serif;

                /* --- Variables de Color (Tema Claro - Default) --- */
                --ibb-bg-color: transparent; /* Fondo del componente */
                --ibb-button-bg: #f0f0f0;
                --ibb-button-text: #333;
                --ibb-button-border: #ccc;
                --ibb-button-bg-hover: #e0e0e0;
                --ibb-button-bg-active: #d0d0d0;
                --ibb-icon-color: inherit; /* Hereda de button-text por defecto */

                background-color: var(--ibb-bg-color);
                color: var(--ibb-button-text); /* Color base para el texto/iconos */
            }

            /* --- Variables de Color (Tema Oscuro) --- */
            :host([dark-mode]) {
                --ibb-bg-color: #222; /* Fondo oscuro para el componente */
                --ibb-button-bg: #555;
                --ibb-button-text: #eee;
                --ibb-button-border: #777;
                --ibb-button-bg-hover: #666;
                --ibb-button-bg-active: #777;
                /* Podrías definir --ibb-icon-color aquí si fuera diferente del texto */
            }

            .button-bar-container {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                padding: 5px; /* Añadir padding si el host tiene fondo */
            }

            button {
                padding: 8px 15px;
                border: 1px solid var(--ibb-button-border);
                background-color: var(--ibb-button-bg);
                color: var(--ibb-button-text); /* Usar variable */
                border-radius: 4px;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                transition: background-color 0.2s ease, border-color 0.2s ease;
                font-size: 1em;
            }
            button:hover {
                background-color: var(--ibb-button-bg-hover);
            }
            button:active {
                 background-color: var(--ibb-button-bg-active);
            }

            .icon {
                display: inline-block;
                font-size: 1.1em;
                line-height: 1;
                color: var(--ibb-icon-color); /* Usar variable */
            }
            .text {
                /* Estilos para el texto si son necesarios */
            }

            /* --- Estilos para Mobile --- */
            @media (max-width: 600px) {
                button .text {
                    display: none;
                }
                button {
                    padding: 8px 10px;
                    min-width: 40px;
                    justify-content: center;
                    gap: 0;
                }
            }
        `;
    }

    #attachListeners() {
        // Listener de clics (sin cambios)
        this.shadowRoot.addEventListener('click', (event) => {
            const button = event.target.closest('button');
            if (button && button.dataset.action) {
                const action = button.dataset.action;
                const detailPayload = { action };

                if (this.#data !== null && this.#data !== undefined) {
                    detailPayload.data = this.#data;
                }

                this.dispatchEvent(new CustomEvent('action', {
                    detail: detailPayload,
                    bubbles: true,
                    composed: true
                }));
            }
        });
    }
}

customElements.define('icon-button-bar', IconButtonBar);