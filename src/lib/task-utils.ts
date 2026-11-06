/**
 * MedHit WorkTrack v2 - Utilitários de Tarefas e Datas
 * Funções compartilhadas para parsing de datas, formatação, busca e estilos de status.
 * 
 * Assinado por: Equipe MedHit I&A
 */

/**
 * Formata um objeto Date para o formato ISO local 'YYYY-MM-DD',
 * utilizando o calendário local do usuário e prevenindo o deslocamento
 * de dia que ocorre ao usar toISOString().split('T')[0] após as 21h em fusos ocidentais (ex: UTC-3).
 */
export function formatLocalDateToIso(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Tabela de normalização para meses em português (abreviações e nomes completos)
 */
const PT_MONTHS_MAP: Record<string, number> = {
  jan: 0,
  janeiro: 0,
  fev: 1,
  fevereiro: 1,
  mar: 2,
  marco: 2,
  março: 2,
  abr: 3,
  abril: 3,
  mai: 4,
  maio: 4,
  jun: 5,
  junho: 5,
  jul: 6,
  julho: 6,
  ago: 7,
  agosto: 7,
  set: 8,
  setembro: 8,
  out: 9,
  outubro: 9,
  nov: 10,
  novembro: 10,
  dez: 11,
  dezembro: 11,
};

/**
 * Valida se um objeto Date gerado não sofreu rollover silencioso no motor JS
 * (ex: 31/04/2026 virando 01/05 ou 29/02/2025 virando 01/03 em ano não bissexto)
 */
function isValidDateComponents(d: Date, year: number, month: number, day: number): boolean {
  return (
    !isNaN(d.getTime()) &&
    d.getFullYear() === year &&
    d.getMonth() === month &&
    d.getDate() === day
  );
}

/**
 * Utilitário de parsing seguro de data de entrega.
 * Trata:
 * 1. Strings puras 'YYYY-MM-DD' e 'YYYY/MM/DD'
 * 2. Timestamps ISO com meia-noite UTC (ex: '2026-11-04T00:00:00.000Z' do Supabase/PostgreSQL)
 * 3. Formato brasileiro 'DD/MM/YYYY' e 'DD/MM/YY'
 * 4. Nomes de mês em português (ex: '04 de novembro de 2026', '4 de nov de 2026', '4 nov 2026', '15 de março')
 * 5. Timestamps numéricos em segundos ou milissegundos
 * 6. Datas ISO com horário explícito
 * 
 * Previne rollover silencioso em anos não bissextos e meses com menos de 31 dias.
 * Normaliza datas com componente de hora ausente ou meia-noite para meio-dia local (12:00:00),
 * evitando regressão de dia em fusos ocidentais (ex: Brasil UTC-3).
 * Retorna null para valores nulos, vazios ou corrompidos.
 */
export function parseTaskDueDate(dueDateStr?: string | null): Date | null {
  if (!dueDateStr) return null;
  const trimmed = String(dueDateStr).trim();
  if (!trimmed) return null;

  // 1. Formato brasileiro DD/MM/YYYY ou DD/MM/YY
  const dmyMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(trimmed);
  if (dmyMatch) {
    const day = Number(dmyMatch[1]);
    const month = Number(dmyMatch[2]) - 1;
    let year = Number(dmyMatch[3]);
    if (year < 100) {
      year += year < 70 ? 2000 : 1900;
    }
    const d = new Date(year, month, day, 12, 0, 0, 0);
    return isValidDateComponents(d, year, month, day) ? d : null;
  }

  // 2. Formato YYYY-MM-DD ou YYYY/MM/DD com ou sem horário / timezone (ex: 2026-11-04 ou 2026-11-04T00:00:00.000Z)
  const ymdMatch = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.exec(trimmed);
  if (ymdMatch) {
    const year = Number(ymdMatch[1]);
    const month = Number(ymdMatch[2]) - 1;
    const day = Number(ymdMatch[3]);
    const hours = ymdMatch[4] ? Number(ymdMatch[4]) : 0;
    const minutes = ymdMatch[5] ? Number(ymdMatch[5]) : 0;
    const seconds = ymdMatch[6] ? Number(ymdMatch[6]) : 0;

    // Se não tem componente de hora ou é meia-noite (00:00:00), normaliza para meio-dia local com checagem anti-rollover
    if (!ymdMatch[4] || (hours === 0 && minutes === 0 && seconds === 0)) {
      const d = new Date(year, month, day, 12, 0, 0, 0);
      return isValidDateComponents(d, year, month, day) ? d : null;
    }
  }

  // 3. Formato com nomes de meses em português (ex: '04 de novembro de 2026', '4 de nov de 2026', '4 nov 2026', '15 de março')
  const ptMatch = /^(\d{1,2})\s*(?:de|\/|-|\s)\s*([a-zA-ZçÇáéíóúÁÉÍÓÚ]+)\.?(?:\s*(?:de|\/|-|\s)\s*(\d{2,4}))?$/i.exec(trimmed);
  if (ptMatch) {
    const day = Number(ptMatch[1]);
    const rawMonth = ptMatch[2]
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\./g, "");
    if (rawMonth in PT_MONTHS_MAP) {
      const month = PT_MONTHS_MAP[rawMonth];
      let year = ptMatch[3] ? Number(ptMatch[3]) : new Date().getFullYear();
      if (year < 100) {
        year += year < 70 ? 2000 : 1900;
      }
      const d = new Date(year, month, day, 12, 0, 0, 0);
      return isValidDateComponents(d, year, month, day) ? d : null;
    }
  }

  // 4. Timestamps puramente numéricos (segundos ou milissegundos)
  if (/^\d{10,13}$/.test(trimmed)) {
    const num = Number(trimmed);
    const ms = trimmed.length === 10 ? num * 1000 : num;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }

  // 5. Fallback padrão para strings com horário específico ou formato em inglês (ex: 'Nov 4, 2026')
  const parsed = new Date(trimmed);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Normaliza textos para busca eliminando acentos e caracteres diacríticos,
 * permitindo buscas fluidas em português (ex: 'revisao' encontra 'Revisão').
 */
export function normalizeSearchText(str?: string | null): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Garante estilo inline de cor seguro para o Status Pill mesmo se a cor
 * for um hexadecimal curto (#fff) ou formato alternativo.
 */
export function getStatusBadgeStyle(color?: string) {
  const baseColor = color || "#38bdf8";
  if (baseColor.startsWith("#") && baseColor.length === 7) {
    return {
      backgroundColor: `${baseColor}20`,
      color: baseColor,
      borderColor: `${baseColor}40`,
    };
  }
  return {
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    color: baseColor,
    borderColor: "rgba(56, 189, 248, 0.3)",
  };
}
