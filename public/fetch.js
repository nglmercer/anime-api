/*{ numero, nombre, descripcion, portada, nsfw = false }*/ ///anime/:animeId/temporadas
const BaseUrl = 'http://localhost:3001';
async function saveAnime(anime, cb = () => {}) {
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
      nombre: anime.nombreCatalogo,
      estado: anime.estadoCatalogo,
      imagenFondo: anime.imagenFondoCatalogo,
      descripcion: anime.descripcionCatalogo,
      nsfw: anime.nsfwCatalogo,
      trailer: anime.trailerCatalogo,
    };  
  
    try {
        const url = sendData.idCatalogo ? `/api/anime/${sendData.idCatalogo}` : '/api/anime';
        const method =  sendData.idCatalogo ? 'PUT' : 'POST';   
        console.log("saveAnime", anime, sendData, url, method);
        const response = await fetch(BaseUrl + url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sendData),
        });
        
        if (response.ok) {
            if (cb) cb();
        } else {
            console.error('Error al guardar anime:', await response.text());
        }
    } catch (error) {
        console.error('Error al guardar anime:', error);
    }
  }
  
  // Función para eliminar un anime
  async function editAnime(id,editform) {
    try {
      const response = await fetch(BaseUrl + `/api/anime/${id}`);
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
        "nombre": anime.nombre,
        "estado": anime.estado,
        "imagenFondo": anime.imagen_fondo,
        "descripcion": anime.descripcion,
        "nsfw": anime.nsfw,
        "trailer": anime.trailer,
      }
      console.log('Editando anime:', anime, editdata);
      editform.setFormData(editdata);
    } catch (error) {
      console.error('Error al cargar anime para editar:', error);
    }
  
  }
  async function getSeason(data, cb = () => {}){
    try {
      const response = await fetch(BaseUrl +'/api/anime/'+data.id+"/temporadas", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const column = await response.json();
      if (cb) cb();
      console.log(column);
      return column;
    } catch (error) {
      console.error('Error al obtener columna:', error);
    }
  }
  async function getEpisodesColumn(data, cb = () => {}) {
    const id = data.animeId;
    try {
      const response = await fetch(BaseUrl +'/api/anime/'+id+"/temporadas/"+data.temporadaId+"/capitulos", {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }); 
      const column = await response.json();
      console.log(column);
      if (cb) cb();
      return column;
    } catch (error) {
      console.error('Error al obtener columna:', error);
    }
  }
  async function saveSeason(data, cb = () => {}) {
    // estructure { numero, nombre, descripcion, portada, nsfw = false }
    const method = data.temporadaId ? 'PUT' : 'POST';
    const url = data.temporadaId ? `/api/anime/${data.id}/temporadas/${data.temporadaId}` : '/api/anime/'+data.id+"/temporadas";
    try {
      const response = await fetch(BaseUrl + url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const column = await response.json();
      if (cb) cb();
      return column;
    } catch (error) {
      console.error('Error al obtener columna:', error);
    }
  }
  async function saveEpisode(data) {
    //'/anime/:animeId/temporadas/:temporadaId/capitulos'
    /*            numero, 
            titulo, 
            descripcion, 
            imagen, 
            path, */
    const method = data.idCapitulo ? 'PUT' : 'POST';
    const url = data.idCapitulo ? `/api/anime/${data.animeId}/temporadas/${data.temporadaId}/capitulos/${data.idCapitulo}` : '/api/anime/'+data.animeId+"/temporadas/"+data.temporadaId+"/capitulos";
    try {
      console.log("saveEpisode", data, url, method);
      const response = await fetch(BaseUrl + `/api/anime/${data.animeId}/temporadas/${data.temporadaId}/capitulos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const column = await response.json();
      console.log(column);
      return column;
    } catch (error) {
      console.error('Error al obtener columna:', error);
    }
  }
  async function deleteAnime(id, cb = () => {}) {
    if (confirm('¿Estás seguro de eliminar este anime?')) {
        try {
            const response = await fetch(`/api/anime/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                if (cb) cb();
            } else {
                console.error('Error al eliminar anime:', await response.text());
            }
        } catch (error) {
            console.error('Error al eliminar anime:', error);
        }
    }
  }
  async function deleteSeason(data, cb = () => {}) {
    const { animeId, temporadaId } = data;
    if (!animeId || !temporadaId) return;
    if (confirm('¿Estás seguro de eliminar esta temporada?')) {
        try {
          ///anime/:animeId/temporadas/:temporadaId
            const response = await fetch(`/api/anime/${animeId}/temporadas/${temporadaId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                if (cb) cb();
            } else {
                console.error('Error al eliminar temporada:', await response.text());
            }
        } catch (error) {
            console.error('Error al eliminar temporada:', error);
        }
    }
  }
  export {
    saveAnime,
    editAnime,
    saveSeason,
    getSeason,
    deleteAnime,
    deleteSeason,
    getEpisodesColumn,
    saveEpisode
  }