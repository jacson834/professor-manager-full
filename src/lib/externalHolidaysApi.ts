import axios from 'axios';

// ATENÇÃO: SUBSTITUA 'SUA_CHAVE_API_DO_CALENDARIFIC_AQUI' PELA SUA CHAVE REAL!
// Para produção, considere usar variáveis de ambiente (ex: process.env.VITE_CALENDARIFIC_API_KEY no Vite)
const CALENDARIFIC_API_KEY = '6CJsBMxYVtaFJyJkFMhvOXK2vIE0BLkz'; // SUA CHAVE DE API REAL AQUI

// Esta interface deve corresponder à estrutura dos dados de feriado que você usa no seu sistema,
// por exemplo, a interface 'Feriado' definida em '@/lib/database'.
// Estou assumindo que 'Feriado' tem 'id', 'data' (YYYY-MM-DD) e 'nome'.
interface Feriado {
  id: string;
  data: string; // Formato YYYY-MM-DD
  nome: string;
}

// Interface para os dados retornados diretamente pela API do Calendarific
interface CalendarificHoliday {
  date: {
    iso: string; // Ex: "2025-01-01"
    datetime: {
      year: number;
      month: number;
      day: number;
    };
  };
  name: string;
  description: string;
  type: string[]; // Ex: ["National Holiday", "Religious"]
  // Outros campos que a API possa retornar, mas que não são usados aqui
}

export const externalHolidaysApi = {
  /**
   * Busca feriados nacionais do Brasil para um determinado ano usando a API do Calendarific.
   * @param year O ano para o qual buscar os feriados.
   * @returns Uma Promise que resolve para um array de objetos Feriado.
   */
  getNationalHolidays: async (year: number): Promise<Feriado[]> => {
    // CORREÇÃO AQUI: A chave de API está corretamente interpolada usando ${CALENDARIFIC_API_KEY}
    // O erro anterior era devido a `api_key=${6CJsBMxYVtaFJyJkFMhvOXK2vIE0BLkz}`
    // onde o valor literal estava dentro do $`{}` sem ser uma variável.
    const url = `https://calendarific.com/api/v2/holidays?api_key=${CALENDARIFIC_API_KEY}&country=BR&year=${year}&type=national`;

    try {
      // Faz a requisição HTTP GET para a API do Calendarific
      const response = await axios.get<{ response: { holidays: CalendarificHoliday[] } }>(url);
      
      // Verifica se a resposta contém os dados de feriados
      if (!response.data || !response.data.response || !response.data.response.holidays) {
        console.warn("Calendarific API returned no holidays or an unexpected format.");
        return [];
      }

      // Mapeia os dados da API do Calendarific para o formato 'Feriado[]' esperado pelo seu sistema.
      // Filtra para garantir que pegamos apenas feriados marcados como 'National Holiday'
      // e gera um ID temporário (você pode querer usar um UUID real se seu DB local precisar de um ID no cliente).
      const holidays: Feriado[] = response.data.response.holidays
        .filter(h => h.type.includes('National Holiday')) // Garante que pegamos apenas feriados nacionais
        .map(h => ({
          // Gerar um ID aqui pode ser necessário se feriadosApi.addFeriado precisar de um ID pré-definido.
          // Por exemplo, você pode usar 'crypto.randomUUID()' para um UUID real (Modern Browsers only)
          // ou instalar 'uuid' (npm install uuid @types/uuid) e usar 'uuidv4()'.
          // Para este exemplo, deixamos como string vazia, assumindo que seu feriadosApi.addFeriado gera o ID.
          id: '', 
          data: h.date.iso, // A data já está no formato YYYY-MM-DD
          nome: h.name,
        }));
      
      return holidays;
    } catch (error) {
      console.error(`Erro ao buscar feriados nacionais de ${year} da Calendarific:`, error);
      // Re-lança o erro para que o componente chamador possa tratá-lo,
      // ou retorne um array vazio dependendo do seu fluxo de erro desejado.
      throw error;
    }
  }
};