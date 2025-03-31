class ObjectTable extends HTMLElement {

    constructor() {
        super(); // Llama siempre al constructor de la clase padre primero

        // Datos internos
        this._data = [];
        this._keys = [];

        // Crear Shadow DOM para encapsulación (buena práctica)
        this.attachShadow({ mode: 'open' });

        // Estilos básicos encapsulados
        const style = document.createElement('style');
        style.textContent = this.getStyles()

        // Contenedor para la tabla
        this._tableContainer = document.createElement('div');

        // Añadir estilos y contenedor al Shadow DOM
        this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(this._tableContainer);

        // Añadir listener para manejar clicks en botones (event delegation)
        this._tableContainer.addEventListener('click', this._handleActionClick.bind(this));
    }
    getStyles(){
        return /*css*/ `
            :host {
                display: block; /* Por defecto es inline */
                font-family: sans-serif;
                border: 1px solid #ccc;
                padding: 10px;
                border-radius: 5px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
            }
            th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }
            th {
                text-transform: capitalize; /* Poner primera letra en mayúscula */
            }
            tr:hover {
            }
            button {
                padding: 5px 10px;
                margin-right: 5px;
                cursor: pointer;
                border: 1px solid #ccc;
                border-radius: 3px;
            }
            button.edit-btn {
                background-color: # CCE5FF; /* Azul claro */
                border-color: #b8daff;
            }
            button.delete-btn {
                background-color: #F8D7DA; /* Rojo claro */
                color: #721c24;
                border-color: #f5c6cb;
            }
            .actions-cell {
                white-space: nowrap; /* Evita que los botones se separen en líneas */
                 width: 1%; /* Intenta darle el mínimo ancho necesario */
            }
        `
    }
    // --- MÉTODOS PÚBLICOS ---

    /**
     * Establece los datos y las claves de la tabla, y la renderiza.
     * @param {Array<Object>} data - Array de objetos a mostrar.
     * @param {Array<string>} keys - Array de strings con las claves a mostrar y su orden.
     */
    setData(data = [], keys = []) {
        // Validar entrada básica (opcional pero recomendado)
        if (!Array.isArray(data) || !Array.isArray(keys)) {
            console.error('ObjectTable: data y keys deben ser arrays.');
            this._data = [];
            this._keys = [];
        } else {
            // Clonar para evitar mutaciones externas inesperadas (opcional)
            this._data = [...data];
            this._keys = [...keys];
        }
        this.render();
    }

    /**
     * Añade un nuevo item (objeto) a los datos existentes y re-renderiza.
     * @param {Object} item - El objeto a añadir.
     */
    addItem(item) {
        if (item && typeof item === 'object') {
            this._data.push(item);
            this.render(); // Re-renderizar para mostrar el nuevo item
        } else {
            console.error('ObjectTable: El item a añadir debe ser un objeto.', item);
        }
    }

    /**
     * Renderiza la tabla completa basada en los datos y claves actuales.
     */
    render() {
        // Limpiar contenido anterior
        this._tableContainer.innerHTML = '';

        if (!this._data || this._data.length === 0 || !this._keys || this._keys.length === 0) {
            this._tableContainer.textContent = 'No hay datos o claves para mostrar.';
            return;
        }

        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        // --- Crear Cabecera (thead) ---
        const headerRow = document.createElement('tr');
        this._keys.forEach(key => {
            const th = document.createElement('th');
            th.textContent = key; // Usar la clave como texto de cabecera
            headerRow.appendChild(th);
        });
        // Añadir cabecera para columna de acciones
        const thActions = document.createElement('th');
        thActions.textContent = 'Acciones';
        headerRow.appendChild(thActions);
        thead.appendChild(headerRow);

        // --- Crear Cuerpo (tbody) ---
        this._data.forEach((item, index) => {
            const tr = document.createElement('tr');

            // Guardar referencia al objeto completo en la fila (muy importante para los eventos)
            // Usamos un símbolo o una propiedad no estándar para evitar colisiones
            tr._dataItem = item;
            // Alternativa: usar data-attributes si prefieres (requeriría JSON.stringify/parse)
            // tr.dataset.itemIndex = index; // Podría ser útil si necesitas el índice

            // Crear celdas de datos según las keys
            this._keys.forEach(key => {
                const td = document.createElement('td');
                // Acceder al valor, mostrar '' si es undefined o null
                td.textContent = (item[key] !== undefined && item[key] !== null) ? item[key] : '';
                tr.appendChild(td);
            });

            // Crear celda de acciones
            const tdActions = document.createElement('td');
            tdActions.classList.add('actions-cell'); // Añadir clase para estilos

            const editButton = document.createElement('button');
            editButton.textContent = 'Editar';
            editButton.classList.add('edit-btn');
            editButton.dataset.action = 'edit'; // Identificador para el handler

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Eliminar';
            deleteButton.classList.add('delete-btn');
            deleteButton.dataset.action = 'delete'; // Identificador para el handler

            tdActions.appendChild(editButton);
            tdActions.appendChild(deleteButton);
            tr.appendChild(tdActions);

            tbody.appendChild(tr);
        });

        table.appendChild(thead);
        table.appendChild(tbody);
        this._tableContainer.appendChild(table);
    }

    // --- MANEJADOR DE EVENTOS INTERNO ---

    /**
     * Maneja los clicks dentro del contenedor de la tabla (delegación de eventos).
     * @param {Event} event - El objeto del evento click.
     */
    _handleActionClick(event) {
        const clickedElement = event.target;

        // Verificar si el click fue en un botón de acción
        if (clickedElement.tagName === 'BUTTON' && clickedElement.dataset.action) {
            const action = clickedElement.dataset.action;
            // Encontrar la fila (tr) padre más cercana
            const row = clickedElement.closest('tr');

            if (row && row._dataItem) {
                const itemData = row._dataItem; // Obtener el objeto asociado a la fila

                if (action === 'edit') {
                    // Emitir evento 'edit-item' con el objeto completo
                    this.dispatchEvent(new CustomEvent('edit-item', {
                        detail: itemData, // El objeto completo va en 'detail'
                        bubbles: true, // Permite que el evento suba por el DOM
                        composed: true // Permite que el evento cruce los límites del Shadow DOM
                    }));
                } else if (action === 'delete') {
                    // Emitir evento 'delete-item' con el objeto completo
                    this.dispatchEvent(new CustomEvent('delete-item', {
                        detail: itemData,
                        bubbles: true,
                        composed: true
                    }));
                    // NOTA: El componente NO elimina la fila por sí mismo.
                    // La lógica que escucha el evento 'delete-item' debe
                    // actualizar la fuente de datos y luego llamar a setData()
                    // en este componente para reflejar el cambio.
                }
            } else {
                this.dispatchEvent(new CustomEvent(action, {
                    detail: itemData,
                    bubbles: true,
                    composed: true
                }));
            }
        }
    }

    // --- CICLO DE VIDA (Opcional pero útil) ---

    connectedCallback() {
        // Se llama cuando el elemento se añade al DOM.
        // Podrías hacer una renderización inicial aquí si los datos
        // se pasaran por atributos (aunque para arrays/objetos es mejor usar métodos).
        // console.log('ObjectTable conectado al DOM');
        // Podríamos llamar a this.render() aquí si tuviéramos datos iniciales
        // de alguna otra forma (ej: atributos parseados).
        if (!this.shadowRoot.contains(this._tableContainer)) {
             // Asegurarse que todo esté en el shadowRoot si algo falla en el constructor
             this.shadowRoot.appendChild(this._tableContainer);
        }
         // Render inicial si no hay datos (mostrará mensaje por defecto)
         if(this._data.length === 0 && this._keys.length === 0){
             this.render();
         }
    }

    disconnectedCallback() {
        // Se llama cuando el elemento se elimina del DOM.
        // Bueno para limpiar listeners si no se usó event delegation en el shadowRoot.
        // En este caso, el listener está en _tableContainer DENTRO del shadowRoot,
        // por lo que se limpiará automáticamente al quitar el elemento.
        // console.log('ObjectTable desconectado del DOM');
    }

    // Podrías observar atributos si quisieras configurar keys/data iniciales vía HTML,
    // pero es más complejo para arrays/objetos.
    // static get observedAttributes() { return ['keys-json', 'data-json']; }
    // attributeChangedCallback(name, oldValue, newValue) { ... }
}

// Definir el custom element para que el navegador lo reconozca
customElements.define('object-table', ObjectTable);