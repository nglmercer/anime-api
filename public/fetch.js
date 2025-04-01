import { dataUtils } from './utils/types.js';
const BASE_URL = 'http://localhost:3001';

const apiRequest = async (url, method = 'GET', data = null) => {
  try {
    const response = await fetch(`${BASE_URL}${url}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      ...(data && { body: JSON.stringify(data) }),
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return response.status === 204 ? null : await response.json();
  } catch (error) {
    console.error(`Error en ${method} ${url}:`, error);
    throw error;
  }
};

const transformAnimeData = (anime) => ({
  ...anime,
  descripcionCatalogo: dataUtils.joinArrayToText(anime.descripcionCatalogo),
  nsfwCatalogo: anime.nsfwCatalogo ? 1 : 0,
  recomendacionCatalogo: anime.recomendacionCatalogo ? 1 : 0,
  estadoCatalogo: parseInt(anime.estadoCatalogo),
  nombre: anime.nombreCatalogo,
  estado: anime.estadoCatalogo,
  imagenFondo: anime.imagenFondoCatalogo,
  descripcion: anime.descripcionCatalogo,
  nsfw: anime.nsfwCatalogo,
  trailer: anime.trailerCatalogo,
});

export const saveAnime = async (anime, callback = () => {}) => {
  const data = transformAnimeData(anime);
  const url = data.idCatalogo ? `/api/anime/${data.idCatalogo}` : '/api/anime';
  const method = data.idCatalogo ? 'PUT' : 'POST';
  
  await apiRequest(url, method, data);
  callback();
};

export const editAnime = async (id, callback = () => {}) => {
  const anime = await apiRequest(`/api/anime/${id}`);
  const editData = {
    idCatalogo: anime.id,
    nombreCatalogo: anime.nombre,
    estadoCatalogo: anime.estado,
    imagenFondoCatalogo: anime.imagen_fondo,
    descripcionCatalogo: anime.descripcion,
    nsfwCatalogo: anime.nsfw,
    trailerCatalogo: anime.trailer,
    id: anime.id,
    nombre: anime.nombre,
    estado: anime.estado,
    imagenFondo: anime.imagen_fondo,
    descripcion: anime.descripcion,
    nsfw: anime.nsfw,
    trailer: anime.trailer,
  };
  
  callback(editData);
  return editData;
};

export const getSeason = async (data, callback = () => {}) => {
  const seasons = await apiRequest(`/api/anime/${data.id}/temporadas`);
  callback();
  return seasons;
};

export const getEpisodesColumn = async (data, callback = () => {}) => {
  const { animeId, temporadaId } = data;
  const episodes = await apiRequest(`/api/anime/${animeId}/temporadas/${temporadaId}/capitulos`);
  callback();
  return episodes;
};

export const saveSeason = async (data, callback = () => {}) => {
  const url = data.temporadaId 
    ? `/api/anime/${data.id}/temporadas/${data.temporadaId}` 
    : `/api/anime/${data.id}/temporadas`;
  const method = data.temporadaId ? 'PUT' : 'POST';
  
  const season = await apiRequest(url, method, data);
  callback();
  return season;
};

export const saveEpisode = async (data, callback = () => {}) => {
  const url = data.capituloId 
    ? `/api/anime/${data.animeId}/temporadas/${data.temporadaId}/capitulos/${data.capituloId}`
    : `/api/anime/${data.animeId}/temporadas/${data.temporadaId}/capitulos`;
  const method = data.capituloId ? 'PUT' : 'POST';
  
  const episode = await apiRequest(url, method, data);
  callback?.();
  return episode;
};

export const deleteAnime = async (id, callback = () => {}) => {
  if (!confirm('¿Estás seguro de eliminar este anime?')) return;
  
  await apiRequest(`/api/anime/${id}`, 'DELETE');
  callback();
};

export const deleteSeason = async (data, callback = () => {}) => {
  const { animeId, temporadaId } = data;
  if (!animeId || !temporadaId || !confirm('¿Estás seguro de eliminar esta temporada?')) return;
  
  await apiRequest(`/api/anime/${animeId}/temporadas/${temporadaId}`, 'DELETE');
  callback();
};
//.delete('/anime/:animeId/temporadas/:temporadaId/capitulos/:capituloId
export const deleteEpisode = async (data, callback = () => {}) => {
  const { animeId, temporadaId, capituloId } = data;
  if (!animeId || !temporadaId || !capituloId || !confirm('¿Estás seguro de eliminar este capítulo?')) return;
  console.log(`/api/anime/${animeId}/temporadas/${temporadaId}/capitulos/${capituloId}`,)
  await apiRequest(`/api/anime/${animeId}/temporadas/${temporadaId}/capitulos/${capituloId}`, 'DELETE');
  callback();
};