/**
 * Función principal para generar un formulario HTML basado en una definición.
 * @param {object} config - Configuración del formulario.
 * @param {string} config.id - ID único para el formulario.
 * @param {string} [config.action='#'] - Atributo action del formulario.
 * @param {string} [config.method='POST'] - Atributo method del formulario.
 * @param {string} [config.title] - Título opcional que se mostrará encima del formulario.
 * @param {string} [config.containerClasses='max-w-md mx-auto'] - Clases para el contenedor principal del formulario.
 * @param {string} [config.gridCols='md:grid-cols-2'] - Clases para definir las columnas del grid (si se usa).
 * @param {Array<object>} config.fields - Array de objetos que definen cada campo del formulario.
 * @returns {HTMLElement} - El elemento <form> generado.
 */
function createFormElement(config) {
    const form = document.createElement('form');
    form.id = config.id;
    form.action = config.action || '#';
    form.method = config.method || 'POST';
    form.noValidate = true; // Opcional: deshabilita validación HTML5 por defecto si manejarás con JS

    let fieldContainer = form; // Por defecto, los campos van directos al form

    // Si hay campos con 'span' o se especifica layout grid, crear un contenedor grid
    const usesGrid = config.fields.some(field => field.span);
    if (usesGrid) {
        const gridContainer = document.createElement('div');
        gridContainer.className = `grid grid-cols-1 ${config.gridCols || 'md:grid-cols-2'} gap-4`;
        form.appendChild(gridContainer);
        fieldContainer = gridContainer; // Los campos irán al grid container
    }

    config.fields.forEach(field => {
        const fieldElement = createFormField(field);
        if (fieldElement) {
            // Aplicar span si existe (para layouts de grid)
            if (field.span && usesGrid) {
                 // El span se aplica al contenedor del campo (form-control div)
                 fieldElement.classList.add(field.span);
            }
            // Si es un botón de submit, va fuera del grid principal usualmente
            if (field.type === 'submit') {
                form.appendChild(fieldElement); // Añadir botón al final del form, no al grid
            } else {
                fieldContainer.appendChild(fieldElement);
            }
        }
    });

    return form;
}

/**
 * Crea el HTML para un campo de formulario individual.
 * @param {object} field - Definición del campo.
 * @param {string} field.type - Tipo de campo (text, email, password, textarea, select, radio, checkbox, submit, heading).
 * @param {string} [field.id] - ID del campo (usado para label 'for').
 * @param {string} [field.name] - Atributo name del campo.
 * @param {string} [field.label] - Texto de la etiqueta.
 * @param {string} [field.placeholder] - Placeholder para inputs/textarea.
 * @param {boolean} [field.required=false] - Si el campo es obligatorio.
 * @param {Array<object>} [field.options] - Opciones para select, radio, checkbox [{value: 'val', text: 'Label'}].
 * @param {string} [field.defaultValue] - Valor preseleccionado para radio/checkbox/select.
 * @param {string} [field.helpText] - Texto de ayuda opcional debajo del campo.
 * @param {string} [field.classes] - Clases CSS adicionales para el input/select/textarea.
 * @param {string} [field.buttonText='Enviar'] - Texto para botones de tipo 'submit'.
 * @param {string} [field.buttonClasses='btn btn-primary w-full'] - Clases para botones de tipo 'submit'.
 * @param {string} [field.span] - Clases de Tailwind para controlar el tamaño en grid (ej. 'md:col-span-2').
 * @returns {HTMLElement | null} - El elemento HTML del campo o null.
 */
function createFormField(field) {
    const formControl = document.createElement('div');
    // Clases base para la mayoría de los controles, ajustables si es necesario
    if (!['submit', 'heading', 'radio', 'checkbox'].includes(field.type)) {
         formControl.className = 'form-control w-full';
    }
     if (!['submit', 'heading'].includes(field.type)) {
         formControl.classList.add('mb-4'); // Margen inferior por defecto
     }


    let labelElement;
    if (field.label && !['submit', 'heading'].includes(field.type)) {
        labelElement = document.createElement('label');
        labelElement.className = 'label';
        if (field.id) {
            labelElement.htmlFor = field.id;
        }
        const labelText = document.createElement('span');
        labelText.className = 'label-text';
        labelText.textContent = field.label;
        labelElement.appendChild(labelText);
        // No añadir label directamente para radio/checkbox, se maneja dentro de sus bucles
        if (!['radio', 'checkbox'].includes(field.type)) {
            formControl.appendChild(labelElement);
        }
    }

    let inputElement;

    switch (field.type) {
        case 'text':
        case 'email':
        case 'password':
        case 'tel':
        case 'number':
        case 'date':
        case 'url':
            inputElement = document.createElement('input');
            inputElement.type = field.type;
            inputElement.className = `input input-bordered w-full ${field.classes || ''}`;
            if (field.id) inputElement.id = field.id;
            if (field.name) inputElement.name = field.name;
            if (field.placeholder) inputElement.placeholder = field.placeholder;
            if (field.required) inputElement.required = true;
            formControl.appendChild(inputElement);
            break;

        case 'textarea':
            inputElement = document.createElement('textarea');
            inputElement.className = `textarea textarea-bordered h-24 w-full ${field.classes || ''}`;
            if (field.id) inputElement.id = field.id;
            if (field.name) inputElement.name = field.name;
            if (field.placeholder) inputElement.placeholder = field.placeholder;
            if (field.required) inputElement.required = true;
            formControl.appendChild(inputElement);
            break;

        case 'select':
            inputElement = document.createElement('select');
            inputElement.className = `select select-bordered w-full ${field.classes || ''}`;
            if (field.id) inputElement.id = field.id;
            if (field.name) inputElement.name = field.name;
            if (field.required) inputElement.required = true;

            // Opción deshabilitada por defecto (placeholder)
            const defaultOption = document.createElement('option');
            defaultOption.disabled = true;
            defaultOption.selected = !field.defaultValue; // Seleccionada si no hay defaultValue
            defaultOption.textContent = field.placeholder || `Selecciona ${field.label || 'una opción'}`;
            inputElement.appendChild(defaultOption);

            // Llenar opciones
            if (field.options && Array.isArray(field.options)) {
                field.options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt.value;
                    option.textContent = opt.text;
                    if (field.defaultValue === opt.value) {
                         option.selected = true;
                         // Si hay valor por defecto, deseleccionar la opción placeholder
                         defaultOption.selected = false;
                    }
                    inputElement.appendChild(option);
                });
            }
            formControl.appendChild(inputElement);
            break;

        case 'radio':
        case 'checkbox':
            // Usar el label principal como título del grupo
            if (labelElement) {
                 labelElement.querySelector('.label-text').classList.add('font-semibold'); // Estilo de título
                 formControl.appendChild(labelElement); // Añadir el label del grupo aquí
            }

            const optionsContainer = document.createElement('div');
             // Ajusta las clases flex según necesites (columna por defecto)
            optionsContainer.className = `flex flex-col space-y-2 ${field.inline ? 'sm:flex-row sm:space-x-4 sm:space-y-0' : ''}`;

            if (field.options && Array.isArray(field.options)) {
                field.options.forEach(opt => {
                    const optionControl = document.createElement('div');
                    optionControl.className = 'form-control';

                    const optionLabel = document.createElement('label');
                    optionLabel.className = 'label cursor-pointer justify-start space-x-3';

                    const optionInput = document.createElement('input');
                    optionInput.type = field.type;
                    // Asegurar name para radio buttons, puede ser array para checkboxes
                    optionInput.name = field.type === 'radio' ? field.name : `${field.name || field.id}[]`;
                    optionInput.value = opt.value;
                    optionInput.className = `${field.type} ${field.type === 'radio' ? 'radio-primary' : 'checkbox-secondary'} ${field.classes || ''}`; // Clases DaisyUI por defecto

                    // Marcar si es el valor por defecto (o si está en el array de defaults para checkbox)
                    if (field.type === 'checkbox' && Array.isArray(field.defaultValue) && field.defaultValue.includes(opt.value)) {
                         optionInput.checked = true;
                    } else if (field.defaultValue === opt.value) {
                        optionInput.checked = true;
                    }
                    if(field.required && field.type === 'checkbox' && field.options.length === 1) {
                        // Si es un solo checkbox obligatorio (ej. aceptar términos)
                        optionInput.required = true;
                        optionInput.id = field.id; // Usar el ID principal para este caso
                    }

                    const optionText = document.createElement('span');
                    optionText.className = 'label-text';
                    // Permite HTML en el texto de la opción (para enlaces)
                    optionText.innerHTML = opt.text;

                    optionLabel.appendChild(optionInput);
                    optionLabel.appendChild(optionText);
                    optionControl.appendChild(optionLabel);
                    optionsContainer.appendChild(optionControl);
                });
            }
            formControl.appendChild(optionsContainer);
             // formControl ya tiene mb-4, así que este elemento no necesita margen extra
             formControl.classList.remove('mb-4'); // Quitar margen extra si es grupo
            break;

        case 'submit':
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'form-control mt-6'; // Espacio antes del botón
            inputElement = document.createElement('button');
            inputElement.type = 'submit';
            inputElement.textContent = field.buttonText || 'Enviar';
            inputElement.className = field.buttonClasses || 'btn btn-primary w-full';
            buttonContainer.appendChild(inputElement);
            return buttonContainer; // Devolver el contenedor del botón directamente

         case 'heading':
             const headingElement = document.createElement('h2');
             headingElement.textContent = field.label || 'Título';
             headingElement.className = field.classes || 'text-2xl font-bold mb-6 text-center';
             return headingElement; // Devolver el título directamente

        default:
            console.warn(`Tipo de campo no soportado: ${field.type}`);
            return null;
    }

    // Añadir texto de ayuda si existe
    if (field.helpText) {
        const helpLabel = document.createElement('label');
        helpLabel.className = 'label';
        const helpTextSpan = document.createElement('span');
        helpTextSpan.className = 'label-text-alt';
        helpTextSpan.textContent = field.helpText;
        helpLabel.appendChild(helpTextSpan);
        formControl.appendChild(helpLabel);
    }

    return formControl;
}

/**
 * Genera un formulario completo y lo inserta en el elemento DOM especificado.
 * @param {string} targetElementId - El ID del elemento HTML donde se insertará el formulario.
 * @param {object} formConfig - La configuración del formulario (ver createFormElement).
 */
function renderForm(targetElementId, formConfig) {
    const targetElement = document.getElementById(targetElementId);
    if (!targetElement) {
        console.error(`Elemento con ID '${targetElementId}' no encontrado.`);
        return;
    }

    // Limpiar contenido previo
    targetElement.innerHTML = '';

    // Crear contenedor wrapper con estilos base
    const formWrapper = document.createElement('div');
    formWrapper.className = `form-wrapper ${formConfig.containerClasses || 'max-w-md mx-auto'}`; // Clases base + personalizadas

    // Añadir título si existe
    if (formConfig.title) {
        const titleElement = document.createElement('h2');
        titleElement.className = 'text-2xl font-bold mb-6 text-center'; // Clases por defecto para el título
        titleElement.textContent = formConfig.title;
        formWrapper.appendChild(titleElement);
    }

    // Crear el elemento <form>
    const formElement = createFormElement(formConfig);

    // Añadir el <form> al wrapper
    formWrapper.appendChild(formElement);

    // Añadir el wrapper completo al DOM
    targetElement.appendChild(formWrapper);
}

// --- Definiciones de Formularios ---

const simpleFormDefinition = {
    id: 'simple-form',
    title: 'Formulario Simple',
    containerClasses: 'max-w-md mx-auto', // Ancho específico para este form
    fields: [
        { type: 'text', id: 'nombre-simple', name: 'nombre', label: 'Tu Nombre', placeholder: 'Escribe tu nombre', required: true },
        { type: 'email', id: 'email-simple', name: 'email', label: 'Correo Electrónico', placeholder: 'tu@email.com', required: true },
        { type: 'password', id: 'password-simple', name: 'password', label: 'Contraseña', placeholder: '********', required: true, helpText: 'Debe tener al menos 8 caracteres.' },
        { type: 'submit', buttonText: 'Enviar' } // Botón por defecto (primary, full width)
    ]
};

const gridFormDefinition = {
    id: 'grid-form',
    title: 'Formulario en Grid',
    containerClasses: 'max-w-2xl mx-auto', // Más ancho para el grid
    gridCols: 'md:grid-cols-2', // Especificar 2 columnas en tamaño md+
    fields: [
        { type: 'text', id: 'nombre-grid', name: 'nombre', label: 'Nombre', placeholder: 'Nombre', required: true },
        { type: 'text', id: 'apellido-grid', name: 'apellido', label: 'Apellido', placeholder: 'Apellido', required: true },
        { type: 'email', id: 'email-grid', name: 'email', label: 'Correo Electrónico', placeholder: 'tu@email.com', required: true, span: 'md:col-span-2' }, // Ocupa 2 columnas
        { type: 'tel', id: 'telefono-grid', name: 'telefono', label: 'Teléfono (Opcional)', placeholder: '+34 123 456 789' },
        {
            type: 'select',
            id: 'pais-grid',
            name: 'pais',
            label: 'País',
            required: true,
            placeholder: 'Selecciona un país',
            options: [
                { value: 'ES', text: 'España' },
                { value: 'MX', text: 'México' },
                { value: 'AR', text: 'Argentina' },
                { value: 'CO', text: 'Colombia' },
                { value: 'OT', text: 'Otro' }
            ]
        },
        { type: 'textarea', id: 'mensaje-grid', name: 'mensaje', label: 'Mensaje', placeholder: 'Escribe tu mensaje aquí...', span: 'md:col-span-2' }, // Ocupa 2 columnas
        { type: 'submit', buttonText: 'Registrarse', buttonClasses: 'btn btn-secondary w-full md:w-auto md:ml-auto' } // Botón secundario, ancho auto en md+ y alineado derecha
    ]
};

const optionsFormDefinition = {
    id: 'options-form',
    title: 'Formulario con Opciones',
    containerClasses: 'max-w-lg mx-auto',
    fields: [
        { type: 'text', id: 'asunto-opciones', name: 'asunto', label: 'Asunto', placeholder: 'Asunto del mensaje', required: true },
        {
            type: 'radio',
            name: 'tipo_consulta', // Mismo name para todos los radios del grupo
            label: 'Tipo de Consulta',
            defaultValue: 'general', // Opción seleccionada por defecto
            inline: true, // Mostrar opciones en línea en pantallas grandes
            options: [
                { value: 'general', text: 'General' },
                { value: 'soporte', text: 'Soporte Técnico' },
                { value: 'ventas', text: 'Ventas' }
            ]
        },
        {
            type: 'checkbox',
            name: 'intereses', // El name puede ser un array (intereses[]) en el backend
            label: 'Intereses (selecciona varios)',
            // No inline por defecto (se mostrarán uno debajo del otro)
             defaultValue: ['noticias'], // Ejemplo: marcar 'noticias' por defecto
            options: [
                { value: 'noticias', text: 'Recibir Noticias' },
                { value: 'promociones', text: 'Recibir Promociones' },
                { value: 'eventos', text: 'Información sobre Eventos' }
            ]
        },
        {
            type: 'checkbox',
            id: 'terminos', // ID para el input específico
            name: 'terminos',
            required: true,
             // No necesita 'label' general, la opción es el label
            options: [
                // Permite HTML en 'text' para el enlace
                { value: 'aceptado', text: 'Acepto los <a href="#" class="link link-hover link-primary">términos y condiciones</a>' }
            ],
             classes: 'checkbox-accent' // Cambiar color del checkbox
        },
        { type: 'submit', buttonText: 'Enviar Consulta', buttonClasses: 'btn btn-accent w-full' } // Botón accent
    ]
};


// --- Renderizar los Formularios al Cargar la Página ---
/* document.addEventListener('DOMContentLoaded', () => {
    renderForm('form-container-simple', simpleFormDefinition);
    renderForm('form-container-grid', gridFormDefinition);
    renderForm('form-container-options', optionsFormDefinition);
}); */