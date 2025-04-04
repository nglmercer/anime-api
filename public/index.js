import { FrmGen } from './components/formGenerator.js';
import {
  saveAnime,
  editAnime,
  saveSeason,
  getSeason,
  getSeasonId,
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
const appContainer = document.getElementById('nav_maincontnt');
// Add a custom action (shows up in display mode only)
function createelements(array){
    if (array && Array.isArray(array)) {
        gridManager.innerHTML = ''; // Clear existing grids
        array.forEach(element => {
            const grid_object = document.createElement('dynamic-object-display');
            grid_object.setConfig(element, userFieldConfigs);
            grid_object.setAttribute('darkmode', ''); // Optionally set dark mode
            grid_object.addAction('view-detail', 'Seasons', 'btn-secondary'); // Example class
            grid_object.addEventListener('item-updated', (event) => {
                console.log('Profile Updated!', event.detail);
                // Update our local data store (important!)
                console.log('Profile saved successfully!');
                // Maybe update other parts of the UI
            });
        
            grid_object.addEventListener('delete-item', (event) => {
                console.log('Delete Requested:', event.detail);
                    console.log(`Simulating delete ${event.detail.id}...`);
                    // Call your API to delete the user
                    // On success, you might remove this component from the DOM
                    // grid_object.remove();
                
            });
        
            grid_object.addEventListener('view-detail',async (event) => {
                console.log('Custom Action:', event.detail)
                    const selectColumn = event.detail;
                    const result = await getSeason(selectColumn);
                    console.log("result",result);
                    renderSeasonsView(result, selectColumn);
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
async function renderSeasonsView(seriesData = [], data) {
    const { id, nombre } = data
    const parsedSeasons = mapSeason(seriesData);
    if (!seriesData) {
        console.error(`Serie con ID ${id} no encontrada.`);
        appContainer.innerHTML = `<p>Error: Serie no encontrada.</p><button class="back-button">Volver</button>`;
        return;
    }

    appContainer.innerHTML = `
        <div class="view-header">
            <h2>Temporadas de "${nombre}"</h2>
        </div>
        <div id="seasons-list-container"></div>
          <div id="add-season-button-placeholder">
            <button data-series-id="${id}">+ Añadir Temporada</button>
        </div>
    `;
    appContainer.querySelector('#add-season-button-placeholder button')
        .addEventListener('click', () => handleAddSeason(id));

    const seasonListContainer = appContainer.querySelector('#seasons-list-container');
    const seasonListElement = document.createElement('season-list');
    seasonListContainer.appendChild(seasonListElement);
    seasonListElement.setSeasons(parsedSeasons || [], id);
}

async function renderEpisodesView(data ,selectColumn) {
    const { id, seasonId } = data
    const result = await getSeasonId(selectColumn);
    const seriesData = result
    const seasonData = selectColumn;
    const parsedEpisodes = mapEpisode(seasonData.capitulos|| []);
    if (!seriesData || !seasonData) {
        console.error(`Datos no encontrados para Series ID: ${id} o Season ID: ${seasonId}`);
        appContainer.innerHTML = `<p>Error: Temporada no encontrada.</p><button class="back-button">Volver</button>`;
        const backButton = appContainer.querySelector('.back-button');
        if(id) {
            backButton.textContent = `← Volver a Temporadas de "${seriesData?.title || 'Serie'}"`;
            backButton.onclick = () => renderSeasonsView(seriesData,selectColumn);
        } else {
            backButton.textContent = `← Volver a Series`;
        }
        return;
    }

    appContainer.innerHTML = '';

    const episodeListElement = document.createElement('episode-list');
    const seasonInfo = {
        ...data,
        id: seasonData.id,
        number: seasonData.number,
        title: seasonData.title,
    };
    console.log("seasonInfo",seasonData,result,parsedEpisodes)
    episodeListElement.setSeasonData(parsedEpisodes || [], seasonInfo);
    appContainer.appendChild(episodeListElement);

    const addEpisodeBtnContainer = document.createElement('div');
    addEpisodeBtnContainer.style.marginTop = '20px';
    addEpisodeBtnContainer.innerHTML = `<button data-series-id="${id}" data-season-id="${seasonId}">+ Añadir Capítulo a esta Temporada</button>`;
    addEpisodeBtnContainer.querySelector('button').onclick = () => handleAddEpisode(id, seasonId);
    appContainer.appendChild(addEpisodeBtnContainer);
}
function mapSeason(data) {
    // Asegúrate que 'data' sea un array
    if (!Array.isArray(data)) {
         console.error("mapSeason esperaba un array, recibió:", data);
         return [];
    }
    return data.map(item => {
         // Comprobación básica del item
         if (!item || typeof item !== 'object') {
             console.warn("mapSeason saltando item inválido:", item);
             return null; // Marcar para filtrar después
         }
         // Asegúrate de que las propiedades esperadas existan o usa valores por defecto
         const numeroTemporada = item.numeroTemporada ?? 'N/A';
         const nombreTemporada = item.nombreTemporada ?? '';
         const temporadaId = item.temporadaId ?? null; // ID único de la temporada
         const animeId = item.animeId ?? null; // ID de la serie a la que pertenece
         const capitulos = item.capitulos || []; // ¡IMPORTANTE! Preservar los capítulos

         if (temporadaId === null || animeId === null) {
             console.warn("mapSeason saltando item con IDs faltantes:", item);
             return null;
         }

        return {
            ...item, // Opcional: mantener otras propiedades originales si se necesitan
            number: numeroTemporada,
            title: nombreTemporada,
            id: animeId,       // ID de la temporada para identificarla
            seasonId: temporadaId, // Puede ser redundante si usas 'id' consistentemente
            animeId: animeId,      // ID de la serie padre
            capitulos: capitulos   // Incluir el array de capítulos
        };
    }).filter(item => item !== null); // Eliminar cualquier item inválido que se marcó como null
}
function mapEpisode(data) {
    return data.map(item => ({
        ...item,
        number: item.numeroCapitulo,
        title: item.nombreCapitulo || item.tituloCapitulo,
        seasonId: item.temporadaId,
        id: item.capituloId
    }));
}
appContainer.addEventListener('component-action',async  (e) => {
    const { action, data, component, sourceId } = e.detail;
    console.log(`Acción: ${action}, Componente: ${component}, ID: ${sourceId}`, data);
    
    // Ejecutar la acción basada en el tipo
    switch(action) {
        case 'view-capitulos':
            renderEpisodesView(data.season,data.season);
            break;
        case 'back-to-seasons':
            console.log("Acción back-to-seasons recibida:",data)
            const result = await getSeason(data.seasonInfo);
            renderSeasonsView(result, data.seasonInfo);
            break;
        default:
            console.log(`Acción no manejada: ${action}`);
    }
});