import { FrmGen } from './components/formGenerator.js';
import {
  saveAnime,
  editAnime,
  saveSeason,
  getSeason,
  deleteAnime,
  deleteSeason,
  getEpisodesColumn,
  saveEpisode,
  deleteEpisode,
  returnAnimes
} from './fetch.js';
const gridManager = document.getElementById('grid-manager');

// Same field configs as before
const userFieldConfigs = {
    id: { label: 'ID', type: 'number', readonly: true }, // Readonly in edit mode
    nombre: { label: 'Name', type: 'text', required: true, placeholder: 'Enter full name' },
    imagen_fondo: { label: 'Image', type: 'text', required: true, title: 'Enter a valid URL' },
    trailer: { label: 'trailer', type: 'text', required: true, title: 'Enter a valid URL' },
    descripcion: { label: 'descripcion', type: 'text', title: 'enter a valid description' },
    nsfw: { label: 'NSFW', type: 'switch', trueLabel: 'NSFW', falseLabel: 'SFW' },
    recomendacion: { label: 'Recomendacion', type: 'switch', trueLabel: 'Recomendado', falseLabel: 'No Recomendado' },
};
/*
id	2
nombre	"qweqw123"
imagen_fondo	"qweqw1123"
estado	3
descripcion	"eqweqwe1123"
nsfw	1
trailer	"qweqweqwe1123"
recomendacion	0
*/
// Initial user data
let currentUserData = {
    id: null,
    nombre: "qweqw123",
    imagen_fondo: "qweqw1123",
    estado: 3,
    descripcion: "eqweqwe1123",
    nsfw: 1,
    trailer: "qweqweqwe1123",
    recomendacion: 0
};

// Set initial data and config

// Add a custom action (shows up in display mode only)
function createelements(array){
    if (array && Array.isArray(array)) {
        gridManager.innerHTML = ''; // Clear existing grids
        array.forEach(element => {
            const grid_object = document.createElement('dynamic-object-display');
            grid_object.setConfig(element, userFieldConfigs);
            grid_object.addAction('view-detail', 'Seasons', 'btn-secondary'); // Example class
            grid_object.addEventListener('item-updated', (event) => {
                console.log('Profile Updated!', event.detail);
                // Update our local data store (important!)
                console.log('Profile saved successfully!');
                // Maybe update other parts of the UI
            });
        
            grid_object.addEventListener('delete-item', (event) => {
                console.log('Delete Requested:', event.detail);
                if (confirm(`Are you sure you want to delete user ${event.detail.name}?`)) {
                    console.log(`Simulating delete ${event.detail.id}...`);
                    // Call your API to delete the user
                    // On success, you might remove this component from the DOM
                    // grid_object.remove();
                }
            });
        
            grid_object.addEventListener('view-detail', (event) => {
                console.log('Custom Action:', event.detail);
            });
            gridManager.appendChild(grid_object);
        });
    }

}
loadAnimes([currentUserData]);
async function loadAnimes() {
  returnAnimes((animes)=>{
      createelements(animes)
  })
}