class CustomPopup extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open', delegatesFocus: true });
        this._options = [];
        this.container = document.createElement('div');
        this.lastFocusedElement = null;
        
        this.container.style.cssText = `
            position: fixed;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            background-color: inherit;
            display: none;
            z-index: 1000;
            color-scheme: light dark;
            font-family: inherit;
            justify-content: center;
            align-items: stretch;
            flex-direction: column;
            min-width: inherit;
            width: 100%;
            max-width: 200px;
            border-radius: 4px;
            overflow: hidden;
        `;
    
        const style = document.createElement('style');
        style.textContent = `
            .material-symbols-rounded {
                font-family: inherit;
                font-size: 24px;
                margin-right: 10px;
            }
            .popup-option {
                cursor: pointer;
                transition: background-color 0.2s;
                display: flex;
                align-items: center;
                user-select: none;
            }
            .popup-option:hover {
                background-color: rgba(0, 0, 0, 0.05);
            }
            .default-font {
                font-family: Arial, sans-serif;
            }
            @media (prefers-color-scheme: dark) {
                .popup-option:hover {
                    background-color: rgba(255, 255, 255, 0.1);
                }
            }
        `;
    
        this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(this.container);
        this.handleClickOutside = this.handleClickOutside.bind(this);
    }

    // Getter y setter para las opciones
    get options() {
        return this._options;
    }

    set options(newOptions) {
        this._options = newOptions;
        this.render();
    }

    // Método para agregar una única opción
    addOption(html, callback) {
        this._options.push({
            html,
            callback: (event) => {
                callback(event);
                this.hide();
            }
        });
        this.render();
        return this._options.length - 1; // Retorna el índice de la opción agregada
    }

    // Método para establecer múltiples opciones de una vez
    setOptions(options) {
        this._options = options.map(option => ({
            html: option.html,
            callback: (event) => {
                option.callback(event);
                this.hide();
            }
        }));
        this.render();
    }

    // Método para limpiar todas las opciones
    clearOptions() {
        this._options = [];
        this.render();
    }

    // Método para remover una opción específica por índice
    removeOption(index) {
        if (index >= 0 && index < this._options.length) {
            this._options.splice(index, 1);
            this.render();
            return true;
        }
        return false;
    }

    render() {
        this.container.innerHTML = '';
        this._options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'popup-option';
            optionElement.innerHTML = option.html;
            optionElement.addEventListener('click', option.callback);
            this.container.appendChild(optionElement);
        });
    }

    connectedCallback() {
        this.render();
    }

    handleClickOutside(event) {
        const path = event.composedPath();
        if (!path.includes(this.container) && !path.includes(this.lastFocusedElement)) {
            this.hide();
        }
    }
    
    show(x, y) {
        this.container.style.display = 'flex';
        if (x !== undefined && y !== undefined) {
            this.moveTo(x, y);
        }
        document.addEventListener('click', this.handleClickOutside);
    }
    
    hide() {
        this.container.style.display = 'none';
        document.removeEventListener('click', this.handleClickOutside);
    }
    
    moveTo(x, y) {
        const rect = this.container.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
    
        if (x + rect.width > viewportWidth) {
            x = viewportWidth - rect.width - 10;
        }
        if (y + rect.height > viewportHeight) {
            y = viewportHeight - rect.height - 10;
        }
        this.container.style.left = `${Math.max(0, x)}px`;
        this.container.style.top = `${Math.max(0, y)}px`;
    }
    
    showAtElement(element) {
        const rect = element.getBoundingClientRect();
        this.show(rect.left, rect.bottom);
        this.lastFocusedElement = element;
    }
    
    disconnectedCallback() {
        document.removeEventListener('click', this.handleClickOutside);
    }
}

// Registrar el componente
customElements.define('custom-popup', CustomPopup);
  function safeParse(value) {
    try {
        // Si ya es un array u objeto, lo devolvemos tal cual
        if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
            return value;
        }

        // Si es un string que empieza con { o [, intentamos parsearlo
        if (typeof value === 'string' && (value.trim().startsWith('{') || value.trim().startsWith('['))) {
            try {
                return JSON.parse(value); // Intento normal
            } catch (error) {
                // Si falla, intentamos corregirlo
                const fixedJson = value
                    .replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":') // Poner comillas en claves
                    .replace(/:\s*'([^']+)'/g, ': "$1"'); // Reemplazar comillas simples por dobles en valores

                return JSON.parse(fixedJson); // Reintento con JSON corregido
            }
        }

        // Si es otro tipo de dato (número, booleano, etc.), lo devolvemos sin cambios
        return value;
    } catch (error) {
        console.error("Error al parsear JSON:", error, "Valor recibido:", value);
        return value; // Retorna el valor original si no se puede parsear
    }
}
class CDlg extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open', delegatesFocus: true });
    this._t = this.getAttribute('title') || ''; // Initialize from attribute
    this._d = this.getAttribute('description') || ''; // Initialize from attribute
    this._o = [];
    this._th = this.getAttribute('theme') || 'light'; // Initialize from attribute
    this._init();
  }

  static get observedAttributes() {
    // Corregido: Eliminado 'tittle'
    return ['title', 'description', 'theme'];
  }

  attributeChangedCallback(n, oV, nV) {
    if (oV !== nV) {
      const sr = this.shadowRoot;
      switch (n) {
        // Corregido: Eliminado 'tittle' case
        case 'title':
          this._t = nV;
          // Use nullish coalescing for safety, though querySelector should find it
          (sr.querySelector('.title') ?? {}).textContent = this._t;
          break;
        case 'description':
          this._d = nV;
          (sr.querySelector('.description') ?? {}).textContent = this._d;
          break;
        case 'theme':
          this._th = nV || 'light'; // Default to light if null/empty
          const container = sr.querySelector('.container');
          if (container) {
             // More robust way to handle class changes for theme
             container.classList.remove('light', 'dark'); // Remove existing theme classes
             container.classList.add(this._th); // Add the new theme class
          }
          break;
      }
    }
  }

  get options() {
    return this._o;
  }

  set options(v) {
    // Ensure v is an array
    this._o = Array.isArray(v) ? v : [];
    this._updOpts();
  }

  _css() {
    return `
      :host {
        /* Define variables for easier customization */
        --dlg-padding: 1.5rem;
        --dlg-border-radius: 8px;
        --dlg-font-family: system-ui, -apple-system, sans-serif;
        --dlg-title-size: 1.5rem;
        --dlg-title-weight: 600;
        --dlg-desc-size: 1rem;
        --dlg-desc-opacity: 0.8;
        --dlg-desc-max-height: 500px; /* Max height before scroll */
        --dlg-button-padding: 0.5rem 1rem;
        --dlg-button-radius: 4px;
        --dlg-button-font-size: 0.875rem;
        --dlg-options-gap: 0.5rem;
        --dlg-slot-margin-top: 1rem;
        --dlg-transition-speed: 0.2s;

        /* Light Theme Colors (Defaults) */
        --dlg-text-color: #1a1a1a;
        --dlg-border-color: #e5e5e5;
        --dlg-bg-color: #ffffff; /* Added background for completeness */
        --dlg-button-cancel-bg: #e5e5e5;
        --dlg-button-cancel-text: #1a1a1a;
        --dlg-button-cancel-hover-bg: #d9d9d9; /* Corrected hover */

        /* Dark Theme Colors (Applied via .dark class) */
        --dlg-dark-text-color: #ffffff;
        --dlg-dark-border-color: #333333;
        --dlg-dark-bg-color: #2a2a2a; /* Example dark bg */
        --dlg-dark-button-cancel-bg: #444444;
        --dlg-dark-button-cancel-text: #ffffff;
        --dlg-dark-button-cancel-hover-bg: #555555;

        /* Shared Button Colors */
        --dlg-button-save-bg: #007bff;
        --dlg-button-save-text: white;
        --dlg-button-save-hover-bg: #0056b3;
        --dlg-button-delete-bg: #dc3545;
        --dlg-button-delete-text: white;
        --dlg-button-delete-hover-bg: #bd2130;

        /* Host styles */
        display: block;
        font-family: var(--dlg-font-family);
      }

      /* Container holds all content */
      .container {
        padding: var(--dlg-padding);
        border-radius: var(--dlg-border-radius);
        transition: background-color var(--dlg-transition-speed) ease, border-color var(--dlg-transition-speed) ease, color var(--dlg-transition-speed) ease;
        border: 1px solid var(--dlg-border-color);
        background-color: var(--dlg-bg-color);
        color: var(--dlg-text-color);
      }

      /* Dark theme overrides */
      .container.dark {
        border-color: var(--dlg-dark-border-color);
        background-color: var(--dlg-dark-bg-color);
        color: var(--dlg-dark-text-color);
      }

      /* --- Elements --- */
      .title {
        font-size: var(--dlg-title-size);
        font-weight: var(--dlg-title-weight);
        margin: 0 0 0.5rem 0; /* Added some bottom margin */
      }

      .description {
        font-size: var(--dlg-desc-size);
        opacity: var(--dlg-desc-opacity);
        max-height: var(--dlg-desc-max-height);
        overflow-y: auto;
        margin: 0 0 1rem 0; /* Added some bottom margin */
        white-space: pre-wrap; /* Allow wrapping within <pre> */
        word-wrap: break-word; /* Break long words */
      }

      /* Container for dynamically added buttons */
      .options {
        display: flex;
        gap: var(--dlg-options-gap);
        flex-wrap: wrap;
        margin-top: var(--dlg-padding); /* Add space above buttons */
        justify-content: flex-end; /* Align buttons to the right by default */
      }

      /* Default slot for additional content */
      slot {
        display: block;
        margin-top: var(--dlg-slot-margin-top);
        margin-bottom: var(--dlg-slot-margin-top); /* Added bottom margin */
      }

      /* --- Buttons --- */
      button {
        padding: var(--dlg-button-padding);
        border-radius: var(--dlg-button-radius);
        border: none;
        cursor: pointer;
        font-size: var(--dlg-button-font-size);
        font-family: inherit; /* Inherit font from host */
        transition: background-color var(--dlg-transition-speed) ease, opacity var(--dlg-transition-speed) ease;
        background-color: transparent; /* Default button is transparent */
        color: inherit; /* Inherit text color */
        border: 1px solid transparent; /* Add border for consistent sizing */
      }

      button:hover {
         opacity: 0.85; /* Slight fade effect on hover for generic buttons */
      }

      /* Specific button styles */
      .save-btn {
        background-color: var(--dlg-button-save-bg);
        color: var(--dlg-button-save-text);
        border-color: var(--dlg-button-save-bg);
      }
      .save-btn:hover {
        background-color: var(--dlg-button-save-hover-bg);
        border-color: var(--dlg-button-save-hover-bg);
        opacity: 1; /* Override generic hover */
      }

      .cancel-btn {
        background-color: var(--dlg-button-cancel-bg);
        color: var(--dlg-button-cancel-text);
        border-color: var(--dlg-button-cancel-bg);
      }
      .cancel-btn:hover {
        background-color: var(--dlg-button-cancel-hover-bg); /* Corrected hover */
        border-color: var(--dlg-button-cancel-hover-bg);
        opacity: 1;
      }
      /* Dark theme overrides for cancel button */
      .container.dark .cancel-btn {
        background-color: var(--dlg-dark-button-cancel-bg);
        color: var(--dlg-dark-button-cancel-text);
        border-color: var(--dlg-dark-button-cancel-bg);
      }
      .container.dark .cancel-btn:hover {
        background-color: var(--dlg-dark-button-cancel-hover-bg);
        border-color: var(--dlg-dark-button-cancel-hover-bg);
      }


      .delete-btn {
        background-color: var(--dlg-button-delete-bg);
        color: var(--dlg-button-delete-text);
        border-color: var(--dlg-button-delete-bg);
      }
      .delete-btn:hover {
        background-color: var(--dlg-button-delete-hover-bg);
        border-color: var(--dlg-button-delete-hover-bg);
        opacity: 1;
      }
    `;
  }

  _init() {
    // Create style element
    const styleElement = document.createElement('style');
    styleElement.textContent = this._css();

    // Create main container div
    const container = document.createElement('div');
    // Set initial class based on _th property
    container.className = `container ${this._th}`; // Use property directly

    // Create title element
    const titleElement = document.createElement('h2');
    titleElement.className = 'title';
    titleElement.textContent = this._t; // Use property directly

    // Create description element
    const descriptionElement = document.createElement('pre'); // Using <pre> as in original
    descriptionElement.className = 'description';
    descriptionElement.textContent = this._d; // Use property directly

    // Create options container
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'options';

    // Create default slot
    const slotElement = document.createElement('slot');
    // No ID needed unless specifically targeted

    // Append elements to the container
    container.append(titleElement, descriptionElement, slotElement, optionsContainer);

    // Append style and container to shadowRoot
    this.shadowRoot.append(styleElement, container);

    // Initial population of options
    this._updOpts();
  }

  _updOpts() {
    const optionsContainer = this.shadowRoot.querySelector('.options');
    // Check if container exists before proceeding
    if (!optionsContainer) {
        console.warn('Options container not found in c-dlg shadowRoot.');
        return;
    }

    // Clear previous options efficiently
    optionsContainer.innerHTML = '';

    // Add new options
    this._o.forEach((opt, i) => {
      if (!opt || typeof opt.label === 'undefined') {
          console.warn(`Invalid option at index ${i}:`, opt);
          return; // Skip invalid option object
      }
      const button = document.createElement('button');
      button.textContent = opt.label;
      // Apply style attribute if provided
      if (opt.style) {
         button.style.cssText = opt.style;
      }
       // Apply class(es) if provided
      if (opt.class) {
         // Support multiple classes separated by space
         opt.class.split(' ').forEach(cls => {
            if(cls) button.classList.add(cls);
         });
      }
      // Add data-index for potential targeting, though direct callback is used
      button.dataset.index = i;

      // Add click listener for the callback
      button.addEventListener('click', (e) => {
        // Check if callback exists and is a function
        if (this._o[i]?.callback && typeof this._o[i].callback === 'function') {
          this._o[i].callback(e); // Pass event object to callback
        } else {
            console.warn(`No valid callback found for option index ${i}`);
        }
      });

      optionsContainer.appendChild(button);
    });
  }
}
customElements.define('c-dlg', CDlg);

class DlgCont extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open', delegatesFocus: true });
    // Initialize visibility based on the presence of the attribute
    this._vis = this.hasAttribute('visible');
    this._render();
  }

  static get observedAttributes() {
    return ['visible', 'required'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // Only react if the value actually changes to avoid unnecessary updates
    if (oldValue !== newValue) {
        if (name === 'visible') {
            const shouldBeVisible = newValue !== null; // Attribute presence check
            if (this._vis !== shouldBeVisible) { // Update only if state differs
                 this._vis = shouldBeVisible;
                 this._updVis();
            }
        }
        // 'required' attribute doesn't need visual update, just affects behavior
    }
  }

  // Method to programmatically show the dialog
  show() {
    // Set attribute which triggers attributeChangedCallback -> _updVis
    if (!this.hasAttribute('visible')) {
        this.setAttribute('visible', '');
    }
  }

  // Method to programmatically hide the dialog
  hide() {
     // Remove attribute which triggers attributeChangedCallback -> _updVis
     if (this.hasAttribute('visible')) {
        this.removeAttribute('visible');
     }
  }

  _css() {
    return `
      :host {
        /* --- Customizable Variables --- */
        --dlg-overlay-bg: rgba(0, 0, 0, 0.5); /* Overlay background color */
        --dlg-z-index: 1000;                  /* Stack order */
        --dlg-transition-duration: 0.3s;       /* Animation speed */
        --dlg-content-max-height: 90dvh;     /* Max height relative to viewport */
        --dlg-content-border-radius: 16px;   /* Dialog box corner rounding */
        --dlg-content-padding: 8px;         /* Padding around the slotted content */
        /* Note: Background and color for .dlg-cnt can be set here or use 'inherit' */
        /* Using inherit allows styling via the <dlg-cont> element itself */
        --dlg-content-bg: inherit;
        --dlg-content-color: inherit;

        /* --- Host Element --- */
        /* The host itself is usually just a block container */
        display: block;
        /* The following inherit properties allow styling the *content* background/color */
        /* by applying styles to the <dlg-cont> element externally. */
        background: inherit; /* Inherits from parent in normal DOM */
        color: inherit;      /* Inherits from parent in normal DOM */
        /* border-radius/padding on host are less useful if .dlg-cnt defines its own */
      }

      /* --- Overlay --- */
      .dlg-ov {
        position: fixed;
        inset: 0; /* Modern equivalent of top/left/width/height = 0/0/100%/100% */
        background-color: var(--dlg-overlay-bg);

        /* Centering */
        display: flex;
        align-items: center;
        justify-content: center;

        z-index: var(--dlg-z-index);

        /* Initial state (hidden) */
        opacity: 0;
        visibility: hidden;

        /* Transition for appearance */
        transition: opacity var(--dlg-transition-duration) ease,
                    visibility var(--dlg-transition-duration) ease;
      }

      /* --- Content Wrapper --- */
      .dlg-cnt {
        /* Intrinsic sizing and scrolling */
        max-height: var(--dlg-content-max-height);
        overflow-y: auto;

        /* Appearance - Inherits from host by default via variables */
        background: var(--dlg-content-bg);
        color: var(--dlg-content-color);
        border-radius: var(--dlg-content-border-radius);
        padding: var(--dlg-content-padding); /* Padding inside the dialog box */
        /* margin: 1rem; /* Optional margin around the dialog */

        /* Initial state for transform */
        transform: scale(0.95);
        /* Transition for pop-in effect */
        transition: transform var(--dlg-transition-duration) ease;

        /* Prevent content from inheriting overlay transitions */
        transition-property: transform;
      }

      /* --- Visible State --- */
      .dlg-ov.visible {
        opacity: 1;
        visibility: visible;
      }

      .dlg-ov.visible .dlg-cnt {
        transform: scale(1); /* Animate to full size */
      }

      /* Removed unused .header styles */
    `;
  }

  _updVis() {
    // Ensure shadowRoot and overlay exist
    const overlay = this.shadowRoot?.querySelector('.dlg-ov');
    if (overlay) {
      overlay.classList.toggle('visible', this._vis);
      // Optional: Manage focus when showing/hiding
      if (this._vis) {
        // Attempt to focus the container or the first focusable element inside
        // Using delegatesFocus: true on attachShadow helps manage focus
        // but sometimes explicit focus is needed depending on content.
        const content = overlay.querySelector('.dlg-cnt');
        // Check if content exists and is not already focused
         if(content && typeof content.focus === 'function' && this.shadowRoot.activeElement !== content) {
            // Set tabindex=-1 to make it focusable if it isn't naturally
            // This might not be needed if delegatesFocus works as expected
            // or if there are focusable elements (buttons, inputs) inside
            // if (!content.hasAttribute('tabindex')) {
            //   content.setAttribute('tabindex', "-1");
            // }
            // requestAnimationFrame(() => content.focus()); // Focus after paint
         }
      } else {
          // Potentially return focus to the element that opened the dialog
          // Requires storing the previously focused element before showing.
      }
    }
  }

  _render() {
    const styleElement = document.createElement('style');
    styleElement.textContent = this._css();

    const overlay = document.createElement('div');
    overlay.className = `dlg-ov ${this._vis ? 'visible' : ''}`; // Initial class based on _vis

    const contentContainer = document.createElement('div');
    contentContainer.className = 'dlg-cnt';

    const slotElement = document.createElement('slot'); // Default slot

    contentContainer.appendChild(slotElement);
    overlay.appendChild(contentContainer);

    this.shadowRoot.append(styleElement, overlay);

    // Add click listener to the overlay (for closing)
    overlay.addEventListener('click', (e) => {
        // Check if the click target is the overlay itself (not content)
        // and if the dialog is not 'required'
        if (e.target === overlay && !this.hasAttribute('required')) {
            this.hide(); // Call the hide method
        }
    });

    // Optional: Add Escape key listener to close the dialog
    // This requires adding/removing listener when visibility changes
    // Could be added in _updVis or constructor/disconnectedCallback
  }
}
customElements.define('dlg-cont', DlgCont);
if (!customElements.get('c-inp')) {
  class CInp extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open', delegatesFocus: true });
      this._hndlInpChg = this._hndlInpChg.bind(this);
    }

    static get observedAttributes() {
      return ['type', 'id', 'name', 'value', 'placeholder', 'disabled', 'readonly', 'darkmode', 'options', 'required', 'title', 'pattern'];
    }

    _css() {
      const dm = this.hasAttribute('darkmode');
      return `
        :host { display: block; margin: inherit; color-scheme: light dark; margin: 0.5rem; padding: 0.5rem; }
        .inp-cont { display: flex; flex-direction: column; padding: inherit; }
        input, textarea, select { padding: inherit; padding: 0.5rem; border: inherit; border-color: ${dm ? '#555' : '#ccc'}; border-radius: 4px; font-size: 14px; background-color: inherit; color: inherit; }
        textarea { resize: vertical; min-height: 100px; }
        input:disabled, textarea:disabled, select:disabled { background-color: ${dm ? '#222' : '#f5f5f5'}; cursor: not-allowed; color: ${dm ? '#666' : '#888'}; }
        .sw { position: relative; display: inline-block; width: 60px; height: 30px; }
        .sw input { opacity: 0; width: 0; height: 0; }
        .sldr { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${dm ? '#555' : '#ccc'}; transition: .4s; border-radius: 34px; }
        .sldr:before { position: absolute; content: ""; height: 22px; width: 22px; left: 4px; bottom: 4px; background-color: ${dm ? '#888' : 'white'}; transition: .4s; border-radius: 50%; }
        input:checked + .sldr { background-color: #2196F3; }
        input:checked + .sldr:before { transform: translateX(28px); }
        input:focus, textarea:focus, select:focus { outline: none; border-color: #2196F3; box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2); }
        .val-form.invalid input, .val-form.invalid textarea, .val-form.invalid select { border-color: red; box-shadow: 0 0 0 2px rgba(255, 0, 0, 0.2); }
      `;
    }

    connectedCallback() {
      this._rndr();
      this._attachListeners();
    }

    disconnectedCallback() {
       this._removeListeners();
    }

     _attachListeners() {
        const t = this.getAttribute('type');
        const sr = this.shadowRoot;

        if (t === 'radio') {
            const radInps = sr.querySelectorAll('input[type="radio"]');
            radInps.forEach(r => r.addEventListener('change', this._hndlInpChg));
        } else {
            const inp = sr.querySelector('input, textarea, select');
            if (inp) {
                inp.addEventListener('input', this._hndlInpChg);
                inp.addEventListener('change', this._hndlInpChg);
            }
        }

        const f = sr.querySelector('.val-form'); // Only one form now
        if (f) {
            f.addEventListener('submit', (e) => {
              e.preventDefault(); // Prevent default regardless of validity
              const d = this.getVal();
              if (this.isValid()) { // Only dispatch if valid
                this._hndlSub(e, d);
              }
            });
        }
    }

    _removeListeners() {
        const t = this.getAttribute('type');
        const sr = this.shadowRoot;

        if (t === 'radio') {
            const radInps = sr.querySelectorAll('input[type="radio"]');
            radInps.forEach(r => r.removeEventListener('change', this._hndlInpChg));
        } else {
            const inp = sr.querySelector('input, textarea, select');
            if (inp) {
                inp.removeEventListener('input', this._hndlInpChg);
                inp.removeEventListener('change', this._hndlInpChg);
            }
        }

        // No need to explicitly remove submit listener, it's on the shadow root's form
        // which gets removed when the element disconnects.
    }


    _hndlInpChg(evt) {
      const v = this.getVal(); // Get value *after* change
      this.dispatchEvent(new CustomEvent('change', {
        detail: { id: this.getAttribute('id'), name: this.getAttribute('name'), value: v },
        bubbles: true, composed: true
      }));
       this.isValid(); // Trigger validation check on change
    }

    attributeChangedCallback(nm, ov, nv) {
      if (ov !== nv) {
        this._rndr();
         this._removeListeners(); // Remove old before attaching new
         this._attachListeners(); // Re-attach listeners after render
      }
    }

    _hndlSub(e, d = null) {
      // Validity checked before calling this
      this.dispatchEvent(new CustomEvent('form-submit', {
        detail: { id: this.getAttribute('id'), name: this.getAttribute('name'), value: d },
        bubbles: true, composed: true
      }));
    }

    _rndr() {
      const t = this.getAttribute('type') || 'text';
      const i = this.getAttribute('id');
      const n = this.getAttribute('name');
      const v = this.getAttribute('value') || '';
      const p = this.getAttribute('placeholder') || '';
      const dis = this.hasAttribute('disabled');
      const ro = this.hasAttribute('readonly');
      const opts = this.getAttribute('options') || '[]';
      const req = this.hasAttribute('required');
      const tit = this.getAttribute('title') || '';
      const pat = this.getAttribute('pattern') || '';
      const args = { t, i, n, v, p, dis, ro, opts, req, tit, pat };

      this.shadowRoot.innerHTML = `
        <style>${this._css()}</style>
        <form class="val-form" novalidate>
          <div class="inp-cont">
            ${this._rndrInp(args)}
          </div>
          <button type="submit" style="display: none;"></button>
        </form>
      `;
        // Listeners are attached in connectedCallback and re-attached in attributeChangedCallback
    }

    _rndrInp(args) {
      const { t, i, n, v, p, dis, ro, opts, req, tit, pat } = args;
      const reqAttr = req ? 'required' : '';
      const titleAttr = tit ? `title="${tit}" oninvalid="this.setCustomValidity('${tit}')" oninput="this.setCustomValidity('')"` : '';
      const patternAttr = pat ? `pattern="${pat}"` : '';
      const commonAttrs = `id="${i}" name="${n}" ${dis ? 'disabled' : ''} ${ro ? 'readonly' : ''} ${reqAttr} ${titleAttr} ${patternAttr}`;

      switch (t) {
        case 'textarea':
          return `<textarea ${commonAttrs} placeholder="${p}">${v}</textarea>`;
        case 'checkbox':
        case 'switch':
        case 'boolean':
          return `<label class="sw"><input type="checkbox" ${commonAttrs} ${v === 'true' ? 'checked' : ''}><span class="sldr"></span></label>`;
        case 'select':
           try {
                const optsArr = safeParse(opts);
                return `
                    <select ${commonAttrs}>
                        ${optsArr.map(opt => `<option value="${opt.value}" ${opt.value === v ? 'selected' : ''}>${opt.label}</option>`).join('')}
                    </select>`;
            } catch (e) { console.error("Invalid JSON for options:", opts); return `<select ${commonAttrs}></select>`; }
        case 'radio':
           try {
                const radOpts = safeParse(opts);
                return radOpts.map(opt => `
                    <label>
                        <input type="radio" id="${i}_${opt.value}" name="${n}" value="${opt.value}" ${opt.value === v ? 'checked' : ''} ${dis ? 'disabled' : ''} ${ro ? 'readonly' : ''} ${reqAttr} ${titleAttr}>
                        ${opt.label}
                    </label>`).join('');
            } catch (e) { console.error("Invalid JSON for options:", opts); return ''; }
        default:
          return `<input type="${t === 'string' ? 'text' : t}" ${commonAttrs} value="${v}" placeholder="${p}">`;
      }
    }

    getVal() {
        const sr = this.shadowRoot;
        if (this.getAttribute('type') === 'radio') {
            const selRad = sr.querySelector(`input[name="${this.getAttribute('name')}"]:checked`);
            return selRad ? selRad.value : null;
        }

        const inp = sr.querySelector('input:not([type=radio]), textarea, select');
        if (!inp) return null;

        if (inp.type === 'checkbox') return inp.checked; // Use boolean for checkbox
        // Removed textarea specific split logic - treat as standard string input
        return this._parseVal(inp);
    }

    isValid() {
        const f = this.shadowRoot.querySelector('.val-form');
        if (!f) return true; // No form, trivially valid
        const valid = f.checkValidity();
        f.classList.toggle('invalid', !valid);
        //f.reportValidity(); // Show native bubbles (optional)
        return valid;
    }

    _parseVal(inp) {
        const v = inp.value;
        switch (inp.type) {
            case 'number': return v === '' ? null : Number(v); // Return null if empty, else number
            // case 'text': // Treat text/string/others the same
            // case 'string':
            default: return v;
        }
    }

    setVal(val) {
        const sr = this.shadowRoot;
        if (this.getAttribute('type') === 'radio') {
            const radToSel = sr.querySelector(`input[name="${this.getAttribute('name')}"][value="${val}"]`);
            if (radToSel) radToSel.checked = true;
            this._hndlInpChg(); // Dispatch change
            return;
        }

        const inp = sr.querySelector('input:not([type=radio]), textarea, select');
        if (!inp) return;

        if (inp.type === 'checkbox') {
            inp.checked = Boolean(val);
        } else {
            inp.value = val === null || val === undefined ? '' : val; // Handle null/undefined
        }
        this._hndlInpChg(); // Dispatch change
    }

    reset() {
        const sr = this.shadowRoot;
        if (this.getAttribute('type') === 'radio') {
            const radInps = sr.querySelectorAll('input[type="radio"]');
            radInps.forEach(r => r.checked = false);
            this._hndlInpChg();
            return;
        }

        const inp = sr.querySelector('input:not([type=radio]), textarea, select');
        if (!inp) return;

        if (inp.type === 'checkbox') {
            inp.checked = false;
        } else {
            inp.value = '';
        }
        this._hndlInpChg();
    }

    setOpts(opts) {
        if (['select', 'radio'].includes(this.getAttribute('type'))) {
            this.setAttribute('options', JSON.stringify(opts));
            // Re-render is handled by attributeChangedCallback
        }
    }

    getSelOpt() {
        if (this.getAttribute('type') === 'select') {
            const sel = this.shadowRoot.querySelector('select');
            return sel ? sel.value : null;
        }
        return null;
    }
  }
  customElements.define('c-inp', CInp);
}
// --- TEMPLATES and WEB COMPONENTS (EpisodeList, SeasonList, SeriesSeasonsModal) ---
class EpisodeList extends HTMLElement {
  constructor() {
      super();
      this.attachShadow({ mode: 'open' });

      // --- CORRECCIÓN ---
      // Define el contenido directamente, sin las etiquetas <template> externas.
      const templateContent = `
          <style>
            .episode-list-header {
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 1px solid #ddd;
              display: flex;
              justify-content: space-between;
              align-items: center;
              flex-wrap: wrap; /* Para que el botón baje si no cabe */
            }
            .episode-list-header h3 {
                margin: 0 10px 0 0; /* Añade margen derecho */
                font-size: 1.2em;
                color: #333;
                flex-grow: 1; /* Permite que el título crezca */
            }
            .back-to-seasons-button {
                padding: 3px 8px;
                font-size: 0.9em;
                cursor: pointer;
                background: none;
                border: 1px solid #007bff;
                color: #007bff;
                border-radius: 3px;
                flex-shrink: 0; /* Evita que el botón se encoja */
            }
            .back-to-seasons-button:hover {
                background-color: #e7f3ff;
            }
            .episode-item {
              padding: 8px 0;
              border-bottom: 1px dashed #eee;
              display: flex;
              justify-content: space-between;
              align-items: center;
              flex-wrap: wrap; /* Para responsividad */
            }
            .episode-item:last-child {
                border-bottom: none;
            }
            .episode-title {
              font-size: 0.95em;
              flex-grow: 1;
              margin-right: 10px; /* Espacio entre título y acciones */
               /* Para que el texto largo no descuadre el layout */
              overflow-wrap: break-word;
              word-break: break-word;
            }
             .episode-actions {
               display: flex; /* Asegura que los botones estén en línea */
               align-items: center; /* Alinea verticalmente */
               flex-shrink: 0; /* Evita que se encojan */
               margin-left: auto; /* Empuja a la derecha */
               padding-left: 5px; /* Pequeño espacio si el título llega */
             }
            .episode-actions button {
                margin-left: 5px;
              padding: 2px 6px;
              font-size: 0.8em;
              cursor: pointer;
              background: none;
              border: 1px solid #ccc;
              border-radius: 3px;
            }
              .episode-actions button:hover {
                background-color: #eef;
            }
            p { margin: 5px 0; }
            .loading, .no-capitulos {
              color: #888;
              font-style: italic;
              padding: 10px 0;
            }
            #ep-list {
                padding-left: 10px; /* Considera si este padding es necesario */
            }
          </style>
          <div class="episode-list-header">
            <h3 id="season-header-title">Capítulos</h3>
            <button class="back-to-seasons-button">← Volver a Temporadas</button>
          </div>
          <div id="ep-list">
            <p class="loading">Cargando capítulos...</p>
          </div>
      `;
      // Asigna el contenido directamente al innerHTML del shadowRoot
      this.shadowRoot.innerHTML = templateContent;
      // --- FIN CORRECCIÓN ---

      this._capitulos = [];
      this._seasonInfo = { id: null, number: null, title: '', animeId: null }; // Usar animeId es más claro que seriesId si trabajas con animes

      // Guardar referencias a elementos usados frecuentemente (buena práctica)
      this._listContainer = this.shadowRoot.querySelector('#ep-list');
      this._headerTitle = this.shadowRoot.querySelector('#season-header-title');
      this._backButton = this.shadowRoot.querySelector('.back-to-seasons-button');

      // Añadir el listener DESPUÉS de que el HTML esté en el DOM
      if (this._backButton) { // Siempre es buena idea comprobar si se encontró
           this._backButton.addEventListener('click', () => this._emitAction('back-to-seasons', {
              seasonInfo: this._seasonInfo // Asegúrate que _seasonInfo tenga animeId cuando se llame
           }));
      } else {
          console.error("Error interno: No se encontró el botón '.back-to-seasons-button'");
      }
  }

  setSeasonData(capitulos, seasonInfo) {
      this._capitulos = capitulos || [];
      this._seasonInfo = seasonInfo || { id: null, number: null, title: '', animeId: null };
      console.log("seasonInfo",this._seasonInfo, "capitulos",this._capitulos)
      this.render();
  }

  render() {
      // Usar las referencias guardadas
      const listContainer = this._listContainer;
      const headerTitle = this._headerTitle;

      if (!listContainer || !headerTitle) {
           console.error("Error interno: Faltan elementos del contenedor o título en el shadow DOM.");
           return;
      }

      listContainer.innerHTML = ''; // Limpiar contenedor de episodios

      // Usar textContent para seguridad y rendimiento al establecer texto dinámico
      headerTitle.textContent = `Temporada ${this._seasonInfo.number}${this._seasonInfo.title ? `: ${this._seasonInfo.title}` : ''} - Capítulos`;

      if (!this._capitulos || this._capitulos.length === 0) {
          listContainer.innerHTML = '<p class="no-capitulos">No hay capítulos para mostrar para esta temporada.</p>';
          return;
      }

      this._capitulos.forEach(episode => {
          // Asegúrate de que 'episode' tiene 'id', 'number', 'title'
          if (!episode || typeof episode.id === 'undefined' || typeof episode.number === 'undefined' || typeof episode.title === 'undefined') {
              console.warn("Saltando episodio con datos incompletos:", episode);
              return; // Saltar este episodio si le faltan datos esenciales
          }

          const episodeDiv = document.createElement('div');
          episodeDiv.classList.add('episode-item');
          episodeDiv.dataset.episodeId = episode.id;

          // Crear elementos dinámicamente es más seguro que innerHTML si los datos vienen del usuario
          const titleSpan = document.createElement('span');
          titleSpan.classList.add('episode-title');
          // Usar textContent para evitar XSS
          titleSpan.textContent = `Ep. ${episode.number}: ${episode.title}`;

          const actionsDiv = document.createElement('div');
          actionsDiv.classList.add('episode-actions');
          actionsDiv.innerHTML = `
              <button class="edit-episode" title="Editar Capítulo">✏️</button>
              <button class="delete-episode" title="Eliminar Capítulo">🗑️</button>
          `;

          episodeDiv.appendChild(titleSpan);
          episodeDiv.appendChild(actionsDiv);

          // Añadir listeners a los botones de acción
          actionsDiv.querySelector('.edit-episode').addEventListener('click', () =>
              this._emitAction('edit-episode', {
                  episodeId: episode.id,
                  seasonId: this._seasonInfo.id,
                  animeId: this._seasonInfo.animeId,
                  episode: episode // Pasa el objeto completo
              })
          );

          actionsDiv.querySelector('.delete-episode').addEventListener('click', () =>
              this._handleDeleteEpisode(episode) 
          );

          listContainer.appendChild(episodeDiv);
      });
  }

  _handleDeleteEpisode(episode) {
           this._emitAction('delete-episode', {
               episodeId: episode.id,
               seasonId: this._seasonInfo.id,
               animeId: this._seasonInfo.animeId,
               episode: episode // Pasa el objeto completo
           });
  }

  _emitAction(action, data) {
      this.dispatchEvent(new CustomEvent('component-action', {
          detail: {
              action: action,
              data: data, // Contiene toda la info necesaria (ids, objeto)
              component: 'episode-list', // Identificador del componente
              sourceId: this._seasonInfo.id // ID de la temporada a la que pertenece esta lista
          },
          bubbles: true,
          composed: true
      }));
  }
}

customElements.define('episode-list', EpisodeList);

class SeasonList extends HTMLElement {
  constructor() {
      super();
      this.attachShadow({ mode: 'open' });

      // --- CORRECCIÓN ---
      // Define el contenido directamente, sin las etiquetas <template> externas.
      const templateContent = `
          <style>
            .season-item {
              border: 1px solid #ddd;
              margin-bottom: 15px;
              padding: 10px;
              border-radius: 5px;
              background-color: #f9f9f9;
            }
            .season-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 10px;
              flex-wrap: wrap; /* Asegura que los botones se envuelvan si no hay espacio */
            }
            .season-title {
              font-weight: bold;
              font-size: 1.1em;
              margin-right: 15px; /* Espacio entre título y acciones */
              flex-grow: 1; /* Permite que el título ocupe espacio disponible */
            }
            .season-actions {
                display: flex;
                align-items: center;
                flex-shrink: 0; /* Evita que los botones se encojan demasiado */
                margin-left: auto; /* Empuja los botones a la derecha si hay espacio */
                padding-left: 10px; /* Espacio por si el título llega hasta aquí */
            }
            .season-actions button {
              margin-left: 5px;
              padding: 3px 8px;
              font-size: 0.9em;
              cursor: pointer;
              background: none;
              border: 1px solid #ccc;
              border-radius: 3px;
            }
            .season-actions button:hover {
                background-color: #eee;
            }
            .view-capitulos-button {
                cursor: pointer;
                color: #007bff;
                text-decoration: none;
                border: 1px solid #007bff;
                padding: 3px 8px;
                border-radius: 3px;
                font-size: 0.9em;
                display: inline-block; /* O block si quieres que ocupe toda la línea */
                margin-top: 5px;
                background-color: white;
            }
            .view-capitulos-button:hover {
                background-color: #e7f3ff;
            }
            .no-seasons {
              color: #888;
              font-style: italic;
              padding: 10px 0;
            }
            #list-container {
              /* Puedes añadir estilos específicos para el contenedor si es necesario */
            }
          </style>
          <div id="list-container">
            <!-- El contenido se renderizará aquí -->
          </div>
      `;
      // Asigna el contenido directamente al innerHTML del shadowRoot
      this.shadowRoot.innerHTML = templateContent;
      // --- FIN CORRECCIÓN ---

      this._seasons = [];
      this._animeId = null;

      // Es buena práctica obtener una referencia al contenedor aquí si no cambia
      this._container = this.shadowRoot.querySelector('#list-container');
  }

  setSeasons(seasonsData, animeId) {
      this._seasons = seasonsData || [];
      this._animeId = animeId;
      this.render();
  }

  // Este setter es un poco redundante con setSeasons, pero funciona.
  // Asegúrate de que la data que pasas aquí tenga el formato esperado.
  set seasons(data) {
      // Podrías querer una lógica más robusta para extraer animeId
      // si data no es un array o si está vacío.
      const animeId = data && data.length > 0 ? data[0]?.animeId : this._animeId; // Intenta obtener de los datos o mantener el anterior
      this.setSeasons(data, animeId);
  }

  get seasons() { return this._seasons; }

  render() {
      // Usa la referencia guardada en el constructor
      const container = this._container; // O this.shadowRoot.querySelector('#list-container'); si prefieres buscarlo cada vez

      // Pequeña comprobación por si acaso _container no se encontró (aunque con la corrección, debería)
      if (!container) {
          console.error("Error interno: El contenedor #list-container no se encontró en el shadow DOM.");
          return;
      }

      container.innerHTML = ''; // Limpia el contenedor

      if (!this._seasons || this._seasons.length === 0) {
          container.innerHTML = '<p class="no-seasons">No hay temporadas para mostrar.</p>';
          return;
      }

      this._seasons.forEach(season => {
          const seasonDiv = document.createElement('div');
          seasonDiv.classList.add('season-item');
          seasonDiv.dataset.seasonId = season.id; // Asegúrate de que tus objetos 'season' tengan una propiedad 'id'
          const episodeCount = season.capitulos?.length ?? 0; // Buen uso del optional chaining y nullish coalescing

          // Usar textContent para los datos dinámicos es más seguro contra XSS
          const seasonTitleSpan = document.createElement('span');
          seasonTitleSpan.classList.add('season-title');
          seasonTitleSpan.textContent = `Temporada ${season.number}${season.title ? `: ${season.title}` : ''}`;

          const seasonHeaderDiv = document.createElement('div');
          seasonHeaderDiv.classList.add('season-header');
          seasonHeaderDiv.appendChild(seasonTitleSpan); // Añade el título

          const seasonActionsDiv = document.createElement('div');
          seasonActionsDiv.classList.add('season-actions');
          seasonActionsDiv.innerHTML = `
              <button class="edit-season" title="Editar Temporada">✏️</button>
              <button class="delete-season" title="Eliminar Temporada">🗑️</button>
              <button class="add-episode" title="Añadir Capítulo">+</button>
          `;
          seasonHeaderDiv.appendChild(seasonActionsDiv); // Añade las acciones

          const viewcapitulosButton = document.createElement('button');
          viewcapitulosButton.classList.add('view-capituos-button');
          viewcapitulosButton.textContent = `Ver Capítulos (${episodeCount})`;

          // Añadir listeners a los botones de acción
          seasonActionsDiv.querySelector('.edit-season').addEventListener('click', () =>
              this._emitAction('edit-season', {
                  seasonId: season.id,
                  animeId: this._animeId,
                  season: season // Pasa el objeto season completo
              })
          );

          seasonActionsDiv.querySelector('.delete-season').addEventListener('click', () =>
              this._handleDeleteSeason(season)
          );

          seasonActionsDiv.querySelector('.add-episode').addEventListener('click', () =>
              this._emitAction('add-episode', {
                  seasonId: season.id,
                  animeId: this._animeId,
                  season: season
              })
          );

          // Añadir listener al botón de ver capítulos
          viewcapitulosButton.addEventListener('click', () =>
              this._emitAction('view-capitulos', {
                  seasonId: season.id,
                  animeId: this._animeId,
                  season: season
              })
          );

          // Construir el div de la temporada
          seasonDiv.appendChild(seasonHeaderDiv);
          seasonDiv.appendChild(viewcapitulosButton);

          container.appendChild(seasonDiv); // Añadir el div de la temporada al contenedor
      });
  }

  _handleDeleteSeason(season) {
      // Usa el número de temporada y la cuenta de episodios real para el mensaje
      const episodeCount = season.capitulos?.length ?? 0;
          this._emitAction('delete-season', {
              seasonId: season.id,
              animeId: this._animeId,
              season: season // Pasa el objeto season completo
          });
      
  }

  _emitAction(action, data) {
      this.dispatchEvent(new CustomEvent('component-action', {
          detail: {
              action: action,
              data: data, // Los datos ya incluyen seasonId, animeId, season
              component: 'season-list', // Identificador del componente que emite
              sourceId: this._animeId // ID de la serie a la que pertenece esta lista
          },
          bubbles: true, // Permite que el evento suba por el DOM
          composed: true // Permite que el evento cruce los límites del Shadow DOM
      }));
  }
}

// Asegúrate de que la definición del custom element esté fuera de la clase
customElements.define('season-list', SeasonList);

// El error "Uncaught (in promise)" que aparecía al final de tu código original
// probablemente se debía a que el navegador intentaba ejecutar esa frase como código
// después de definir el elemento. Lo he eliminado.