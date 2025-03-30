/**
 * anime Form Implementation
 * This file creates a form for managing anime triggers using the FormGenerator class
 */
import { FormGenerator } from './components/formGenerator.js';
/**
 * Initialize the anime form
 * @param {string} containerId - ID of the container element to inject the form
 */
const stateObject = {
  "emision": 1,
  "finalizado": 2,
  "proximamente": 3,
}
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
      saveAnime(newdata);
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
      
      const tableBody = document.getElementById('animeTable');
      tableBody.innerHTML = '';
      
      animes.forEach(anime => {
          const row = document.createElement('tr');
          row.innerHTML = `
              <td>${anime.id}</td>
              <td>${anime.nombre}</td>
              <td>${anime.imagen_fondo ? `<img src="${anime.imagen_fondo}" class="w-16 h-16 object-cover">` : 'Sin imagen'}</td>
              <td>
                  <button class="btn btn-sm btn-info mr-2" data-id="${anime.id}">Editar</button>
                  <button class="btn btn-sm btn-error" data-id="${anime.id}">Eliminar</button>
              </td>
          `;
          tableBody.appendChild(row);
      });
  } catch (error) {
      console.error('Error al cargar animes:', error);
  }
}


async function saveAnime(anime) {
  //transformar descripcionCatalogo de array a string
  //estadoCatalogo to number
  const sendData = {
    ...anime, // Copia todas las propiedades del objeto original
    descripcionCatalogo: Array.isArray(anime.descripcionCatalogo) 
      ? anime.descripcionCatalogo.join(' ') 
      : anime.descripcionCatalogo, // Se asegura de que sea string
    nsfwCatalogo: anime.nsfwCatalogo ? 1 : 0,
    recomendacionCatalogo: anime.recomendacionCatalogo ? 1 : 0,
    estadoCatalogo: parseInt(anime.estadoCatalogo),
  };  

  try {
      const url = sendData.idCatalogo ? `http://localhost:3001/api/anime/${sendData.idCatalogo}` : 'http://localhost:3001/api/anime';
      const method =  sendData.idCatalogo ? 'PUT' : 'POST';   
      console.log("saveAnime", anime, sendData, url, method);
      const response = await fetch(url, {
          method,
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(sendData),
      });
      
      if (response.ok) {
          loadAnimes();
      } else {
          console.error('Error al guardar anime:', await response.text());
      }
  } catch (error) {
      console.error('Error al guardar anime:', error);
  }
}

// Función para eliminar un anime
async function editAnime(id) {
  try {
    const response = await fetch(`http://localhost:3001/api/anime/${id}`);
    const anime = await response.json();
    
    // Aquí deberías implementar la lógica para editar el anime
    const editdata ={
      "idCatalogo": anime.id,
      "nombreCatalogo": anime.nombre,
      "estadoCatalogo": anime.estado,
      "imagenFondoCatalogo": anime.imagen_fondo,
      "descripcionCatalogo": anime.descripcion,
      "nsfwCatalogo": anime.nsfw,
      "trailerCatalogo": anime.trailer,
      "id": anime.id,
    }
    console.log('Editando anime:', anime, editdata);
    const editform =  initanimeForm("modal-form-catalogo");
    editform.setFormData(editdata);
  } catch (error) {
    console.error('Error al cargar anime para editar:', error);
  }

}
/**
descripcion: "eqweqwe"
​
estado: 3
​
id: 2
​
imagen_fondo: "qweqw"
​
nombre: "qweqw"
​
nsfw: 1
​
recomendacion: 0
​
trailer: "qweqweqwe"
 */
async function deleteAnime(id) {
  if (confirm('¿Estás seguro de eliminar este anime?')) {
      try {
          const response = await fetch(`http://localhost:3001/api/anime/${id}`, {
              method: 'DELETE'
          });
          
          if (response.ok) {
              loadAnimes();
          } else {
              console.error('Error al eliminar anime:', await response.text());
          }
      } catch (error) {
          console.error('Error al eliminar anime:', error);
      }
  }
}

function setupTableEventListeners() {
  const table = document.getElementById('animeTable');
  if (table) {
    table.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.btn-info');
      const deleteBtn = e.target.closest('.btn-error');
      
      if (editBtn) {
        const id = editBtn.getAttribute('data-id');
        editAnime(id);
      } else if (deleteBtn) {
        const id = deleteBtn.getAttribute('data-id');
        deleteAnime(id);
      }
    });
  }
}

loadAnimes();
setupTableEventListeners();
export { initanimeForm};