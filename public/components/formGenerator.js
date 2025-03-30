
class FormGenerator {
  /**
   * Create a new form generator
   * @param {Object} config - Configuration for the form
   * @param {string} config.formId - ID for the form container
   * @param {string} config.modalId - ID for the modal container
   * @param {Array} config.fields - Array of field configurations
   * @param {Object} config.validation - Validation rules for fields
   */
  constructor(config) {
    this.config = config;
    this.formId = config.formId;
    this.modalId = config.modalId;
    this.fields = config.fields;
    this.validation = config.validation || {};
    this.dbStore = null;
    this.formElements = {};
    this.savecallback = config.savecallback;
  }


  /**
   * Generate the HTML for the form
   * @returns {string} HTML string for the form
   */
  generateFormHTML() {
    let html = `
    <div class="form ${this.formId}" id="form_${this.formId}">
    `;

    // Generate HTML for each field
    this.fields.forEach(field => {
      html += `
      <div class="row" id="${field.id}_container">
        <span id="${field.id}-label" lang="en">${field.label}</span>
        <custom-input
          type="${field.type}"
          id="${field.id}"
          name="${field.id}"
          placeholder="${field.placeholder || ''}"
          ${field.options ? `options='${field.options}'` : ''}
          ${field.value ? `value="${field.value}"` : ''}
          ${field.required ? 'required' : ''}
        ></custom-input>
      </div>
      `;

      // Initial display state for conditional fields
      if (field.conditionalDisplay) {
        const { parentField, parentValue, displayWhen } = field.conditionalDisplay;
        // We'll handle the actual display logic in setupEventListeners()
      }
    });

    // Add hidden ID field
    html += `
      <custom-input
        type="number"
        id="form_id"
        name="form_id"
      ></custom-input>
    </div>
    `;

    return html;
  }

  /**
   * Generate the modal HTML with the form inside
   * @returns {string} HTML string for the modal
   */
  generateModalHTML() {
    return `
    <dialog-container id="${this.modalId}" style="padding: 4px; margin: 4px;">
      ${this.generateFormHTML()}
      <custom-dialog id="${this.modalId}_dialog"
        style="border: 0px solid red;"
        theme="dark">
      </custom-dialog>
    </dialog-container>
    `;
  }

  /**
   * Initialize the form with event listeners and database connection
   * @param {string} containerId - ID of the container element to inject the form
   */
  async init(containerId) {
    // Get the container element
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container element with ID ${containerId} not found`);
      return;
    } /* else {
      console.log(`Container element with ID ${containerId} found`);
    } */
    
    // Generate and inject the modal HTML
    container.innerHTML = this.generateModalHTML();
    
    
    // Setup UI elements
    this.setupUI();
    
    // Setup event listeners
    this.setupEventListeners();

  }

  /**
   * Setup UI elements and references
   */
  setupUI() {
    // Get modal elements
    this.modal = document.querySelector(`#${this.modalId}`);
    console.log(this.modal);
    this.modal.show();
    
    this.modalDialog = document.querySelector(`#${this.modalId}_dialog`);
    
    // Setup dialog options
    this.modalDialog.options = [
      {
        label: 'Save',
        class: 'btn btn-sm btn-outlined save-btn',
        callback: () => this.handleSave()
      },
      {
        label: 'Cancel',
        class: 'btn btn-sm btn-outlined save-btn',
        callback: () => this.handleCancel()
      }
    ];
    
    // Get form elements
    this.formElements = {};
    this.fields.forEach(field => {
      this.formElements[field.id] = document.querySelector(`#${field.id}`);
    });
    
    // Get form ID element
    this.formIdElement = document.querySelector('#form_id');
  }

  /**
   * Setup event listeners for form elements
   */
  setupEventListeners() {
    // Setup conditional display listeners
    this.fields
      .filter(field => field.conditionalDisplay)
      .forEach(field => {
        const { parentField, parentValue, displayWhen } = field.conditionalDisplay;
        const parentElement = document.querySelector(`#${parentField}`);
        const fieldContainer = document.querySelector(`#${field.id}_container`);
        
        // Set initial display state
        this.updateFieldVisibility(parentElement, fieldContainer, parentValue, displayWhen);
        
        // Add change event listener
        parentElement.addEventListener('change', (e) => {
          this.updateFieldVisibility(parentElement, fieldContainer, parentValue, displayWhen);
        });
      });
  }

  /**
   * Update field visibility based on parent field value
   * @param {HTMLElement} parentElement - The parent field element
   * @param {HTMLElement} fieldContainer - The field container element
   * @param {string} parentValue - The parent value to check against
   * @param {string} displayWhen - When to display the field ('equal' or 'notEqual')
   */
  updateFieldVisibility(parentElement, fieldContainer, parentValue, displayWhen) {
    const currentValue = parentElement.getInputValues();
    const shouldDisplay = displayWhen === 'notEqual' 
      ? currentValue !== parentValue 
      : currentValue === parentValue;
    
    fieldContainer.style.display = shouldDisplay ? 'block' : 'none';
  }

  /**
   * Handle save button click
   */
  handleSave() {
    this.savecallback();
    this.modal.hide();
  }

  /**
   * Handle cancel button click
   */
  handleCancel() {
    console.log('Cancel clicked');
    // format all form elements
    Object.keys(this.formElements).forEach(key => {
      this.formElements[key].resetInputValues();
    });
    this.modal.hide(); // Uncomment to hide modal after cancel
  }

  setFormData(data) {
    if (!data) return;
    // Set field values
    this.fields.forEach(field => {
      const key = field.id
      if (data[key] !== undefined) {
        this.formElements[key].setInputValues(data[key]);
      }
    });
    
    // Set form ID
    if (data.id !== undefined) {
      this.formIdElement.setInputValues(data.id);
    }
  }
}

export { FormGenerator };