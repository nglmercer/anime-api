class CustomDialog extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open', delegatesFocus: true });
  
      this._title = '';
      this._description = '';
      this._options = [];
      this._theme = 'light';
  
      this.initTemplate();
    }
  
    static get observedAttributes() {
      return ['title', 'description', 'theme'];
    }
  
    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue !== newValue) {
        switch (name) {
          case 'tittle':
          case 'title':
            this._title = newValue;
            this.shadowRoot.querySelector('.title').textContent = this._title;
            break;
          case 'description':
            this._description = newValue;
            this.shadowRoot.querySelector('.description').textContent = this._description;
            break;
          case 'theme':
            this._theme = newValue;
            this.shadowRoot.querySelector('.container').className = `container ${this._theme}`;
            break;
        }
      }
    }
  
    get options() {
      return this._options;
    }
  
    set options(value) {
      this._options = value;
      this.updateOptions();
    }
  
    createStyles() {
      return `
        :host {
          display: block;
          font-family: system-ui, -apple-system, sans-serif;
        }
  
        .container {
          padding: 1.5rem;
          border-radius: 8px;
          transition: all 0.3s ease;
        }
  
        .container.light {
          color: #1a1a1a;
          border: 1px solid #e5e5e5;
        }
  
        .container.dark {
          color: #ffffff;
          border: 1px solid #333333;
        }
  
        .title {
          font-size: 1.5rem;
          font-weight: 600;
        }
  
        .description {
          font-size: 1rem;
          opacity: 0.8;
          max-height: 500px;
          overflow-y: auto;
        }
  
        .options {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
  
        slot {
          display: block;
          margin-top: 1rem;
        }
                  button {
            padding: 0.5rem 1rem;
            border-radius: 4px;
            border: none;
            cursor: pointer;
            font-size: 0.875rem;
            transition: all 0.2s ease;
          }
          button {
            color: inherit;
            background-color: inherit;
          }
          button:hover {
            background-color: inherit;
          }
    
          .save-btn {
            background-color: #007bff;
            color: white;
          }
          .save-btn:hover {
            background-color: #0056b3;
          }
          .cancel-btn {
            background-color: #e5e5e5;
            color: black;
          }
          .cancel-btn:hover {
            background-color: #0056b3;
          }
          .save-btn:hover {
            background-color: #0056b3;
          }
          .delete-btn {
            background-color: #dc3545;
            color: white;
          }
          .delete-btn:hover { 
            background-color: #bd2130;
          }
      `;
    }
  
    initTemplate() {
      const style = document.createElement('style');
      style.textContent = this.createStyles();
      
      const container = document.createElement('div');
      container.className = `container ${this._theme}`;
  
      const title = document.createElement('h2');
      title.className = 'title';
      title.textContent = this._title;
  
      const description = document.createElement('pre');
      description.className = 'description';
      description.textContent = this._description;
  
      const options = document.createElement('div');
      options.className = 'options';
  
      const slot = document.createElement('slot'); // Slot permanece fijo
      slot.id = 'slot';
  
      container.append(title, description,slot, options );
      this.shadowRoot.append(style, container);
  
      this.updateOptions();
    }
  
    updateOptions() {
      const optionsContainer = this.shadowRoot.querySelector('.options');
      optionsContainer.innerHTML = ''; // Limpiar opciones
  
      this._options.forEach((option, index) => {
        const button = document.createElement('button');
        button.textContent = option.label;
        button.style = option.style || '';
        button.className = option.class || '';
        button.dataset.index = index;
  
        button.addEventListener('click', () => {
          if (this._options[index]?.callback) {
            this._options[index].callback();
          }
        });
  
        optionsContainer.appendChild(button);
      });
    }
}
  
customElements.define('custom-dialog', CustomDialog);

class DialogContainer extends HTMLElement {
    constructor() {
    super();
    this.attachShadow({ mode: 'open', delegatesFocus: true });
    
    // Estado inicial
    this._isVisible = false;
    this._content = null;
    
    this.render();
    }

    static get observedAttributes() {
    return ['visible','required'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'visible') {
        this._isVisible = newValue !== null;
        this.updateVisibility();
    }
    }

    // Métodos públicos para mostrar/ocultar
    show() {
    this._isVisible = true;
    this.setAttribute('visible', '');
    this.updateVisibility();
    }

    hide() {
    this._isVisible = false;
    this.removeAttribute('visible');
    this.updateVisibility();
    }

    // Método para insertar contenido
    setContent(element) {
    this._content = element;
    this.render();
    }

    createStyles() {
    return `
        :host {
        display: block;
        position: relative;
        background: inherit;
        background-color: inherit;
        color: inherit;
        border-radius: inherit;
        }
        .dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        /*blur effect*/
        backdrop-filter: blur(4px);
        }
        .dialog-overlay.visible {
        opacity: 1;
        visibility: visible;
        }
        .dialog-content {
        transform: scale(0.95);
        transition: transform 0.3s ease;
        max-height: 90dvh;
        overflow-y: auto;
        background: inherit;
        background-color: inherit;
        color: inherit;
        border-radius: inherit;
        border-radius: 16px;
        padding: inherit;
        margin: inherit;
        padding: 8px;
        }
        .dialog-overlay.visible .dialog-content {
        transform: scale(1);
        }
        .header .avatar {
            grid-area: avatar;
            width: 64px;
            height: 64px;
            background: var(--bg-dark-accent-light);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .header .username {
            align-self: center;
            grid-area: username;
            font-size: 16pt;
            font-weight: 600;
        }

        .header .email {
            align-self: center;
            grid-area: email;
            font-size: 12pt;
            font-weight: 400;
        }

    `;
    }

    updateVisibility() {
    const overlay = this.shadowRoot.querySelector('.dialog-overlay');
    if (overlay) {
        if (this._isVisible) {
        overlay.classList.add('visible');
        } else {
        overlay.classList.remove('visible');
        }
    }
    }

    render() {
    const content = `
        <style>
        ${this.createStyles()}
        </style>
        <div class="dialog-overlay ${this._isVisible ? 'visible' : ''}">
        <div class="dialog-content">
            <slot></slot>
        </div>
        </div>
    `;
    
    this.shadowRoot.innerHTML = content;

    // Agregar evento para cerrar al hacer clic fuera
    const overlay = this.shadowRoot.querySelector('.dialog-overlay');
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay && !this.hasAttribute('required')) {
        this.hide();
        }
    });
    }
}
customElements.define('dialog-container', DialogContainer);
if (!customElements.get('custom-input')) {
    class CustomInput extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({ mode: 'open', delegatesFocus: true });
        this.handleInputChange = this.handleInputChange.bind(this);
      }
  
      static get observedAttributes() {
        return ['type', 'id', 'name', 'value', 'placeholder', 'disabled', 'readonly', 'darkmode', 'options', 'required', 'title', 'pattern'];
      }
  
      getStyles() {
        const darkMode = this.hasAttribute('darkmode');
  
        return `
          :host {
            display: block;
            margin: inherit;
            color-scheme: light dark;
            margin: 0.5rem;
            padding: 0.5rem;
          }
          
          .input-container {
            display: flex;
            flex-direction: column;
            padding: inherit;
          }
          
          input, textarea, select {
            padding: inherit;
            padding: 0.5rem;  /* Valor de respaldo si no se hereda */
            border: inherit;
            border-color: ${darkMode ? '#555' : '#ccc'};
            border-radius: 4px;
            font-size: 14px;
            background-color: inherit;
            color: inherit;
          }
          textarea {
            resize: vertical;
            min-height: 100px;
          }
          input:disabled, textarea:disabled, select:disabled {
            background-color: ${darkMode ? '#222' : '#f5f5f5'};
            cursor: not-allowed;
            color: ${darkMode ? '#666' : '#888'};
          }
          
          .switch {
            position: relative;
            display: inline-block;
            width: 60px;
            height: 30px;
          }
          
          .switch input {
            opacity: 0;
            width: 0;
            height: 0;
          }
          
          .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: ${darkMode ? '#555' : '#ccc'};
            transition: .4s;
            border-radius: 34px;
          }
          
          .slider:before {
            position: absolute;
            content: "";
            height: 22px;
            width: 22px;
            left: 4px;
            bottom: 4px;
            background-color: ${darkMode ? '#888' : 'white'};
            transition: .4s;
            border-radius: 50%;
          }
          
          input:checked + .slider {
            background-color: #2196F3;
          }
          
          input:checked + .slider:before {
            transform: translateX(28px);
          }
          
          input:focus, textarea:focus, select:focus {
            outline: none;
            border-color: #2196F3;
            box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
          }
        `;
      }
  
      connectedCallback() {
        this.render();
        
        // Check if this is a radio button group
        if (this.getAttribute('type') === 'radio') {
          // For radio buttons, we need to attach listeners to all radio inputs
          const radioInputs = this.shadowRoot.querySelectorAll('input[type="radio"]');
          radioInputs.forEach(radio => {
            radio.addEventListener('change', this.handleInputChange);
          });
        } else {
          // For other input types, attach to the single input element
          const input = this.shadowRoot.querySelector('input, textarea, select');
          if (input) {
            input.addEventListener('input', this.handleInputChange);
            input.addEventListener('change', this.handleInputChange);
          }
        }
        
        // Corregimos el manejo del evento submit
        const form = this.shadowRoot.querySelectorAll('form');
        if (form) {
          form.forEach(form => {
            form.addEventListener('submit', (e) => {
              const data = this.getInputValues();
              this.handleSubmit(e,data);
            });
          });
        }
      }
    
      disconnectedCallback() {
        // Check if this is a radio button group
        if (this.getAttribute('type') === 'radio') {
          // For radio buttons, we need to remove listeners from all radio inputs
          const radioInputs = this.shadowRoot.querySelectorAll('input[type="radio"]');
          radioInputs.forEach(radio => {
            radio.removeEventListener('change', this.handleInputChange);
          });
        } else {
          // For other input types, remove from the single input element
          const input = this.shadowRoot.querySelector('input, textarea, select');
          if (input) {
            input.removeEventListener('input', this.handleInputChange);
            input.removeEventListener('change', this.handleInputChange);
          }
        }
        
        // Limpiamos el evento submit
        const form = this.shadowRoot.querySelector('.validate-form');
      }
  
      handleInputChange(event) {
        const value = this.getInputValues();
        this.dispatchEvent(new CustomEvent('change', {
          detail: {
            id: this.getAttribute('id'),
            name: this.getAttribute('name'),
            value: value
          },
          bubbles: true,
          composed: true
        }));
      }
  
      attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
          this.render();
        }
      }
      handleSubmit(e,data = null) {
        e.preventDefault(); // Prevenimos la recarga de la página
        
        // Validamos el formulario
        const form = e.target;
        const isValid = form.checkValidity();
        if (isValid) {
          // Disparamos un evento personalizado con los datos del formulario
          this.dispatchEvent(new CustomEvent('form-submit', {
            detail: {
              id: this.getAttribute('id'),
              name: this.getAttribute('name'),
              value: data
            },
            bubbles: true,
            composed: true
          }));
        }
      }
      render() {
        const type = this.getAttribute('type') || 'text';
        const id = this.getAttribute('id');
        const name = this.getAttribute('name');
        const value = this.getAttribute('value') || '';
        const placeholder = this.getAttribute('placeholder') || '';
        const disabled = this.hasAttribute('disabled');
        const readonly = this.hasAttribute('readonly');
        const options = this.getAttribute('options') || '[]';
        const required = this.hasAttribute('required') ? 'required' : '';
        const title = this.getAttribute('title') || '';
        const pattern = this.getAttribute('pattern') || '';
        const allarguments = { type, id, name, value, placeholder, disabled, readonly, options, required, title, pattern };
        this.shadowRoot.innerHTML = `
          <style>${this.getStyles()}</style>
          <form class="validate-form">
            <div class="input-container">
              ${this.renderInput(allarguments)}
            </div>
          </form>
        `;
  
        // Reattach event listeners after rendering
        if (type === 'radio') {
          // For radio buttons, attach listeners to all radio inputs
          const radioInputs = this.shadowRoot.querySelectorAll('input[type="radio"]');
          radioInputs.forEach(radio => {
            radio.addEventListener('change', this.handleInputChange);
          });
        } else {
          // For other input types, attach to the single input element
          const input = this.shadowRoot.querySelector('input, textarea, select');
          if (input) {
            input.addEventListener('input', this.handleInputChange);
            input.addEventListener('change', this.handleInputChange);
          }
        }
      }
  
      renderInput(allarguments) {
        const { type, id, name, value, placeholder, disabled, readonly, options, required, title, pattern } = allarguments;
        const requiredAttr = required ? 'required' : ''; // This will output just 'required' when needed
        
        switch (type) {
          case 'textarea':
            return `
              <textarea
                id="${id}"
                name="${name}"
                placeholder="${placeholder}"
                ${disabled ? 'disabled' : ''}
                ${readonly ? 'readonly' : ''}
                ${requiredAttr}
                  ${title ? `title="${title}" oninvalid="this.setCustomValidity('${title}')" oninput="this.setCustomValidity('')"` : ''}
                  ${pattern ? `pattern="${pattern}"` : ''}
              >${value}</textarea>
            `;
          
          case 'checkbox':
          case 'switch':
          case 'boolean':
            return `
              <label class="switch">
                <input
                  type="checkbox"
                  id="${id}"
                  name="${name}"
                  ${value === 'true' ? 'checked' : ''}
                  ${disabled ? 'disabled' : ''}
                  ${readonly ? 'readonly' : ''}
                  ${requiredAttr}
                  ${title ? `title="${title}" oninvalid="this.setCustomValidity('${title}')" oninput="this.setCustomValidity('')"` : ''}
                  ${pattern ? `pattern="${pattern}"` : ''}
                >
                <span class="slider"></span>
              </label>
            `;
          
          case 'select':
            const optionsArray = JSON.parse(options);
            return `
              <select
                id="${id}"
                name="${name}"
                ${disabled ? 'disabled' : ''}
                ${readonly ? 'readonly' : ''}
                ${required ? 'required' : ''}
                  ${title ? `title="${title}" oninvalid="this.setCustomValidity('${title}')" oninput="this.setCustomValidity('')"` : ''}
                  ${pattern ? `pattern="${pattern}"` : ''}
              >
                ${optionsArray.map(option => `
                  <option value="${option.value}" ${option.value === value ? 'selected' : ''}>
                    ${option.image ? `<img src="${option.image}" alt="${option.label}" style="vertical-align: middle; margin-right: 5px;">` : ''}
                    ${option.label}
                  </option>
                `).join('')}
              </select>
            `;
          
          case 'radio':
            const radioOptions = safeParse(options);
            return radioOptions.map(option => `
              <label>
                <input
                  type="radio"
                  id="${id}"
                  name="${name}"
                  value="${option.value}"
                  ${option.value === value ? 'checked' : ''}
                  ${disabled ? 'disabled' : ''}
                  ${readonly ? 'readonly' : ''}
                >
                ${option.label}
              </label>
            `).join('');
              
            default:
              return `
                <input
                  type="${type === 'string' ? 'text' : type}"
                  id="${id}"
                  name="${name}"
                  value="${value}"
                  placeholder="${placeholder}"
                  ${disabled ? 'disabled' : ''}
                  ${readonly ? 'readonly' : ''}
                  ${requiredAttr}
                  ${title ? `title="${title}" oninvalid="this.setCustomValidity('${title}')" oninput="this.setCustomValidity('')"` : ''}
                  ${pattern ? `pattern="${pattern}"` : ''}
                >
              `;
          
        }
      }
  
      getInputValues() {
        // Special handling for radio button groups
        if (this.getAttribute('type') === 'radio') {
          const name = this.getAttribute('name');
          const selectedRadio = this.shadowRoot.querySelector(`input[name="${name}"]:checked`);
          return selectedRadio ? selectedRadio.value : null;
        }
        
        const input = this.shadowRoot.querySelector('input, textarea, select');
        if (!input) return null;
      
        if (input.type === 'checkbox') {
          return input.checked;
        }
        
        if (input.tagName.toLowerCase() === 'textarea') {
          const value = input.value.trim();
          return value ? value.split('\n') : [];
        }
      
        if (input.tagName.toLowerCase() === 'select') {
          return input.value;
        }
      
        const inputvalue = this.parseValueByType(input);
        const validate_form = this.shadowRoot.querySelectorAll('form');
        if (validate_form) {
          validate_form.forEach(form => {
            const form_validity = form.reportValidity();
            if (!form_validity) {
              form.classList.add('invalid');
            } else {
              form.classList.remove('invalid');
            }
        //console.log("form_validity", form_validity);
          });
        }

        return inputvalue;
      }
      getvalidation(){
        let isValid = false;
        const validate_form = this.shadowRoot.querySelectorAll('form');
        if (validate_form) {
          validate_form.forEach(form => {
            const form_validity = form.reportValidity();
            if (!form_validity) {
              isValid = false;
            } else {
              isValid = true;
            }
         // console.log("form_validity", form_validity);
          });
        }
        return isValid;
      }
      parseValueByType(input) {
        const valueType = typeof input.value;
        const inputType = input.type;
        const value = input.value;
        switch (inputType) {
          case 'number':
            const num = input.value ? Number(input.value) : null;
            return num
          case 'text':
          case 'string':
            return value;
          default:
            return value;
        }
      }
  
      setInputValues(value) {
        // Special handling for radio button groups
        if (this.getAttribute('type') === 'radio') {
          const name = this.getAttribute('name');
          const radioToSelect = this.shadowRoot.querySelector(`input[name="${name}"][value="${value}"]`);
          if (radioToSelect) {
            radioToSelect.checked = true;
            // Dispatch event when setting values programmatically
            this.handleInputChange();
          }
          return;
        }
        
        const input = this.shadowRoot.querySelector('input, textarea, select');
        if (!input) return;
      
        if (input.type === 'checkbox') {
          input.checked = Boolean(value);
        } else if (Array.isArray(value) && input.tagName.toLowerCase() === 'textarea') {
          input.value = value.join('\n');
        } else if (input.tagName.toLowerCase() === 'select') {
          input.value = value;
        } else {
          input.value = value;
        }
      
        // Dispatch event when setting values programmatically
        this.handleInputChange();
      }
  
      resetInputValues() {
        // Special handling for radio button groups
        if (this.getAttribute('type') === 'radio') {
          const radioInputs = this.shadowRoot.querySelectorAll('input[type="radio"]');
          radioInputs.forEach(radio => {
            radio.checked = false;
          });
          // Dispatch event when resetting values
          this.handleInputChange();
          return;
        }
        
        const input = this.shadowRoot.querySelector('input, textarea, select');
        if (!input) return;
  
        if (input.type === 'checkbox') {
          input.checked = false;
        } else {
          input.value = '';
        }
  
        // Dispatch event when resetting values
        this.handleInputChange();
      }
  
      setOptions(options) {
        if (this.getAttribute('type') === 'select') {
          this.setAttribute('options', JSON.stringify(options));
          this.render();
        }
      }
  
      getSelectedOption() {
        if (this.getAttribute('type') === 'select') {
          const select = this.shadowRoot.querySelector('select');
          return select ? select.value : null;
        }
        return null;
      }
    }
  
    customElements.define('custom-input', CustomInput);
  }
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

// Ejemplo de prueba:
/* console.log(safeParse("[{value: '123', label: '123'}, {value: '1234', label: '1234'}]"));

console.log(safeParse('{"key": "value"}')); // Devuelve un objeto
console.log(safeParse('not a json')); // Devuelve el string original
console.log(safeParse(42)); // Devuelve 42 (número)
console.log(safeParse({ key: "value" })); // Devuelve el objeto original */
