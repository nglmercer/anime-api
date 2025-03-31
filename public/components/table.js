class ObjectTable extends HTMLElement {

    constructor() {
        super(); // Llama siempre al constructor de la clase padre primero

        // Datos internos
        this._data = [];
        this._keys = [];
        this._customActions = []; // Array para almacenar definiciones de acciones personalizadas

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
        // Añadimos un estilo genérico por si no se especifica clase
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
                /* Poner primera letra en mayúscula (siempre que no sea todo mayúsculas) */
                text-transform: capitalize;
            }
            tr:hover {
                 background-color: rgb(1, 1, 1);
            }
            button {
                padding: 5px 10px;
                margin-right: 5px;
                cursor: pointer;
                border: 1px solid #ccc;
                border-radius: 3px;
            }
            button:hover {
                filter: brightness(55%);
            }
            button.edit-btn {
                background-color: #CCE5FF; /* Azul claro */
                border-color: #b8daff;
                color: #004085;
            }
            button.delete-btn {
                background-color: #F8D7DA; /* Rojo claro */
                color: #721c24;
                border-color: #f5c6cb;
            }
            /* Puedes añadir aquí estilos para clases de botones personalizados si quieres */
            /* .mi-clase-personalizada { ... } */

            .actions-cell {
                white-space: nowrap; /* Evita que los botones se separen en líneas */
                width: 1%; /* Intenta darle el mínimo ancho necesario */
                text-align: center; /* Centrar botones en la celda */
            }
        `;
    }

    // --- MÉTODOS PÚBLICOS ---

    /**
     * Establece los datos y las claves de la tabla, y la renderiza.
     * @param {Array<Object>} data - Array de objetos a mostrar.
     * @param {Array<string>} keys - Array de strings con las claves a mostrar y su orden.
     */
    setData(data = [], keys = []) {
        if (!Array.isArray(data) || !Array.isArray(keys)) {
            console.error('ObjectTable: data y keys deben ser arrays.');
            this._data = [];
            this._keys = [];
        } else {
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
     * Define una acción personalizada que se mostrará como un botón en cada fila.
     * Llama a este método ANTES de llamar a setData o render para que se incluya.
     * @param {string} actionName - El identificador único de la acción (usado en dataset.action y nombre del evento).
     * @param {string} buttonLabel - El texto que mostrará el botón.
     * @param {string} [cssClass=''] - Una clase CSS opcional para aplicar al botón.
     */
    addAction(actionName, buttonLabel, cssClass = '') {
        if (typeof actionName !== 'string' || !actionName) {
            console.error('ObjectTable: actionName debe ser un string no vacío.');
            return;
        }
        if (typeof buttonLabel !== 'string') {
            console.error('ObjectTable: buttonLabel debe ser un string.');
            return;
        }
        // Evitar añadir la misma acción múltiples veces (opcional)
        if (this._customActions.some(action => action.name === actionName)) {
             console.warn(`ObjectTable: La acción "${actionName}" ya ha sido añadida.`);
             return;
        }
        // Añadir definición de la acción
        this._customActions.push({
            name: actionName,
            label: buttonLabel,
            className: cssClass || '' // Asegurar que sea string
        });
        // Opcional: Re-renderizar si ya hay datos
        // if (this._data.length > 0) {
        //     this.render();
        // }
    }

    /**
     * Renderiza la tabla completa basada en los datos y claves actuales.
     */
    render() {
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
            th.textContent = key;
            headerRow.appendChild(th);
        });
        const thActions = document.createElement('th');
        thActions.textContent = 'Acciones';
        headerRow.appendChild(thActions);
        thead.appendChild(headerRow);

        // --- Crear Cuerpo (tbody) ---
        this._data.forEach((item, index) => {
            const tr = document.createElement('tr');
            tr._dataItem = item;

            this._keys.forEach(key => {
                const td = document.createElement('td');
                td.textContent = (item[key] !== undefined && item[key] !== null) ? item[key] : '';
                tr.appendChild(td);
            });

            // Crear celda de acciones
            const tdActions = document.createElement('td');
            tdActions.classList.add('actions-cell');

            // Botón Editar (estándar)
            const editButton = document.createElement('button');
            editButton.textContent = 'Editar';
            editButton.classList.add('edit-btn');
            editButton.dataset.action = 'edit'; // Acción especial para evento 'edit-item'
            tdActions.appendChild(editButton);

            // Botón Eliminar (estándar)
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Eliminar';
            deleteButton.classList.add('delete-btn');
            deleteButton.dataset.action = 'delete'; // Acción especial para evento 'delete-item'
            tdActions.appendChild(deleteButton);

            // *** Añadir botones de acciones personalizadas ***
            this._customActions.forEach(actionDef => {
                const customButton = document.createElement('button');
                customButton.textContent = actionDef.label;
                customButton.dataset.action = actionDef.name; // Usar el nombre de la acción
                if (actionDef.className) {
                    customButton.classList.add(...actionDef.className.split(' ').filter(Boolean)); // Añadir clases CSS (soporta múltiples separadas por espacio)
                }
                tdActions.appendChild(customButton);
            });

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

        if (clickedElement.tagName === 'BUTTON' && clickedElement.dataset.action) {
            const action = clickedElement.dataset.action;
            const row = clickedElement.closest('tr');

            if (row && row._dataItem) {
                const itemData = row._dataItem;

                // Determinar el nombre del evento
                let eventName;
                if (action === 'edit') {
                    eventName = 'edit-item'; // Evento específico para editar
                } else if (action === 'delete') {
                    eventName = 'delete-item'; // Evento específico para borrar
                } else {
                    eventName = action; // Usar el nombre de la acción directamente como nombre del evento
                }

                // Emitir el evento apropiado
                this.dispatchEvent(new CustomEvent(eventName, {
                    detail: itemData, // El objeto completo va en 'detail'
                    bubbles: true,    // Permite que el evento suba por el DOM
                    composed: true    // Permite que el evento cruce los límites del Shadow DOM
                }));

                 // NOTA IMPORTANTE sobre 'delete-item':
                 // El componente NO elimina la fila por sí mismo al recibir 'delete'.
                 // La lógica externa que escucha 'delete-item' debe actualizar la fuente
                 // de datos y luego llamar a setData() en este componente para reflejar
                 // el cambio visualmente. Lo mismo aplica a cualquier otra acción
                 // que modifique los datos.

            } else if (row) {
                 console.warn("ObjectTable: Botón de acción clickeado pero no se encontró _dataItem en la fila.", row);
            }
        }
    }

    // --- CICLO DE VIDA ---

    connectedCallback() {
        if (!this.shadowRoot.contains(this._tableContainer)) {
             this.shadowRoot.appendChild(this._tableContainer);
        }
        if(this._data.length === 0 && this._keys.length === 0 && this.isConnected){
             this.render(); // Render inicial si no hay datos
        }
    }

    disconnectedCallback() {
        // Limpieza automática por usar event listener en el shadow root
    }

}

// Definir el custom element
customElements.define('object-table', ObjectTable);