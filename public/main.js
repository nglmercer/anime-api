import {initanimeForm} from './createItemform.js';
// Función para cargar los animes desde la API


// Cargar los animes al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector("#abrir-modal-catalogo-btn").addEventListener("click",()=>{
        initanimeForm("modal-form-catalogo");
    });
});
