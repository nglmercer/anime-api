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
class ObjectCards extends HTMLElement {

    constructor() {
        super();

        // Datos internos
        this._data = [];
        this._keys = [];
        this._customActions = [];
        this._cardLayout = 'flex'; // Por defecto, layout flex (alternativas: 'grid')
        this._cardsPerRow = 3; // Por defecto, 3 cards por fila en modo grid

        // Crear Shadow DOM
        this.attachShadow({ mode: 'open' });

        // Estilos CSS
        const style = document.createElement('style');
        style.textContent = this.getStyles();

        // Contenedor principal para las cards
        this._cardsContainer = document.createElement('div');
        this._cardsContainer.classList.add('cards-container'); 

        // Añadir estilos y contenedor al Shadow DOM
        this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(this._cardsContainer);

        // Añadir listener para manejar clicks en botones (event delegation)
        this._cardsContainer.addEventListener('click', this._handleActionClick.bind(this));
    }

    getStyles() {
        return /*css*/ `
            :host {
                display: block;
                font-family: sans-serif;
                padding: 10px;
                margin-bottom: 15px;
            }

            .cards-container {
                display: flex;
                flex-wrap: wrap;
                gap: 16px;
                justify-content: flex-start;
            }

            .cards-container.grid-layout {
                display: grid;
                grid-template-columns: repeat(var(--cards-per-row, 3), 1fr);
                gap: 16px;
            }

            .card {
                background-color: #fff;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                overflow: hidden;
                transition: transform 0.2s, box-shadow 0.2s;
                flex: 0 0 calc(33.333% - 16px);
                max-width: calc(33.333% - 16px);
                display: flex;
                flex-direction: column;
            }

            .card:hover {
                transform: translateY(-4px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }

            .card-header {
                background-color: #f5f5f5;
                padding: 12px 16px;
                font-weight: bold;
                border-bottom: 1px solid #eee;
            }

            .card-content {
                padding: 16px;
                flex-grow: 1;
            }

            .card-property {
                margin-bottom: 8px;
                display: flex;
                flex-direction: column;
            }

            .property-label {
                font-weight: 500;
                color: #666;
                font-size: 0.85em;
                text-transform: capitalize;
                margin-bottom: 4px;
            }

            .property-value {
                word-break: break-word;
            }

            .card-actions {
                padding: 12px 16px;
                display: flex;
                justify-content: flex-end;
                gap: 8px;
                background-color: #fafafa;
                border-top: 1px solid #eee;
            }

            button {
                padding: 6px 12px;
                cursor: pointer;
                border: 1px solid #ccc;
                border-radius: 4px;
                font-size: 0.9em;
                transition: all 0.2s;
                background-color: #fff;
            }

            button:hover {
                filter: brightness(0.9);
            }

            button.edit-btn {
                background-color: #CCE5FF;
                border-color: #b8daff;
                color: #004085;
            }

            button.delete-btn {
                background-color: #F8D7DA;
                color: #721c24;
                border-color: #f5c6cb;
            }

            .no-data {
                padding: 20px;
                text-align: center;
                color: #666;
                width: 100%;
                background: #f9f9f9;
                border-radius: 8px;
            }

            /* Responsive */
            @media (max-width: 992px) {
                .card {
                    flex: 0 0 calc(50% - 16px);
                    max-width: calc(50% - 16px);
                }
                .cards-container.grid-layout {
                    grid-template-columns: repeat(2, 1fr);
                }
            }

            @media (max-width: 576px) {
                .card {
                    flex: 0 0 100%;
                    max-width: 100%;
                }
                .cards-container.grid-layout {
                    grid-template-columns: 1fr;
                }
            }
        `;
    }

    // --- MÉTODOS PÚBLICOS ---

    setData(data = [], keys = []) {
        if (!Array.isArray(data) || !Array.isArray(keys)) {
            console.error('ObjectCards: data y keys deben ser arrays.');
            this._data = [];
            this._keys = [];
        } else {
            this._data = [...data];
            this._keys = [...keys];
        }
        this.render();
    }

    addItem(item) {
        if (item && typeof item === 'object') {
            this._data.push(item);
            this.render();
        } else {
            console.error('ObjectCards: El item a añadir debe ser un objeto.', item);
        }
    }

    addAction(actionName, buttonLabel, cssClass = '') {
        if (typeof actionName !== 'string' || !actionName) {
            console.error('ObjectCards: actionName debe ser un string no vacío.');
            return;
        }
        if (typeof buttonLabel !== 'string') {
            console.error('ObjectCards: buttonLabel debe ser un string.');
            return;
        }
        if (this._customActions.some(action => action.name === actionName)) {
            console.warn(`ObjectCards: La acción "${actionName}" ya ha sido añadida.`);
            return;
        }
        this._customActions.push({
            name: actionName,
            label: buttonLabel,
            className: cssClass || ''
        });
    }

    setLayout(layout, cardsPerRow = 3) {
        if (layout !== 'flex' && layout !== 'grid') {
            console.warn('ObjectCards: layout debe ser "flex" o "grid". Usando "flex" por defecto.');
            layout = 'flex';
        }
        this._cardLayout = layout;
        this._cardsPerRow = cardsPerRow;
        
        // Actualizar variable CSS para grid
        this.shadowRoot.host.style.setProperty('--cards-per-row', this._cardsPerRow);
        
        // Actualiza clase del contenedor
        if (this._cardsContainer) {
            this._cardsContainer.classList.toggle('grid-layout', layout === 'grid');
        }
        
        // Si ya hay datos, re-renderizar
        if (this._data.length > 0 && this.isConnected) {
            this.render();
        }
    }
    
    setCardHeader(keyField) {
        if (typeof keyField !== 'string') {
            console.error('ObjectCards: keyField debe ser un string.');
            return;
        }
        this._headerKeyField = keyField;
        // Re-renderizar si hay datos
        if (this._data.length > 0 && this.isConnected) {
            this.render();
        }
    }

    // --- RENDER ---

    render() {
        // Limpiar contenedor anterior
        this._cardsContainer.innerHTML = '';
        
        // Aplicar layout
        this._cardsContainer.classList.toggle('grid-layout', this._cardLayout === 'grid');

        if (!this._data || this._data.length === 0 || !this._keys || this._keys.length === 0) {
            const noDataEl = document.createElement('div');
            noDataEl.classList.add('no-data');
            noDataEl.textContent = 'No hay datos para mostrar.';
            this._cardsContainer.appendChild(noDataEl);
            return;
        }

        // Crear cards para cada elemento
        this._data.forEach((item, index) => {
            const card = document.createElement('div');
            card.classList.add('card');
            
            // Header de la card (opcional)
            if (this._headerKeyField && item[this._headerKeyField] !== undefined) {
                const cardHeader = document.createElement('div');
                cardHeader.classList.add('card-header');
                cardHeader.textContent = item[this._headerKeyField];
                card.appendChild(cardHeader);
            }
            
            // Contenido principal
            const cardContent = document.createElement('div');
            cardContent.classList.add('card-content');
            
            // Propiedades según las keys definidas
            this._keys.forEach(key => {
                // Saltamos la key que ya está en el header para no repetir
                if (key === this._headerKeyField) return;
                
                const propertyContainer = document.createElement('div');
                propertyContainer.classList.add('card-property');
                
                const label = document.createElement('div');
                label.classList.add('property-label');
                label.textContent = key;
                
                const value = document.createElement('div');
                value.classList.add('property-value');
                value.textContent = (item[key] !== undefined && item[key] !== null) ? item[key] : '';
                
                propertyContainer.appendChild(label);
                propertyContainer.appendChild(value);
                cardContent.appendChild(propertyContainer);
            });
            
            card.appendChild(cardContent);
            
            // Acciones (botones)
            const actionsContainer = document.createElement('div');
            actionsContainer.classList.add('card-actions');
            actionsContainer._dataItem = item; // Guardar referencia al objeto
            
            // Botón Editar
            const editButton = document.createElement('button');
            editButton.textContent = 'Editar';
            editButton.classList.add('edit-btn');
            editButton.dataset.action = 'edit';
            actionsContainer.appendChild(editButton);
            
            // Botón Eliminar
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Eliminar';
            deleteButton.classList.add('delete-btn');
            deleteButton.dataset.action = 'delete';
            actionsContainer.appendChild(deleteButton);
            
            // Botones personalizados
            this._customActions.forEach(actionDef => {
                const customButton = document.createElement('button');
                customButton.textContent = actionDef.label;
                customButton.dataset.action = actionDef.name;
                if (actionDef.className) {
                    customButton.classList.add(...actionDef.className.split(' ').filter(Boolean));
                }
                actionsContainer.appendChild(customButton);
            });
            
            card.appendChild(actionsContainer);
            
            // Añadir card al contenedor
            this._cardsContainer.appendChild(card);
        });
    }

    // --- MANEJADOR DE EVENTOS ---

    _handleActionClick(event) {
        const clickedElement = event.target;

        // Verificar si el click fue en un botón con acción definida
        if (clickedElement.tagName === 'BUTTON' && clickedElement.dataset.action) {
            const action = clickedElement.dataset.action;
            // Buscar el contenedor de acciones más cercano
            const actionsContainer = clickedElement.closest('.card-actions');

            if (actionsContainer && actionsContainer._dataItem) {
                const itemData = actionsContainer._dataItem; // Recuperar el objeto de datos

                let eventName;
                if (action === 'edit') {
                    eventName = 'edit-item';
                } else if (action === 'delete') {
                    eventName = 'delete-item';
                } else {
                    eventName = action; // Evento personalizado
                }

                // Emitir el evento
                this.dispatchEvent(new CustomEvent(eventName, {
                    detail: itemData,
                    bubbles: true,
                    composed: true // Para que salga del Shadow DOM
                }));

            } else if(actionsContainer) {
                console.warn("ObjectCards: Botón de acción clickeado pero no se encontró _dataItem en el contenedor.", actionsContainer);
            } else {
                console.warn("ObjectCards: Botón de acción clickeado fuera de un contenedor de acciones esperado.");
            }
        }
    }

    // --- CICLO DE VIDA ---

    connectedCallback() {
        // Renderizar si no hay datos al conectarse
        if (!this.shadowRoot.contains(this._cardsContainer)) {
            this.shadowRoot.appendChild(this._cardsContainer);
        }
        // Forzar render inicial o si se conecta sin datos
        if(this._data.length === 0 || this._cardsContainer.innerHTML === '') {
            this.render();
        }
    }

    disconnectedCallback() {
        // Limpieza automática por el Shadow DOM y event listener interno
    }
}

// Definir el custom element
customElements.define('object-grid', ObjectCards);
class GridManager extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // Almacén para las referencias a los grids creados
        this._grids = {}; // Usaremos un objeto/mapa para acceso por ID

        // Estilos básicos para el manager
        const style = document.createElement('style');
        style.textContent = /*css*/`
            :host {
                display: block; /* O flex, grid, etc., según necesites organizar los managers */
                padding: 10px;
                /* border: 1px dashed blue; /* Para visualizar el manager */
            }
            .grid-manager-container {
                display: flex; /* Organiza los grids hijos */
                flex-direction: column; /* Uno debajo del otro */
                gap: 20px; /* Espacio entre grids */
            }
            h3 { /* Estilo opcional para títulos de grid */
                margin: 0 0 5px 0;
                font-size: 1.1em;
                color: #333;
            }
        `;

        // Contenedor donde se añadirán los object-grid
        this._container = document.createElement('div');
        this._container.classList.add('grid-manager-container');

        this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(this._container);

        // Escuchar eventos que burbujean desde los grids hijos
        this._container.addEventListener('edit-item', this._handleGridEvent.bind(this));
        this._container.addEventListener('delete-item', this._handleGridEvent.bind(this));
        // Puedes añadir más listeners aquí para acciones personalizadas si quieres manejo centralizado
        // this._container.addEventListener('mi-accion-personalizada', this._handleGridEvent.bind(this));

    }

    /**
     * Añade un nuevo ObjectGrid gestionado por este manager.
     * @param {string} id - Un identificador único para este grid.
     * @param {object} config - Configuración para el grid.
     * @param {Array<string>} config.keys - Las claves (columnas) a mostrar.
     * @param {Array<object>} [config.initialData=[]] - Datos iniciales para el grid.
     * @param {Array<{name: string, label: string, className?: string}>} [config.actions=[]] - Acciones personalizadas.
     * @param {string} [config.title=''] - Un título opcional para mostrar sobre el grid.
     * @returns {HTMLElement|null} La instancia del object-grid creado o null si el ID ya existe.
     */
    addGrid(id, config = {}) {
        if (!id || typeof id !== 'string') {
            console.error('GridManager: Se requiere un ID (string) para añadir un grid.');
            return null;
        }
        if (this._grids[id]) {
            console.warn(`GridManager: Ya existe un grid con el ID "${id}". No se añadió de nuevo.`);
            return null; // O podrías devolver el existente: this._grids[id].element;
        }
        if (!config.keys || !Array.isArray(config.keys)) {
             console.error(`GridManager: La configuración para el grid "${id}" debe incluir un array 'keys'.`);
            return null;
        }

        const { keys, initialData = [], actions = [], title = '' } = config;

        // Contenedor opcional para el título y el grid
        const gridWrapper = document.createElement('div');
        gridWrapper.classList.add('grid-instance-wrapper');
        gridWrapper.dataset.gridId = id; // Asociar ID al wrapper para fácil remoción

        if (title) {
            const gridTitle = document.createElement('h3');
            gridTitle.textContent = title;
            gridWrapper.appendChild(gridTitle);
        }

        // Crear la instancia del object-grid
        const newGrid = document.createElement('object-grid');
        newGrid.id = `grid-${id}`; // Asignar un ID al elemento (útil para CSS o selección directa)

        // Configurar acciones ANTES de setData
        if (Array.isArray(actions)) {
            actions.forEach(action => {
                if (action.name && action.label) {
                    newGrid.addAction(action.name, action.label, action.className || '');
                } else {
                     console.warn(`GridManager: Acción inválida para grid "${id}":`, action);
                }
            });
             // Escuchar acciones personalizadas si se definieron y queremos manejo centralizado
             actions.forEach(action => {
                 if (!['edit-item', 'delete-item'].includes(action.name)) {
                    // Añadir listener específico si no existe ya para ese tipo de evento
                    // Nota: Esto podría añadir múltiples listeners si se llama addGrid varias veces
                    // con la misma acción. Una mejor estrategia sería tener un solo listener
                    // genérico o uno por tipo de acción en el constructor.
                    // Por simplicidad, el _handleGridEvent ya captura todo lo que burbujea.
                 }
             });
        }

        // Establecer datos y claves
        newGrid.setData(initialData, keys);

        // Añadir al DOM dentro del wrapper
        gridWrapper.appendChild(newGrid);
        this._container.appendChild(gridWrapper);


        // Guardar referencia
        this._grids[id] = {
            element: newGrid,
            wrapper: gridWrapper, // Guardar referencia al wrapper también
            config: config // Guardar la configuración original
        };

        console.log(`GridManager: Grid "${id}" añadido.`);
        return newGrid; // Devolver la instancia del grid
    }

    /**
     * Obtiene la instancia de un ObjectGrid por su ID.
     * @param {string} id - El ID del grid a obtener.
     * @returns {HTMLElement|null} La instancia del object-grid o null si no se encuentra.
     */
    getGrid(id) {
        return this._grids[id] ? this._grids[id].element : null;
    }

     /**
     * Obtiene la configuración original de un ObjectGrid por su ID.
     * @param {string} id - El ID del grid.
     * @returns {object|null} La configuración o null si no se encuentra.
     */
    getGridConfig(id) {
        return this._grids[id] ? this._grids[id].config : null;
    }

    /**
     * Elimina un ObjectGrid del manager y del DOM.
     * @param {string} id - El ID del grid a eliminar.
     * @returns {boolean} True si se eliminó, false si no se encontró.
     */
    removeGrid(id) {
        const gridInfo = this._grids[id];
        if (gridInfo && gridInfo.wrapper) {
            gridInfo.wrapper.remove(); // Eliminar el wrapper (que contiene el título y el grid)
            delete this._grids[id]; // Eliminar la referencia
            console.log(`GridManager: Grid "${id}" eliminado.`);
            return true;
        }
        console.warn(`GridManager: No se encontró un grid con el ID "${id}" para eliminar.`);
        return false;
    }

    /**
     * Elimina todos los grids gestionados.
     */
    clearAllGrids() {
        for (const id in this._grids) {
            this.removeGrid(id);
        }
         this._grids = {}; // Asegurar que el registro está vacío
    }

    // --- MANEJO CENTRALIZADO DE EVENTOS ---

    /**
     * Manejador genérico para eventos que burbujean desde los grids hijos.
     * @param {CustomEvent} event - El evento disparado por un object-grid.
     */
    _handleGridEvent(event) {
        const gridElement = event.target; // El <object-grid> que disparó el evento
        const itemData = event.detail;    // El objeto de datos asociado
        const eventType = event.type;     // 'edit-item', 'delete-item', 'mi-accion', etc.

        // Encontrar el ID del grid que originó el evento
        const wrapper = gridElement.closest('.grid-instance-wrapper');
        const gridId = wrapper ? wrapper.dataset.gridId : 'unknown';


        console.log(`GridManager: Evento "${eventType}" recibido del grid "${gridId}". Datos:`, itemData);

        // AQUÍ puedes añadir lógica centralizada:
        // - Actualizar una fuente de datos central.
        // - Llamar a una API.
        // - Modificar los datos del grid específico y llamar a setData() en él.
        //   Ejemplo: Si fuera 'delete-item' y quieres que el manager lo maneje:
        //   if (eventType === 'delete-item') {
        //       // 1. (Simulado) Actualizar tu fuente de datos principal
        //       const currentData = this.getGridData(gridId); // Necesitarías un método para esto
        //       const newData = currentData.filter(item => item.id !== itemData.id); // Asumiendo que los items tienen un 'id' único
        //
        //       // 2. Actualizar el grid visualmente
        //       const gridInstance = this.getGrid(gridId);
        //       if (gridInstance) {
        //          const config = this.getGridConfig(gridId); // Recuperar config para las keys
        //          gridInstance.setData(newData, config.keys);
        //       }
        //   }

        // O simplemente puedes dejar que el código que usa el GridManager
        // añada listeners directamente a las instancias de grid obtenidas con getGrid()
        // o escuche los eventos en el propio GridManager si necesita centralizar.

        // Opcionalmente, re-emitir el evento desde el manager para que el exterior lo capture
        // de una fuente única, añadiendo el ID del grid.
        this.dispatchEvent(new CustomEvent('grid-action', {
            detail: {
                gridId: gridId,
                action: eventType,
                data: itemData,
                originalEvent: event // Incluir evento original si es útil
            },
            bubbles: true, // Puede seguir burbujeando si es necesario
            composed: true
        }));

    }


    connectedCallback() {
        // Lógica si es necesaria cuando el manager se conecta al DOM
        console.log('GridManager conectado.');
    }

    disconnectedCallback() {
        // Lógica de limpieza si es necesaria
         console.log('GridManager desconectado.');
         // No es estrictamente necesario limpiar _grids aquí,
         // pero sí si hubiera listeners externos añadidos manualmente.
         this._grids = {};
    }
}

// Definir el custom element
customElements.define('grid-manager', GridManager);
/**
 * @element object-edit-form
 * @description A web component that renders an editable form for a single JavaScript object,
 *              using c-inp components for individual fields.
 *
 * @attr {Boolean} darkmode - Applies dark mode styling to internal c-inp elements.
 *
 * @prop {Object} item - The JavaScript object to be edited. Use `setItem()` method.
 * @prop {Object} fieldConfigs - Configuration object describing how each field should be rendered. Use `setConfig()` method.
 *
 * @fires save-item - Dispatched when the 'Save' button is clicked and the form is valid. Detail contains the current form data.
 * @fires cancel-edit - Dispatched when the 'Cancel' button is clicked. Detail is null.
 * @fires {CustomEvent} [custom-action-name] - Dispatched when a custom action button is clicked. Detail contains the current form data.
 * @fires field-change - Dispatched whenever a c-inp field's value changes. Detail contains { name: string, value: any }.
 *
 * @method setConfig(item = {}, fieldConfigs = {}) - Sets the data object and the field configurations.
 * @method setItem(item = {}) - Updates the data object being edited without changing configurations.
 * @method addAction(actionName, buttonLabel, cssClass = '') - Adds a custom button to the form's actions.
 * @method validate() - Checks if all fields in the form are valid according to their configurations. Returns boolean.
 * @method getCurrentData() - Returns an object with the current values from all form fields.
 * @method reset() - Resets all form fields to their initial values when setConfig/setItem was called.
 */
class ObjectEditForm extends HTMLElement {

    constructor() {
        super();

        // Internal state
        this._initialItem = {}; // Store the initially set item for reset functionality
        this._currentItem = {}; // Store the current state of the item being edited
        this._fieldConfigs = {}; // { fieldName: { type: 'text', label: '...', required: true, ... }, ... }
        this._customActions = [];

        // Shadow DOM
        this.attachShadow({ mode: 'open' });

        // Styles
        const style = document.createElement('style');
        style.textContent = this.getStyles();

        // Form structure
        this._formContainer = document.createElement('form');
        this._formContainer.classList.add('edit-form-container');
        this._formContainer.setAttribute('novalidate', ''); // Disable native validation bubbles initially

        this._fieldsContainer = document.createElement('div');
        this._fieldsContainer.classList.add('fields-container');

        this._actionsContainer = document.createElement('div');
        this._actionsContainer.classList.add('form-actions');

        this._formContainer.appendChild(this._fieldsContainer);
        this._formContainer.appendChild(this._actionsContainer);

        this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(this._formContainer);

        // Event listeners
        this._handleActionClick = this._handleActionClick.bind(this);
        this._handleInputChange = this._handleInputChange.bind(this);
        this._handleSubmit = this._handleSubmit.bind(this); // Handle form submission attempt
    }

    getStyles() {
        // Reuse some styles and add form-specific ones
        return /*css*/`
            :host {
                display: block;
                font-family: sans-serif;
                padding: 15px;
                border: 1px solid #eee;
                border-radius: 8px;
                background-color: #f9f9f9;
                margin-bottom: 15px;
            }

            .edit-form-container {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }

            .fields-container {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); /* Responsive grid */
                gap: 10px 15px; /* Row and column gap */
                padding-bottom: 15px; /* Space before actions */
                border-bottom: 1px solid #eee;
            }

            /* Style wrapper for label + c-inp */
            .field-wrapper {
                display: flex;
                flex-direction: column;
                gap: 4px; /* Space between label and input */
            }

            label {
                font-weight: 500;
                font-size: 0.9em;
                color: #333;
                text-transform: capitalize;
            }

            /* Target c-inp specifically if needed */
            c-inp {
                 margin: 0; /* Override default margin if c-inp has one */
                 padding: 0; /* Override default padding if c-inp has one */
            }

             /* Add styles for invalid state feedback */
            .field-wrapper.invalid label {
                color: #dc3545; /* Red label */
            }
            /* c-inp itself should handle internal invalid state visuals */


            .form-actions {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }

            /* Basic button styling (can be refined) */
             button {
                padding: 8px 16px;
                cursor: pointer;
                border: 1px solid #ccc;
                border-radius: 4px;
                font-size: 0.95em;
                transition: background-color 0.2s, border-color 0.2s, color 0.2s;
                background-color: #fff;
            }

            button:hover {
                filter: brightness(0.95);
            }

            .save-btn {
                background-color: #28a745; /* Green */
                color: white;
                border-color: #28a745;
            }
             .save-btn:hover {
                 background-color: #218838;
                 border-color: #1e7e34;
             }


            .cancel-btn {
                background-color: #6c757d; /* Gray */
                color: white;
                border-color: #6c757d;
            }
            .cancel-btn:hover {
                background-color: #5a6268;
                border-color: #545b62;
            }

            /* Style for custom buttons (example) */
            button.my-custom-class {
                background-color: #007bff;
                color: white;
                border-color: #007bff;
            }
            button.my-custom-class:hover {
                 background-color: #0056b3;
                 border-color: #0056b3;
             }

             /* Dark Mode propagation */
            :host([darkmode]) {
                 background-color: #333;
                 border-color: #555;
             }
            :host([darkmode]) label {
                 color: #eee;
             }
            :host([darkmode]) .fields-container {
                 border-bottom-color: #555;
             }
             :host([darkmode]) button {
                background-color: #555;
                border-color: #777;
                color: #eee;
             }
             :host([darkmode]) button:hover {
                 filter: brightness(1.1);
             }
             /* Ensure c-inp receives darkmode */
             :host([darkmode]) c-inp {
                 color-scheme: dark; /* Hint for c-inp */
             }
        `;
    }

    // --- PUBLIC API ---

    /**
     * Sets the data object to edit and the configuration for its fields.
     * @param {Object} item - The object containing the data to edit.
     * @param {Object} fieldConfigs - An object where keys match item properties.
     *                                Values are configuration objects for c-inp.
     *                                e.g., { name: { label: 'Full Name', type: 'text', required: true },
     *                                        age: { label: 'Age', type: 'number', min: 0 },
     *                                        status: { label: 'Status', type: 'select', options: [{label:'Active', value: 'active'}, ...]} }
     */
    setConfig(item = {}, fieldConfigs = {}) {
        // Deep copy to prevent modifying the original object directly
        // and to allow resetting
        this._initialItem = JSON.parse(JSON.stringify(item || {}));
        this._currentItem = JSON.parse(JSON.stringify(item || {}));
        this._fieldConfigs = fieldConfigs || {};
        this.render();
    }

    /**
     * Updates the item being edited without changing the field configurations.
     * Useful after a save or for external updates.
     * @param {Object} item - The new data object.
     */
    setItem(item = {}) {
        this._initialItem = JSON.parse(JSON.stringify(item || {}));
        this._currentItem = JSON.parse(JSON.stringify(item || {}));
        // Don't re-render the whole structure, just update field values
        this._updateFieldValues();
    }


    /**
     * Adds a custom action button to the form.
     * @param {string} actionName - The name of the action (will be event name).
     * @param {string} buttonLabel - The text displayed on the button.
     * @param {string} [cssClass=''] - Optional CSS class(es) to add to the button.
     */
    addAction(actionName, buttonLabel, cssClass = '') {
        if (typeof actionName !== 'string' || !actionName) {
            console.error('ObjectEditForm: actionName must be a non-empty string.');
            return;
        }
        if (typeof buttonLabel !== 'string') {
            console.error('ObjectEditForm: buttonLabel must be a string.');
            return;
        }
        if (this._customActions.some(action => action.name === actionName)) {
            console.warn(`ObjectEditForm: Action "${actionName}" already exists.`);
            return;
        }
        this._customActions.push({ name: actionName, label: buttonLabel, className: cssClass });
        this._renderActions(); // Re-render only the actions part
    }

    /**
     * Validates all c-inp fields in the form.
     * @returns {boolean} True if all fields are valid, false otherwise.
     */
    validate() {
        let isFormValid = true;
        const fields = this.shadowRoot.querySelectorAll('c-inp');
        fields.forEach(field => {
            const fieldWrapper = field.closest('.field-wrapper');
            if (!field.isValid()) {
                isFormValid = false;
                // Add visual cue to the wrapper (optional, c-inp might handle its own)
                if(fieldWrapper) fieldWrapper.classList.add('invalid');
                 console.warn(`Field "${field.getAttribute('name')}" is invalid.`);
            } else {
                 if(fieldWrapper) fieldWrapper.classList.remove('invalid');
            }
        });
        return isFormValid;
    }

     /**
     * Gathers the current values from all c-inp fields.
     * @returns {Object} An object representing the current state of the form data.
     */
    getCurrentData() {
        const formData = { ...this._currentItem }; // Start with the current internal state
        const fields = this.shadowRoot.querySelectorAll('c-inp');
        fields.forEach(field => {
            const name = field.getAttribute('name');
            if (name) {
                formData[name] = field.getVal(); // Use c-inp's getter
            }
        });
        return formData;
    }

    /**
     * Resets all form fields to the values they had when setConfig or setItem was last called.
     */
    reset() {
        this.setItem(this._initialItem); // Set internal state and update fields
    }

    // --- RENDER LOGIC ---

    render() {
        this._renderFields();
        this._renderActions();
    }

    _renderFields() {
        this._fieldsContainer.innerHTML = ''; // Clear previous fields

        if (!this._currentItem || !this._fieldConfigs || Object.keys(this._fieldConfigs).length === 0) {
            this._fieldsContainer.textContent = 'No fields configured.';
            return;
        }

        const darkMode = this.hasAttribute('darkmode');

        for (const key in this._fieldConfigs) {
            if (Object.hasOwnProperty.call(this._fieldConfigs, key)) {
                const config = this._fieldConfigs[key];
                const currentValue = this._currentItem?.[key]; // Use optional chaining

                // Create wrapper for label and input
                const fieldWrapper = document.createElement('div');
                fieldWrapper.classList.add('field-wrapper');

                // Create Label
                const label = document.createElement('label');
                const inputId = `edit-form-${key}-${Date.now()}`; // Unique enough ID
                label.setAttribute('for', inputId);
                label.textContent = config.label || key; // Use label from config or key name
                fieldWrapper.appendChild(label);

                // Create c-inp element
                const inputField = document.createElement('c-inp');
                inputField.setAttribute('id', inputId);
                inputField.setAttribute('name', key);
                inputField.setAttribute('type', config.type || 'text');

                // Set value appropriately
                if (config.type === 'checkbox' || config.type === 'switch' || config.type === 'boolean') {
                    // c-inp's setVal handles boolean, but we set the initial attribute correctly
                     if (Boolean(currentValue)) {
                        inputField.setAttribute('value', 'true'); // Or just set checked property after appending
                     }
                } else if (currentValue !== undefined && currentValue !== null) {
                    inputField.setAttribute('value', currentValue);
                }


                // Pass through common c-inp attributes from config
                if (config.placeholder) inputField.setAttribute('placeholder', config.placeholder);
                if (config.required) inputField.setAttribute('required', '');
                if (config.disabled) inputField.setAttribute('disabled', '');
                if (config.readonly) inputField.setAttribute('readonly', '');
                if (config.pattern) inputField.setAttribute('pattern', config.pattern);
                if (config.title) inputField.setAttribute('title', config.title); // For validation message hint
                if (config.options && Array.isArray(config.options)) {
                    inputField.setAttribute('options', JSON.stringify(config.options));
                }

                // Propagate darkmode
                if (darkMode) {
                    inputField.setAttribute('darkmode', '');
                }

                fieldWrapper.appendChild(inputField);
                this._fieldsContainer.appendChild(fieldWrapper);

                // For checkbox/switch, ensure checked state matches value AFTER appending
                 if (config.type === 'checkbox' || config.type === 'switch' || config.type === 'boolean') {
                    // Access internal input after it's potentially rendered
                    // Use setVal for consistency after element is ready
                     Promise.resolve().then(() => { // Ensure c-inp has rendered internally
                         inputField.setVal(Boolean(currentValue));
                     });
                 }
            }
        }
    }

    _renderActions() {
        this._actionsContainer.innerHTML = ''; // Clear previous actions

        // Cancel Button
        const cancelButton = document.createElement('button');
        cancelButton.type = "button"; // Prevent default form submission
        cancelButton.textContent = 'Cancel';
        cancelButton.classList.add('cancel-btn');
        cancelButton.dataset.action = 'cancel';
        this._actionsContainer.appendChild(cancelButton);

        // Save Button (must be type submit OR we trigger validation manually)
        const saveButton = document.createElement('button');
        saveButton.type = "submit"; // Use form submission to potentially trigger validation easily
        saveButton.textContent = 'Save';
        saveButton.classList.add('save-btn');
        saveButton.dataset.action = 'save'; // Still useful for our click handler
        this._actionsContainer.appendChild(saveButton);

        // Custom Actions
        this._customActions.forEach(action => {
            const customButton = document.createElement('button');
            customButton.type = "button"; // Usually custom actions shouldn't submit the form
            customButton.textContent = action.label;
            customButton.dataset.action = action.name;
            if (action.className) {
                customButton.classList.add(...action.className.split(' ').filter(Boolean));
            }
            this._actionsContainer.appendChild(customButton);
        });
    }

    /**
     * Updates the value attribute/property of existing c-inp elements.
     */
    _updateFieldValues() {
        const fields = this.shadowRoot.querySelectorAll('c-inp');
        fields.forEach(field => {
            const name = field.getAttribute('name');
            if (name && Object.hasOwnProperty.call(this._currentItem, name)) {
                const newValue = this._currentItem[name];
                field.setVal(newValue); // Use c-inp's setter method
            } else if (name) {
                 field.setVal(null); // Reset if key no longer exists
            }
             // Clear potential validation error styling on reset/update
             const fieldWrapper = field.closest('.field-wrapper');
             if(fieldWrapper) fieldWrapper.classList.remove('invalid');
        });
    }


    // --- EVENT HANDLERS ---

    _handleInputChange(event) {
        // Listen to 'change' events bubbling from c-inp
        if (event.target.tagName === 'C-INP' && event.detail) {
            const { name, value } = event.detail;
            if (name) {
                // Update internal current state immediately
                this._currentItem[name] = value;

                 // Remove validation error style on change
                 const fieldWrapper = event.target.closest('.field-wrapper');
                 if(fieldWrapper) fieldWrapper.classList.remove('invalid');


                // Dispatch an event indicating a field changed
                this.dispatchEvent(new CustomEvent('field-change', {
                    detail: { name, value },
                    bubbles: true,
                    composed: true
                }));
            }
        }
    }

     _handleSubmit(event) {
        event.preventDefault(); // Prevent actual form submission
        console.log("Form submit intercepted");
        // This is triggered ONLY by the 'Save' button (type="submit")
        // Or potentially by pressing Enter in a field

        this._handleSaveAction(); // Call the save logic
     }

    _handleActionClick(event) {
        const clickedElement = event.target;
        if (clickedElement.tagName === 'BUTTON' && clickedElement.dataset.action) {
            const action = clickedElement.dataset.action;

            // We prevent default submit behaviour in _handleSubmit, so clicking save comes here too
            // BUT we only want the specific logic below for non-submit buttons or explicit handling

            if (action === 'save') {
                 // This case might be redundant if _handleSubmit handles it,
                 // but keep it for clarity or if save button wasn't type="submit"
                 this._handleSaveAction();
            } else if (action === 'cancel') {
                 this.dispatchEvent(new CustomEvent('cancel-edit', {
                    detail: null, // No data needed for cancel
                    bubbles: true,
                    composed: true
                }));
                 this.reset(); // Optionally reset the form on cancel
            } else {
                // Custom Action
                const currentData = this.getCurrentData(); // Get current data for custom actions
                this.dispatchEvent(new CustomEvent(action, {
                    detail: currentData,
                    bubbles: true,
                    composed: true
                }));
            }
        }
    }

    _handleSaveAction() {
         console.log("Handling save action...");
         if (this.validate()) {
            console.log("Form is valid. Dispatching save-item.");
            const currentData = this.getCurrentData();
            // Update initial state on successful save, so reset goes to the saved state
            this._initialItem = JSON.parse(JSON.stringify(currentData));

            this.dispatchEvent(new CustomEvent('save-item', {
                detail: currentData,
                bubbles: true,
                composed: true
            }));
        } else {
            console.warn('ObjectEditForm: Validation failed. Save prevented.');
            // Optionally focus the first invalid field
            const firstInvalid = this.shadowRoot.querySelector('.field-wrapper.invalid c-inp');
            if (firstInvalid) {
                firstInvalid.focus();
            }
        }
    }


    // --- LIFECYCLE CALLBACKS ---

    connectedCallback() {
        // Add listeners
        this._actionsContainer.addEventListener('click', this._handleActionClick);
        // Listen for changes bubbling up from c-inp components
        this._formContainer.addEventListener('change', this._handleInputChange);
         // Listen for the form submission attempt
        this._formContainer.addEventListener('submit', this._handleSubmit);


        // Initial render if data/config were set before connection
        if (!this._fieldsContainer.hasChildNodes() && Object.keys(this._fieldConfigs).length > 0) {
            this.render();
        } else if (!this._actionsContainer.hasChildNodes()) {
             this._renderActions(); // Ensure actions are rendered even if no fields
        }

        // Propagate initial dark mode setting to c-inp elements if needed
        if (this.hasAttribute('darkmode')) {
            this.shadowRoot.querySelectorAll('c-inp').forEach(inp => inp.setAttribute('darkmode', ''));
        }
    }

    disconnectedCallback() {
        // Remove listeners
        this._actionsContainer.removeEventListener('click', this._handleActionClick);
        this._formContainer.removeEventListener('change', this._handleInputChange);
        this._formContainer.removeEventListener('submit', this._handleSubmit);
    }

    static get observedAttributes() {
        return ['darkmode']; // Observe darkmode attribute
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'darkmode') {
            const isDarkMode = newValue !== null;
            // Update internal c-inp elements
            this.shadowRoot.querySelectorAll('c-inp').forEach(inp => {
                if (isDarkMode) {
                    inp.setAttribute('darkmode', '');
                } else {
                    inp.removeAttribute('darkmode');
                }
            });
             // Rerender actions if their styling depends on darkmode (e.g., via host context)
             // Or simply rely on CSS :host([darkmode]) selectors.
             // this._renderActions(); // Might be needed if button styles change drastically
        }
    }
}

// Define the custom element
if (!customElements.get('object-edit-form')) {
    customElements.define('object-edit-form', ObjectEditForm);
}
/**
 * @element dynamic-object-display
 * @description A component that displays a single object and allows switching
 *              to an edit mode using object-edit-form.
 *
 * @attr {Boolean} darkmode - Applies dark mode styling.
 * @attr {String} header-key - The key in the item object to use as the display header.
 *
 * @prop {Object} item - The JavaScript object to display/edit. Use `setConfig()` or `setItem()`.
 * @prop {Object} fieldConfigs - Configuration for displaying/editing fields. Use `setConfig()`.
 *
 * @fires item-updated - Dispatched after a successful save in edit mode. Detail contains the updated item.
 * @fires delete-item - Dispatched when the 'Delete' button (in display mode) is clicked. Detail contains the item.
 * @fires {CustomEvent} [custom-action-name] - Dispatched when a custom action button (in display mode) is clicked. Detail contains the item.
 *
 * @method setConfig (item = {}, fieldConfigs = {}) - Sets the data object and field configurations, resets mode to 'display'.
 * @method setItem (item = {}) - Updates the data object while preserving the current mode and configurations.
 * @method addAction (actionName, buttonLabel, cssClass = '') - Adds a custom button ONLY to the display mode actions.
 */
class DynamicObjectDisplay extends HTMLElement {

    constructor() {
        super();

        // Internal State
        this._mode = 'display'; // 'display' or 'edit'
        this._currentItem = {};
        this._fieldConfigs = {};
        this._headerKey = null;
        this._customActions = []; // Actions for display mode

        // Shadow DOM
        this.attachShadow({ mode: 'open' });

        // Style
        const style = document.createElement('style');
        style.textContent = this.getStyles();

        // Main Container (will hold either display or edit view)
        this._container = document.createElement('div');
        this._container.classList.add('dynamic-container');

        this.shadowRoot.appendChild(style);
        this.shadowRoot.appendChild(this._container);

        // Bind methods
        this._handleDisplayActionClick = this._handleDisplayActionClick.bind(this);
        this._handleSave = this._handleSave.bind(this);
        this._handleCancel = this._handleCancel.bind(this);
        this._handleExternalFieldChange = this._handleExternalFieldChange.bind(this); // Handle form field changes
    }

    static get observedAttributes() {
        // Observe attributes that affect rendering directly
        return ['darkmode', 'header-key'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === 'header-key') {
                this._headerKey = newValue;
            }
            // Re-render if the mode is display, or pass attribute to editor if mode is edit
            this.render();
        }
    }

    getStyles() {
        // Combine styles for the container and the display mode (mimicking ObjectCards card)
        // Include styles for :host([darkmode])
        return /*css*/`
            :host {
                display: block;
                font-family: sans-serif;
                margin-bottom: 15px;
                /* Ensure container takes up space */
            }

            .dynamic-container {
                 /* Basic container doesn't need much styling itself */
                 position: relative; /* Context for potential absolute elements if needed */
            }

            /* --- Display Mode Styles (mimic ObjectCards card) --- */
            .display-card {
                background-color: #fff;
                border: 1px solid #eee;
                border-radius: 8px;
                box-shadow: 0 1px 4px rgba(0,0,0,0.08);
                overflow: hidden;
                display: flex;
                flex-direction: column;
                transition: box-shadow 0.2s;
            }
            :host([darkmode]) .display-card {
                background-color: #333;
                border-color: #555;
                color: #eee;
            }

            .display-card:hover {
                 box-shadow: 0 2px 8px rgba(0,0,0,0.12);
            }
            :host([darkmode]) .display-card:hover {
                 box-shadow: 0 2px 8px rgba(255,255,255,0.1);
            }


            .display-header {
                background-color: #f5f5f5;
                padding: 12px 16px;
                font-weight: bold;
                border-bottom: 1px solid #eee;
            }
            :host([darkmode]) .display-header {
                background-color: #444;
                border-bottom-color: #555;
            }

            .display-content {
                padding: 16px;
                flex-grow: 1;
                 /* Simple grid for properties */
                 display: grid;
                 grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                 gap: 10px 15px;
            }


            .display-property {
                margin-bottom: 8px;
                display: flex;
                flex-direction: column; /* Stack label and value */
                gap: 2px;
            }

            .display-property-label {
                font-weight: 500;
                color: #666;
                font-size: 0.8em;
                text-transform: capitalize;
                margin-bottom: 2px;
            }
             :host([darkmode]) .display-property-label {
                 color: #bbb;
             }

            .display-property-value {
                word-break: break-word;
                font-size: 0.95em;
            }
             /* Display boolean/switch values nicely */
             .display-property-value[data-type="boolean"],
             .display-property-value[data-type="switch"],
             .display-property-value[data-type="checkbox"] {
                 font-style: italic;
                 color: #333;
             }
             :host([darkmode]) .display-property-value[data-type="boolean"],
             :host([darkmode]) .display-property-value[data-type="switch"],
             :host([darkmode]) .display-property-value[data-type="checkbox"] {
                  color: #ddd;
             }


            .display-actions {
                padding: 10px 16px;
                display: flex;
                justify-content: flex-end;
                gap: 8px;
                background-color: #fafafa;
                border-top: 1px solid #eee;
            }
            :host([darkmode]) .display-actions {
                background-color: #3a3a3a;
                border-top-color: #555;
            }


            /* --- Button Styles (can be shared or specific) --- */
            button { /* Basic button style */
                padding: 6px 12px;
                cursor: pointer;
                border: 1px solid #ccc;
                border-radius: 4px;
                font-size: 0.9em;
                transition: all 0.2s;
                background-color: #fff;
            }
            button:hover { filter: brightness(0.95); }
            :host([darkmode]) button {
                 background-color: #555;
                 border-color: #777;
                 color: #eee;
            }
             :host([darkmode]) button:hover {
                 filter: brightness(1.1);
             }


            /* Specific button styles */
            .edit-btn { background-color: #CCE5FF; border-color: #b8daff; color: #004085; }
            .delete-btn { background-color: #F8D7DA; color: #721c24; border-color: #f5c6cb; }
             :host([darkmode]) .edit-btn { background-color: #0056b3; border-color: #0056b3; color: white; }
             :host([darkmode]) .delete-btn { background-color: #b81c2c; border-color: #b81c2c; color: white; }

            /* --- Edit Mode Styles --- */
            /* object-edit-form should have its own styles, but we might need positioning */
            object-edit-form {
                display: block; /* Ensure it takes space */
            }
        `;
    }

    // --- PUBLIC API ---

    /**
     * Sets the data, config, and resets mode to display.
     */
    setConfig(item = {}, fieldConfigs = {}) {
        // Deep copy to prevent external modification issues
        this._currentItem = JSON.parse(JSON.stringify(item || {}));
        this._fieldConfigs = fieldConfigs || {};
        this._mode = 'display'; // Always reset to display on new config
        this._headerKey = this.getAttribute('header-key'); // Ensure header key is synced
        this.render();
    }

    /**
     * Updates the item data, preserving current mode. Useful for external updates.
     */
    setItem(item = {}) {
         this._currentItem = JSON.parse(JSON.stringify(item || {}));
         // Re-render the current mode with the new data
         this.render();
    }

    /**
     * Adds a custom action button shown ONLY in display mode.
     */
    addAction(actionName, buttonLabel, cssClass = '') {
        // Basic validation
        if (typeof actionName !== 'string' || !actionName || typeof buttonLabel !== 'string') {
             console.error('DynamicObjectDisplay: Invalid arguments for addAction.');
             return;
        }
         if (!this._customActions.some(a => a.name === actionName)) {
            this._customActions.push({ name: actionName, label: buttonLabel, className: cssClass });
             // If currently in display mode, re-render to show the new button
             if (this._mode === 'display') {
                 this.render();
             }
         } else {
            console.warn(`DynamicObjectDisplay: Action "${actionName}" already exists.`);
         }
    }

    // --- RENDER LOGIC ---

    render() {
        // Clear previous content
        this._container.innerHTML = '';
        // Remove old listeners if any were attached directly to children
        // (Event delegation is generally preferred)

        if (!this._currentItem || Object.keys(this._currentItem).length === 0 || !this._fieldConfigs || Object.keys(this._fieldConfigs).length === 0) {
             this._container.textContent = 'No item or configuration provided.';
             return;
        }

        // Apply dark mode to container if needed
        this._container.classList.toggle('darkmode', this.hasAttribute('darkmode'));


        if (this._mode === 'display') {
            this._renderDisplayView();
        } else if (this._mode === 'edit') {
            this._renderEditView();
        }
    }

    _renderDisplayView() {
        const card = document.createElement('div');
        card.classList.add('display-card');

        // 1. Header (Optional)
        const effectiveHeaderKey = this._headerKey || this.getAttribute('header-key');
        if (effectiveHeaderKey && this._currentItem[effectiveHeaderKey] !== undefined) {
            const header = document.createElement('div');
            header.classList.add('display-header');
            header.textContent = this._currentItem[effectiveHeaderKey];
            card.appendChild(header);
        }

        // 2. Content (Properties based on fieldConfigs)
        const content = document.createElement('div');
        content.classList.add('display-content');

        for (const key in this._fieldConfigs) {
             // Don't show the header key again in the main content if it was used in the header
            if (key === effectiveHeaderKey) continue;

            if (Object.hasOwnProperty.call(this._fieldConfigs, key)) {
                const config = this._fieldConfigs[key];
                const value = this._currentItem[key];

                 // Skip fields marked explicitly as hidden for display (add a 'hidden' property to config if needed)
                 // if (config.hidden) continue;

                const propContainer = document.createElement('div');
                propContainer.classList.add('display-property');

                const label = document.createElement('div');
                label.classList.add('display-property-label');
                label.textContent = config.label || key; // Use config label or key
                propContainer.appendChild(label);

                const valueEl = document.createElement('div');
                valueEl.classList.add('display-property-value');

                 // Basic formatting for different types
                 const displayType = config.type || 'text';
                 valueEl.dataset.type = displayType; // Add type for styling hooks

                 if (displayType === 'boolean' || displayType === 'switch' || displayType === 'checkbox') {
                    valueEl.textContent = Boolean(value) ? (config.trueLabel || 'Yes') : (config.falseLabel || 'No');
                 } else if (displayType === 'select' && config.options && Array.isArray(config.options)) {
                     const selectedOption = config.options.find(opt => opt.value == value); // Use == for potential type mismatch
                     valueEl.textContent = selectedOption ? selectedOption.label : (value ?? ''); // Show label if found, else raw value
                 } else if (value === undefined || value === null) {
                    valueEl.textContent = ''; // Empty string for null/undefined
                 } else {
                    valueEl.textContent = value;
                 }


                propContainer.appendChild(valueEl);
                content.appendChild(propContainer);
            }
        }
        card.appendChild(content);

        // 3. Actions
        const actions = document.createElement('div');
        actions.classList.add('display-actions');
        actions.addEventListener('click', this._handleDisplayActionClick); // Use event delegation

        // Standard Actions
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.classList.add('edit-btn');
        editButton.dataset.action = 'edit';
        actions.appendChild(editButton);

        // Optional Delete Button (Consider adding a config flag for this)
        // if (this._fieldConfigs._allowDelete) { // Example: Check config
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.classList.add('delete-btn');
            deleteButton.dataset.action = 'delete';
            actions.appendChild(deleteButton);
        // }

        // Custom Actions
        this._customActions.forEach(actionDef => {
            const customButton = document.createElement('button');
            customButton.textContent = actionDef.label;
            customButton.dataset.action = actionDef.name;
             if (actionDef.className) {
                customButton.classList.add(...actionDef.className.split(' ').filter(Boolean));
            }
            actions.appendChild(customButton);
        });

        card.appendChild(actions);

        this._container.appendChild(card);
    }

    _renderEditView() {
        if (!customElements.get('object-edit-form')) {
            this._container.textContent = 'Error: object-edit-form component not defined.';
            console.error('DynamicObjectDisplay: Cannot render edit view, object-edit-form is not defined.');
            return;
        }

        const editor = document.createElement('object-edit-form');

        // Propagate dark mode
        if (this.hasAttribute('darkmode')) {
            editor.setAttribute('darkmode', '');
        } else {
            editor.removeAttribute('darkmode');
        }

        // Set data and configuration for the editor
        // Pass a copy to prevent the editor from directly modifying our internal _currentItem until save
        editor.setConfig(JSON.parse(JSON.stringify(this._currentItem)), this._fieldConfigs);

        // Add event listeners for save and cancel
        editor.addEventListener('save-item', this._handleSave);
        editor.addEventListener('cancel-edit', this._handleCancel);
        // Listen for field changes within the form if needed for complex logic
        editor.addEventListener('field-change', this._handleExternalFieldChange);

        this._container.appendChild(editor);
    }

    // --- EVENT HANDLERS ---

    _handleDisplayActionClick(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;

        const action = button.dataset.action;

        if (action === 'edit') {
            this._switchToEdit();
        } else if (action === 'delete') {
            // Dispatch delete event with the current item data
            this.dispatchEvent(new CustomEvent('delete-item', {
                detail: { ...this._currentItem }, // Send a copy
                bubbles: true,
                composed: true
            }));
        } else {
            // Custom action from display mode
            this.dispatchEvent(new CustomEvent(action, {
                detail: { ...this._currentItem }, // Send a copy
                bubbles: true,
                composed: true
            }));
        }
    }

    _switchToEdit() {
        this._mode = 'edit';
        this.render();
    }

    _switchToDisplay() {
        this._mode = 'display';
        this.render();
    }

    _handleSave(event) {
        console.log('DynamicObjectDisplay received save-item:', event.detail);
        // Update the internal current item with the data from the editor
        this._currentItem = JSON.parse(JSON.stringify(event.detail));

        // Dispatch an event indicating the item was updated
        this.dispatchEvent(new CustomEvent('item-updated', {
            detail: { ...this._currentItem }, // Send a copy
            bubbles: true,
            composed: true
        }));

        // Switch back to display mode
        this._switchToDisplay();
    }

    _handleCancel(event) {
        console.log('DynamicObjectDisplay received cancel-edit');
        // Simply switch back to display mode without updating _currentItem
        this._switchToDisplay();
    }

     _handleExternalFieldChange(event) {
         // Optional: React to field changes within the editor *before* saving
         // console.log('Field changed in editor:', event.detail.name, event.detail.value);
         // For example, you could perform intermediate validation or update related fields
         // Note: The editor already maintains its internal state. This is for reacting externally.
     }


    // --- LIFECYCLE ---

    connectedCallback() {
        // Render initial state if config/item were set before connection
        if (this._container.innerHTML === '' && Object.keys(this._fieldConfigs).length > 0) {
            this.render();
        }
    }

    disconnectedCallback() {
        // Clean up listeners if they weren't managed by event delegation
        // or attached to children that are removed in render()
        // In this setup, render() clears the container, implicitly removing
        // listeners attached to the editor form. Display mode uses delegation.
    }
}

// Define the custom element
if (!customElements.get('dynamic-object-display')) {
    customElements.define('dynamic-object-display', DynamicObjectDisplay);
}