const dataUtils = {
    // Convierte string numérico a número, retorna el valor original si no es convertible
    toNumber: (value) => {
      if (typeof value === 'string' && !isNaN(value) && value.trim() !== '') {
        return parseInt(value, 10);
      }
      return value;
    },
  
    // Convierte 0/1 a booleano, o string '0'/'1' a booleano
    toBoolean: (value) => {
      if (typeof value === 'string') {
        return value.trim() === '1';
      }
      return !!value; // Convierte a booleano cualquier otro valor
    },
    Booleantonumber: (value) => {
      return value ? 1 : 0;
    },
    // Une array de strings con saltos de línea, retorna string tal cual si no es array
    joinArrayToText: (value) => {
      return Array.isArray(value) 
        ? value.join('\n') 
        : String(value); // Asegura que siempre retorne string
    },
  
    // Combinación útil: convierte array a texto y lo retorna como string
    arrayToStringLines: (value) => {
      return dataUtils.joinArrayToText(value);
    }
  };
export {
    dataUtils
}