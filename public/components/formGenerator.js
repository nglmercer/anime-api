class FrmGen {
  constructor(cfg) {
    if (!cfg || !cfg.modalId || !cfg.fields || !Array.isArray(cfg.fields)) {
      throw new Error("FrmGen cfg requires 'modalId' and 'fields' array.");
    }

    this.cfg = cfg;
    this.mId = cfg.modalId;
    this.flds = cfg.fields;
    // Naming consistency: Use 'saveCallback'
    this.svCb = typeof cfg.saveCallback === 'function' ? cfg.saveCallback : (fData) => {
      console.warn("No saveCallback provided. Form data:", fData);
    };
    this.cnclCb = typeof cfg.cancelCallback === 'function' ? cfg.cancelCallback : () => {
      console.log("Cancel action triggered.");
      this.hide(); // Default cancel action hides the modal
    };

    this.mdl = null;
    this.dlg = null;
    this.fElems = {}; // Stores references to c-inp elements

    this._hSv = this._hSv.bind(this);
    this._hCncl = this._hCncl.bind(this);
  }

  init(cId) {
    // ... (rest of init method remains largely the same)

    this.mdl = document.createElement('dlg-cont');
    this.mdl.id = this.mId;
    if (this.cfg.required) {
      this.mdl.setAttribute('required', '');
    }

    this.dlg = document.createElement('c-dlg');
    this.dlg.setAttribute('title', this.cfg.title || 'Formulario'); // Use Spanish?
    if (this.cfg.description) {
      this.dlg.setAttribute('description', this.cfg.description);
    }
    const th = this.cfg.theme || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    this.dlg.setAttribute('theme', th);

    this.flds.forEach(f => {
      if (!f.id) {
        console.warn("Form field skipped: Missing 'id'.", f);
        return;
      }
      const inpEl = document.createElement('c-inp');
      inpEl.setAttribute('id', f.id); // Use field id as element id
      inpEl.setAttribute('type', f.type || 'text');
      // Use 'name' for form submission semantics, 'id' for retrieval key
      inpEl.setAttribute('name', f.name || f.id);
      // Placeholder, value, required, disabled, readonly, pattern, title
      if (f.placeholder) inpEl.setAttribute('placeholder', f.placeholder);
      if (f.value !== undefined) inpEl.setAttribute('value', String(f.value)); // Ensure string value for attribute
      if (f.required) inpEl.setAttribute('required', '');
      if (f.disabled) inpEl.setAttribute('disabled', '');
      if (f.readonly) inpEl.setAttribute('readonly', '');
      if (f.pattern) inpEl.setAttribute('pattern', f.pattern);
      if (f.title) inpEl.setAttribute('title', f.title); // For validation message
      if (th === 'dark') inpEl.setAttribute('darkmode', ''); // Pass theme to input

      if ((f.type === 'select' || f.type === 'radio') && f.options) {
        // Ensure options are stringified correctly
        const optsString = typeof f.options === 'string' ? f.options : JSON.stringify(f.options);
        inpEl.setAttribute('options', optsString);
      }

      this.fElems[f.id] = inpEl; // Store reference using field id
      this.dlg.appendChild(inpEl);
    });

    // Button options (ensure consistency)
    this.dlg.options = [
      // Add cancel button first if desired
      {
        label: this.cfg.cancelLabel || 'Cancelar',
        class: 'cancel-btn',
        callback: this._hCncl // Use bound cancel handler
      },
      {
        label: this.cfg.saveLabel || 'Guardar',
        class: 'save-btn',
        callback: this._hSv // Use bound save handler
      }
      // Add other buttons like delete if needed in config
    ];


    this.mdl.appendChild(this.dlg);
    const container = document.getElementById(cId);
    if (!container) {
      console.error(`FrmGen init failed: Container with id "${cId}" not found.`);
      return;
    }
    container.appendChild(this.mdl);

    // Apply theme class to the modal container itself if needed for backdrop styling etc.
    // this.mdl.classList.add(th); // Already handled by theme inheritance? Check dlg-cont styles
  }

  _hSv() {
    let isValid = true;
    const fData = {}; // Object to hold form data

    // Iterate through the fields defined in the config
    this.flds.forEach(f => {
      const el = this.fElems[f.id]; // Get the c-inp element reference
      if (el) {
        // Use the isValid method from c-inp
        if (typeof el.isValid === 'function' && !el.isValid()) {
          console.log(`Validation failed for field: ${f.id}`);
          isValid = false;
        }
        // Use getVal method from c-inp, using field.id as the key
        fData[f.id] = typeof el.getVal === 'function' ? el.getVal() : null;
      } else {
        console.warn(`Element not found for field id: ${f.id}`);
      }
    });

    if (isValid) {
      console.log('Form is valid. Data collected by FrmGen:', fData);
      // Pass the collected data directly to the callback
      this.svCb(fData);
      // Optionally hide the modal after successful save callback execution?
      // Depends on whether the callback handles hiding. Let's assume it might.
      // this.hide(); // Or let the callback decide.
    } else {
      console.warn('Form validation failed. Please check the highlighted fields.');
      // Optionally shake the modal or provide other feedback
    }
  }

  _hCncl() {
    console.log('Cancel clicked');
    this.cnclCb(); // Execute the cancel callback
    // Default behavior in constructor now hides, but can be overridden by cfg.cancelCallback
  }

  setData(d) {
    if (!d || typeof d !== 'object') {
      console.warn("setData called with invalid data:", d);
      return;
    }
    console.log("FrmGen setData:", d); // Log data being set

    this.flds.forEach(f => {
      const el = this.fElems[f.id];
      if (el) {
        // Check if the key exists in the input data object `d`
        // Use f.id because that's the key we used in fElems and likely in `d`
        if (d.hasOwnProperty(f.id)) {
          const valueToSet = d[f.id];
          console.log(`Setting field ${f.id} with value:`, valueToSet);
          if (typeof el.setVal === 'function') {
            el.setVal(valueToSet);
          } else {
            console.warn(`Element for ${f.id} does not have setVal method.`);
            // Fallback might not work well for all types (like checkbox, radio)
            // el.value = valueToSet;
          }
        } else {
          console.log(`Key ${f.id} not found in setData object.`);
          // Optional: Reset field if key not provided?
          // if (typeof el.reset === 'function') el.reset();
        }
      } else {
        console.warn(`Element not found for field id: ${f.id} during setData.`);
      }
    });
  }

  getData() {
    const fData = {};
    this.flds.forEach(f => {
      const el = this.fElems[f.id];
      if (el) {
        // Use getVal method from c-inp, using field.id as the key
        fData[f.id] = typeof el.getVal === 'function' ? el.getVal() : null;
      }
    });
    console.log("FrmGen getData:", fData);
    return fData;
  }

  reset() {
    this.flds.forEach(f => {
      const el = this.fElems[f.id];
      if (el && typeof el.reset === 'function') {
        el.reset();
      }
    });
    console.log("FrmGen reset completed.");
  }

  show() {
    if (this.mdl && typeof this.mdl.show === 'function') {
      this.mdl.show();
    } else {
      console.error("Cannot show modal: FrmGen not initialized or modal element invalid.");
    }
  }

  hide() {
    if (this.mdl && typeof this.mdl.hide === 'function') {
      this.mdl.hide();
    } else {
      console.error("Cannot hide modal: FrmGen not initialized or modal element invalid.");
    }
  }
}
export { FormGenerator, FrmGen };