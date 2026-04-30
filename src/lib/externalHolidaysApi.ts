import axios from 'axios';

const API_BASE_URL = '/api';

export const externalHolidaysApi = {
  /**
   * Sincroniza feriados nacionais do Brasil para um determinado ano usando o backend.
   * @param year O ano para o qual buscar os feriados.
   * @returns Uma Promise que resolve para o número de feriados adicionados.
   */
  getNationalHolidays: async (year: number): Promise<any[]> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/feriados/sync-national`, { year });
      return response.data;
    } catch (error) {
      console.error(`Erro ao sincronizar feriados nacionais de ${year}:`, error);
      throw error;
    }
  }
};