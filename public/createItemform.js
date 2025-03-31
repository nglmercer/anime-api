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
  deleteSeason
} from './fetch.js';
/**
 * Initialize the anime form
 * @param {string} containerId - ID of the container element to inject the form
 */
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
function getModaldata(getelements = false) {
  let allvalues = [];
  const anime_name = document.querySelector('#nombreCatalogo');
  const anime_statenum = document.querySelector('#estadoCatalogo');
  const anime_imgurl = document.querySelector('#imagenFondoCatalogo');
  const anime_description = document.querySelector('#descripcionCatalogo');
  const anime_nsfw = document.querySelector('#nsfwCatalogo');
  const anime_trailer = document.querySelector('#trailerCatalogo');
  const anime_id = document.querySelector('#form_id');
//const form_id = document.querySelector('#form_id');
  const formelements = {
    "idCatalogo": anime_id,
    'nombreCatalogo': anime_name,
    'estadoCatalogo': anime_statenum,
    'imagenFondoCatalogo': anime_imgurl,
    'descripcionCatalogo': anime_description,
    'nsfwCatalogo': anime_nsfw,
    'trailerCatalogo': anime_trailer,
    "id": anime_id,
  }
  Object.keys(formelements).forEach(key => {
    allvalues[key] = formelements[key].getInputValues();
    // format form with resetInputValues
    //  formelements[key].resetInputValues();
  });
  //console.log(formelements);
  if (getelements) return formelements;
  return { ...allvalues };
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
        id: 'idTemporada',
        name: 'idTemporada',
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
function getseasonModaldata(getelements = false) {
  let allvalues = [];
  const season_name = document.querySelector('#season_name');
  const season_num = document.querySelector('#season_num');
  const season_portada = document.querySelector('#season_portada');
  const season_descripcion = document.querySelector('#season_descripcion');
  const season_nsfw = document.querySelector('#season_nsfw');
  const anime_id = document.querySelector('#form_id');
  const season_id = document.querySelector('#idTemporada');
  const formelements = {
    "id": anime_id,
    'nombre': season_name,
    'numero': season_num,
    'portada': season_portada,
    'descripcion': season_descripcion,
    'nsfw': season_nsfw,
    'idTemporada': season_id,
  }
  Object.keys(formelements).forEach(key => {
    allvalues[key] = formelements[key].getInputValues();
    // format form with resetInputValues
    //  formelements[key].resetInputValues();
  });
  //console.log(formelements);
  if (getelements) return formelements;
  return { ...allvalues };
}
const miBarra = document.getElementById('mi-barra');

function setupTableEventListeners() {
  const secondTabla = document.getElementById("secondTabla");
  miTabla.addEventListener('edit-item', (event) => {
      const item = event.detail; // El objeto completo está en event.detail
      console.log(item)
      const editform =  initanimeForm("modal-form-catalogo");
      editAnime(item.id, editform)
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
    secondTabla.setData(result,["animeId","idTemporada","nombreTemporada"])
  });

  const botones = [
    { action: 'add', text: 'Añadir', icon: '➕' }, // Emoji como icono
    { action: 'save', text: 'Guardar', icon: '💾' }, // Emoji
      // Ejemplo si usaras FontAwesome (necesitarías el CSS de FontAwesome)
    // { action: 'delete', text: 'Borrar', icon: '<i class="fas fa-trash"></i>' },
    { action: 'delete', text: 'Borrar', icon: '🗑️' },
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
}

loadAnimes();
setupTableEventListeners();

// Configurar los botones que queremos mostrar

export { initanimeForm, initSeasonForm};