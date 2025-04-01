/**
 * anime Form Implementation
 * This file creates a form for managing anime triggers using the FormGenerator class
 */
import { FormGenerator } from './components/formGenerator.js';
import {
  saveAnime,
  editAnime,
  saveSeason,
  getSeason,
  deleteAnime,
  deleteSeason,
  getEpisodesColumn,
  saveEpisode
} from './fetch.js';
/**
 * Initialize the anime form
 * @param {string} containerId - ID of the container element to inject the form
 */
/**
 * Generic function to get form data from modal elements
 * @param {Object} fieldMap - Object mapping data fields to DOM element IDs
 * @param {boolean} getElements - If true, returns DOM elements instead of values
 * @returns {Object} - Object containing form data or DOM elements
 */
function getFormData(fieldMap, getElements = false) {
  const formElements = {};
  const allValues = {};
  
  // Get all DOM elements based on the provided field map
  Object.keys(fieldMap).forEach(dataKey => {
    const elementId = fieldMap[dataKey];
    const element = document.querySelector(`#${elementId}`);
    if (element) {
      formElements[dataKey] = element;
      allValues[dataKey] = element.getInputValues();
    }
  });
  
  return getElements ? formElements : { ...allValues };
}

// Implementation for anime form
function getModaldata(getElements = false) {
  const fieldMap = {
    "idCatalogo": "form_id",
    "nombreCatalogo": "nombreCatalogo",
    "estadoCatalogo": "estadoCatalogo",
    "imagenFondoCatalogo": "imagenFondoCatalogo", 
    "descripcionCatalogo": "descripcionCatalogo",
    "nsfwCatalogo": "nsfwCatalogo",
    "trailerCatalogo": "trailerCatalogo",
    "id": "form_id"
  };
  
  return getFormData(fieldMap, getElements);
}

// Implementation for season form
function getseasonModaldata(getElements = false) {
  const fieldMap = {
    "id": "form_id",
    "nombre": "season_name",
    "numero": "season_num",
    "portada": "season_portada",
    "descripcion": "season_descripcion",
    "nsfw": "season_nsfw",
    "temporadaId": "temporadaId"
  };
  
  return getFormData(fieldMap, getElements);
}

// Implementation for episode form
function getEpisodeModalData(getElements = false) {
  const fieldMap = {
    "animeId": "animeId",
    "temporadaId": "temporadaId",
    "numero": "numeroCapitulo",
    "titulo": "tituloCapitulo",
    "descripcion": "descripcionCapitulo",
    "imagen": "imagenCapitulo",
    "path": "pathCapitulo",
    "idCapitulo": "form_id"
  };
  
  return getFormData(fieldMap, getElements);
}
const stateObject = {
  "emision": 1,
  "finalizado": 2,
  "proximamente": 3,
}
const miTabla = document.getElementById("miTabla")
const dataSample = {
    "idCatalogo": 1,// "number" unico  ya que lo genera el servidor// o solo se utiliza para editar
    "nombreCatalogo": "nombre",// "string"
    "estadoCatalogo": 3,// "number" id del tipo stateObject
    "imagenFondoCatalogo": "/sample.jpg",// "string" url
    "descripcionCatalogo": "descripcion",// "string"
    "nsfwCatalogo": 0,// "number" booleano 0 false 1 true
    "recomendacionCatalogo": 0,// "number" booleano 0 false 1 true
    "trailerCatalogo": "/sample.mp4",// "string" url,
    "temporadas": [],// "array" de objetos, esto lo genera el servidor
    "categorias": [],// "array" de objetos,{ "idCategoria": 1, "nombreCategoria": "Aventuras"}
}
const requiredFields = [
  "nombreCatalogo",
  "estadoCatalogo",
  "imagenFondoCatalogo",
  "descripcionCatalogo",                        
  "nsfwCatalogo",
  "trailerCatalogo"
]//  "categorias" todavia no se implementa
function initanimeForm(containerId) {
  // Define the form configuration
  const animeFormConfig = {
    formId: 'anime',
    modalId: 'animeModal',
    fields: [
      {
        id: 'nombreCatalogo',
        name: 'nombreCatalogo',
        label: 'anime Name',
        type: 'text',
        placeholder: '{{anime.name}}',
        required: true
      },
      {
        id: 'estadoCatalogo',
        name: 'estadoCatalogo',
        label: 'anime State',
        type: 'radio',
        options:JSON.stringify(Object.keys(stateObject).map(key => { return { label: key, value: stateObject[key] } })),
        required: true
      },
      {
        id: 'imagenFondoCatalogo',
        name: 'imagenFondoCatalogo',
        label: 'anime Image',
        type: 'text',
        placeholder: '{{anime.image}}',
        required: true
      },
      {
        id: 'descripcionCatalogo',
        name: 'descripcionCatalogo',
        label: 'anime Description',
        type: 'textarea',
        placeholder: '{{anime.description}}',
        required: true
      },
      {
        id: 'nsfwCatalogo',
        name: 'nsfwCatalogo',
        label: 'anime NSFW',
        type: 'checkbox',
        placeholder: '{{anime.nsfw}}',
        required: false
      },
      {
        id: 'trailerCatalogo',
        name: 'trailerCatalogo',
        label: 'anime Trailer', 
        type: 'text',
        placeholder: '{{anime.trailer}}',
        required: true
      }
    ],
    validation: {
      conditionalFields: true,
      fieldToCheck: requiredFields,
      valueToCheck: 'any',
      excludeFields: ['id']
    },
    savecallback: () => {
      const newdata = getModaldata();
      console.log('Save clicked', newdata);
      saveAnime(newdata, ()=>{
        loadAnimes();
      });
    }

  };

  // Create the form generator and initialize it
  const animeForm = new FormGenerator(animeFormConfig);
  animeForm.init(containerId);
  return animeForm;
}

function validateModaldata(data,values) {
  let isValid = true;
  Object.keys(data).forEach(key => {
    //values is array of keys to validate
    if (values && values.includes(key)) {
      if (data[key] === null || data[key] === undefined || data[key] === '') {
          isValid = false;
      }
    }
  });
  return isValid;
}
function getkeysObject(data, exclude = []) {
  let keys = [];
  Object.keys(data).forEach(key => {
    if (exclude.includes(key)) return;
    keys.push(key);
  });
  return keys;
}
async function loadAnimes() {
  try {
      const response = await fetch('http://localhost:3001/api/anime');
      const animes = await response.json();
      miTabla.setData(animes,["id","nombre"])

  } catch (error) {
      console.error('Error al cargar animes:', error);
  }
}
/** 
descripcion: "eqweqwe"
estado: 3
id: 2
imagen_fondo: "qweqw"
nombre: "qweqw"
nsfw: 1
recomendacion: 0
trailer: "qweqweqwe"
 */// /anime/:Id
/*{ numero, nombre, descripcion, portada, nsfw = false }*/ ///anime/:animeId/temporadas
const secondRequiredFields = [
  "nombre",
  "numero",
  "portada",
  "descripcion",
  "nsfw",
]
function initSeasonForm(containerId) {
  // Define the form configuration
  const seasonFormConfig = {
    formId: 'season',
    modalId: 'seasonModal',
    fields: [
      {
        id: 'season_name',
        name: 'season_name',
        label: 'Nombre',
        type: 'text',
        placeholder: '{{nombre}}',
        required: true
      },
      {
        id: 'season_num',
        name: 'season_num',
        label: 'Número',
        type: 'number',
        placeholder: '{{numero}}',
        required: true
      },
      {
        id: 'season_portada',
        name: 'season_portada',
        label: 'Portada',
        type: 'text',
        placeholder: '{{portada}}',
        required: true
      },
      {
        id: 'season_descripcion',
        name: 'season_descripcion',
        label: 'Descripción',
        type: 'textarea',
        placeholder: '{{descripcion}}',
        required: true
      },
      {
        id: 'season_nsfw',
        name: 'season_nsfw',
        label: 'NSFW',
        type: 'checkbox',
        placeholder: '{{nsfw}}',
        required: false
      },
      {
        id: 'temporadaId',
        name: 'temporadaId',
        label: 'Temporada ID',
        type: 'text',
        placeholder: '{{id}}',
        required: false
      }
    ],
    validation: {
      conditionalFields: true,
      fieldToCheck: secondRequiredFields,
      valueToCheck: 'any',
      excludeFields: ['id','season_id']
    },
    savecallback: () => {
      const newdata = getseasonModaldata();
      console.log('Save clicked', newdata);
      saveSeason(newdata, ()=>{
      });
    }

  };
  const seasonForm = new FormGenerator(seasonFormConfig);
  seasonForm.init(containerId);
  return seasonForm;
}

const episodeRequiredFields = [
  "numero",
  "titulo",
  "descripcion",
  "imagen",
  "path",
];

/**
 * Initializes the form for creating/editing an Episode.
 * @param {string} containerId - The ID of the HTML element where the form should be rendered.
 * @returns {FormGenerator} The initialized form generator instance.
 */
function initEpisodeForm(containerId) {
  // Define the form configuration for an Episode
  const episodeFormConfig = {
    // Unique IDs for the form and its modal
    formId: 'episode',
    modalId: 'episodeModal',

    // Define the fields for the episode form
    fields: [
      {
        id: 'numeroCapitulo',        // Unique HTML ID for the element
        name: 'numero',              // Corresponds to the data property name
        label: 'Número del Episodio',// User-friendly label
        type: 'number',              // Input type
        placeholder: '{{numero}}',   // Placeholder, possibly for template filling
        required: true               // Is this field mandatory?
      },
      {
        id: 'tituloCapitulo',
        name: 'titulo',
        label: 'Título del Episodio',
        type: 'text',
        placeholder: '{{titulo}}',
        required: true
      },
      {
        id: 'descripcionCapitulo',
        name: 'descripcion',
        label: 'Descripción',
        type: 'textarea',            // Use textarea for potentially longer descriptions
        placeholder: '{{descripcion}}',
        required: true
      },
      {
        id: 'imagenCapitulo',
        name: 'imagen',
        label: 'Imagen (URL)',      // Specify URL might be helpful
        type: 'text',               // Assuming URL input
        placeholder: '{{imagen}}',
        required: true
      },
      {
        id: 'pathCapitulo',
        name: 'path',
        label: 'Ruta/URL del Video', // Specify URL/Path might be helpful
        type: 'text',               // Assuming URL or path input
        placeholder: '{{path}}',
        required: true
      },
      // Optional: Add an ID field if you need to handle updates
      {
          id: 'animeId',
          name: 'animeId',
          label: 'animeId',
          type: 'number', // Could be 'hidden' if your FormGenerator supports it
          placeholder: '{{id}}',
          required: false // Usually not required for creation, needed for updates
      },
      {
          id: 'temporadaId',
          name: 'temporadaId',
          label: 'temporadaId',
          type: 'number', // Could be 'hidden' if your FormGenerator supports it
          placeholder: '{{id}}',
          required: false // Usually not required for creation, needed for updates
      }
    ],

    // Validation configuration, similar to your examples
    validation: {
      conditionalFields: true,         // Keep consistency
      fieldToCheck: episodeRequiredFields, // Use the defined required fields
      valueToCheck: 'any',             // Keep consistency
      excludeFields: ['id']            // Exclude the ID from this basic check
    },

    // Callback function when the save button is clicked
    savecallback: () => {
      // Assume a function exists to retrieve data from this specific modal
      // You might need to create getEpisodeModalData() similar to your others
      const episodeData = getEpisodeModalData(); // You'll need to implement this function
      console.log('Save Episode clicked', episodeData);

      // Assume a function exists to save/update the episode data
      // You'll need to implement saveEpisode()
      saveEpisode(episodeData, () => {
        // Optional callback after save, e.g., close modal, refresh list
        console.log('Episode save initiated. Implement post-save logic (e.g., refresh).');
        // Example: maybe reload episodes for the current season
        // if (typeof loadEpisodes === 'function') {
        //    loadEpisodes(currentSeasonId); // Assuming you have currentSeasonId available
        // }
      });
    }
  };

  // Create the form generator instance with the configuration
  const episodeForm = new FormGenerator(episodeFormConfig);
  // Initialize the form in the specified container
  episodeForm.init(containerId);
  // Return the instance for potential further interaction
  return episodeForm;
}

const miBarra = document.getElementById('mi-barra');
const second_bar = document.getElementById('second_bar');
function setupTableEventListeners() {
  const secondTabla = document.getElementById("secondTabla");
  const thirdTabla = document.getElementById("thirdTabla");
  miTabla.addEventListener('edit-item', (event) => {
      const item = event.detail; // El objeto completo está en event.detail
      console.log(item)
      const editform =  initanimeForm("modal-form-catalogo");
      editAnime(item.id, (editdata)=>{
              editform.setFormData(editdata);
      });
  });
  miTabla.addEventListener('delete-item', (event) => {
    const DeleteItem = event.detail;
    console.log('Evento ELIMINAR recibido:', DeleteItem);
    deleteAnime(DeleteItem.id, ()=>{
      loadAnimes();
    })
  });
  miTabla.addAction('select-column', 'select', 'select-column');
  miTabla.addEventListener('select-column',async (event) => {
    const selectColumn = event.detail;
    miBarra.data = selectColumn;
    const result = await getSeason(selectColumn);
    console.log("result",result);
    secondTabla.setData(result,["animeId","temporadaId","nombreTemporada"])
  });

  const botones = [
    { action: 'add', text: 'Añadir', icon: '➕' }, // Emoji como icono
    // Ejemplo si usaras FontAwesome (necesitarías el CSS de FontAwesome)
    // { action: 'delete', text: 'Borrar', icon: '<i class="fas fa-trash"></i>' },
    { action: 'settings', text: 'Ajustes', icon: '⚙️' }
  ];

  // Asignar los botones al componente
  miBarra.buttons = botones;
  // Escuchar el evento 'action' que emite el componente
  miBarra.addEventListener('action', (event) => {
      const { action, data } = event.detail;
      console.log('Evento "action" recibido:', event.detail);
      if (action === 'add' && data) {
          console.log('Botón "Añadir" ha sido presionado con datos:', data);
          const modal =  initSeasonForm("modal-form-season");
          modal.setFormData({id: data.id});
      }
  });
  secondTabla.addEventListener('edit-item', (event) => {
      const item = event.detail; // El objeto completo está en event.detail
      const editdata ={
        ...item, // Copia todas las propiedades del objeto original
        season_num: item.numeroTemporada,
        season_name: item.nombreTemporada,
        season_descripcion: item.descripcionTemporada,
        season_portada: item.portadaTemporada,
        season_nsfw: item.nsfw,
        id: item.animeId
      }
      console.log(editdata)

      const editform =  initSeasonForm("modal-form-season");
      editform.setFormData(editdata);
  });
  secondTabla.addEventListener('delete-item', (event) => {
    const DeleteItem = event.detail;
    console.log('Evento ELIMINAR recibido:', DeleteItem);
    deleteSeason(DeleteItem, ()=>{
    })
  });
  secondTabla.addAction('select-column', 'select', 'select-column');
  secondTabla.addEventListener('select-column',async (event) => {
    const selectColumn = event.detail;
    second_bar.data = selectColumn;
    const result = await getEpisodesColumn(selectColumn);
    console.log("result",result);
    thirdTabla.setData(result,["temporadaId","idCapitulo","numeroCapitulo","descripcionCapitulo"])  });
  second_bar.buttons = botones;
  // Escuchar el evento 'action' que emite el componente
  second_bar.addEventListener('action', (event) => {
      const { action, data } = event.detail;
      console.log('Evento "action" recibido:', event.detail);
      if (action === 'add' && data) {
          console.log('Botón "Añadir" ha sido presionado con datos:', data);
          const modal =  initEpisodeForm("modal-form-episode");
          modal.setFormData({animeId: data.animeId, temporadaId: data.temporadaId});
      }
  });
  thirdTabla.addEventListener('edit-item', (event) => {
      const item = event.detail; // El objeto completo está en event.detail
      const editdata ={
       ...item, // Copia todas las propiedades del objeto original
      id : item.idCapitulo,
      }
      console.log(editdata)

      const editform =  initEpisodeForm("modal-form-episode");
      editform.setFormData(editdata);
  });
  thirdTabla.addEventListener('delete-item', (event) => {
    const DeleteItem = event.detail;
    console.log('Evento ELIMINAR recibido:', DeleteItem);
  //  deleteEpisode(DeleteItem, ()=>{})
  });
}

loadAnimes();
setupTableEventListeners();

// Configurar los botones que queremos mostrar

export { initanimeForm, initSeasonForm};