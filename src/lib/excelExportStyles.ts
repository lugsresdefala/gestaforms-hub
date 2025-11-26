/**
 * Excel export styling utilities for corporate-styled reports
 * Used by ExportarPacientesPorMaternidade component
 */

// Corporate color scheme (Hapvida NotreDame)
export const EXCEL_COLORS = {
  headerBg: '003366',      // Dark Blue
  headerFont: 'FFFFFF',    // White
  altRowBg: 'F2F2F2',      // Light Gray
  borderColor: '000000',   // Black
  titleBg: '003366',       // Dark Blue
  subtitleBg: '4472C4',    // Medium Blue
  white: 'FFFFFF',
} as const;

// Cell style types
export interface CellStyle {
  font?: {
    bold?: boolean;
    color?: { rgb: string };
    sz?: number;
    name?: string;
  };
  fill?: {
    fgColor?: { rgb: string };
    patternType?: string;
  };
  alignment?: {
    horizontal?: 'left' | 'center' | 'right';
    vertical?: 'top' | 'center' | 'bottom';
    wrapText?: boolean;
  };
  border?: {
    top?: { style: string; color: { rgb: string } };
    bottom?: { style: string; color: { rgb: string } };
    left?: { style: string; color: { rgb: string } };
    right?: { style: string; color: { rgb: string } };
  };
}

// Pre-defined styles for reuse
export const EXCEL_STYLES = {
  // Title row style (Row 1 - Company name)
  title: {
    font: {
      bold: true,
      color: { rgb: EXCEL_COLORS.headerFont },
      sz: 16,
      name: 'Arial',
    },
    fill: {
      fgColor: { rgb: EXCEL_COLORS.titleBg },
      patternType: 'solid',
    },
    alignment: {
      horizontal: 'center' as const,
      vertical: 'center' as const,
    },
  } as CellStyle,

  // Subtitle row style (Row 2 - Report title)
  subtitle: {
    font: {
      bold: true,
      color: { rgb: EXCEL_COLORS.headerFont },
      sz: 14,
      name: 'Arial',
    },
    fill: {
      fgColor: { rgb: EXCEL_COLORS.subtitleBg },
      patternType: 'solid',
    },
    alignment: {
      horizontal: 'center' as const,
      vertical: 'center' as const,
    },
  } as CellStyle,

  // Info row style (Row 4-5 - Maternidade info, period)
  info: {
    font: {
      bold: true,
      color: { rgb: '000000' },
      sz: 11,
      name: 'Arial',
    },
    alignment: {
      horizontal: 'left' as const,
      vertical: 'center' as const,
    },
  } as CellStyle,

  // Table header style
  tableHeader: {
    font: {
      bold: true,
      color: { rgb: EXCEL_COLORS.headerFont },
      sz: 11,
      name: 'Arial',
    },
    fill: {
      fgColor: { rgb: EXCEL_COLORS.headerBg },
      patternType: 'solid',
    },
    alignment: {
      horizontal: 'center' as const,
      vertical: 'center' as const,
      wrapText: true,
    },
    border: {
      top: { style: 'thin', color: { rgb: EXCEL_COLORS.borderColor } },
      bottom: { style: 'thin', color: { rgb: EXCEL_COLORS.borderColor } },
      left: { style: 'thin', color: { rgb: EXCEL_COLORS.borderColor } },
      right: { style: 'thin', color: { rgb: EXCEL_COLORS.borderColor } },
    },
  } as CellStyle,

  // Data cell style (even rows - white background)
  dataEven: {
    font: {
      color: { rgb: '000000' },
      sz: 10,
      name: 'Arial',
    },
    fill: {
      fgColor: { rgb: EXCEL_COLORS.white },
      patternType: 'solid',
    },
    alignment: {
      horizontal: 'left' as const,
      vertical: 'center' as const,
      wrapText: true,
    },
    border: {
      top: { style: 'thin', color: { rgb: EXCEL_COLORS.borderColor } },
      bottom: { style: 'thin', color: { rgb: EXCEL_COLORS.borderColor } },
      left: { style: 'thin', color: { rgb: EXCEL_COLORS.borderColor } },
      right: { style: 'thin', color: { rgb: EXCEL_COLORS.borderColor } },
    },
  } as CellStyle,

  // Data cell style (odd rows - gray background)
  dataOdd: {
    font: {
      color: { rgb: '000000' },
      sz: 10,
      name: 'Arial',
    },
    fill: {
      fgColor: { rgb: EXCEL_COLORS.altRowBg },
      patternType: 'solid',
    },
    alignment: {
      horizontal: 'left' as const,
      vertical: 'center' as const,
      wrapText: true,
    },
    border: {
      top: { style: 'thin', color: { rgb: EXCEL_COLORS.borderColor } },
      bottom: { style: 'thin', color: { rgb: EXCEL_COLORS.borderColor } },
      left: { style: 'thin', color: { rgb: EXCEL_COLORS.borderColor } },
      right: { style: 'thin', color: { rgb: EXCEL_COLORS.borderColor } },
    },
  } as CellStyle,

  // Date cell style (centered)
  dataDate: {
    font: {
      color: { rgb: '000000' },
      sz: 10,
      name: 'Arial',
    },
    alignment: {
      horizontal: 'center' as const,
      vertical: 'center' as const,
    },
    border: {
      top: { style: 'thin', color: { rgb: EXCEL_COLORS.borderColor } },
      bottom: { style: 'thin', color: { rgb: EXCEL_COLORS.borderColor } },
      left: { style: 'thin', color: { rgb: EXCEL_COLORS.borderColor } },
      right: { style: 'thin', color: { rgb: EXCEL_COLORS.borderColor } },
    },
  } as CellStyle,

  // Footer/Total style
  footer: {
    font: {
      bold: true,
      color: { rgb: '000000' },
      sz: 11,
      name: 'Arial',
    },
    alignment: {
      horizontal: 'left' as const,
      vertical: 'center' as const,
    },
  } as CellStyle,
};

// Column definitions for the report
export const REPORT_COLUMNS = [
  { header: 'Data Agendamento', key: 'data_agendamento_calculada', width: 15 },
  { header: 'Nome Completo', key: 'nome_completo', width: 30 },
  { header: 'Carteirinha', key: 'carteirinha', width: 15 },
  { header: 'Data Nascimento', key: 'data_nascimento', width: 15 },
  { header: 'Telefones', key: 'telefones', width: 20 },
  { header: 'E-mail', key: 'email_paciente', width: 25 },
  { header: 'Procedimentos', key: 'procedimentos', width: 25 },
  { header: 'Médico Responsável', key: 'medico_responsavel', width: 25 },
  { header: 'Centro Clínico', key: 'centro_clinico', width: 25 },
  { header: 'IG Calculada', key: 'idade_gestacional_calculada', width: 15 },
  { header: 'IG Pretendida', key: 'ig_pretendida', width: 15 },
  { header: 'Diagnósticos Maternos', key: 'diagnosticos_maternos', width: 30 },
  { header: 'Diagnósticos Fetais', key: 'diagnosticos_fetais', width: 30 },
  { header: 'Status', key: 'status', width: 12 },
  { header: 'Observações', key: 'observacoes_agendamento', width: 35 },
];

// Summary columns for the "Resumo Geral" sheet
export const SUMMARY_COLUMNS = [
  { header: 'Maternidade', key: 'maternidade', width: 30 },
  { header: 'Total Pacientes', key: 'total', width: 15 },
  { header: 'Pendentes', key: 'pendentes', width: 12 },
  { header: 'Aprovados', key: 'aprovados', width: 12 },
  { header: 'Rejeitados', key: 'rejeitados', width: 12 },
];

/**
 * Format a date string to DD/MM/YYYY format
 */
export function formatDateBR(dateString: string | null | undefined): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '';
  }
}

/**
 * Format datetime to DD/MM/YYYY HH:mm format
 */
export function formatDateTimeBR(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `Relatorio_Pacientes_${year}-${month}-${day}_${hours}${minutes}${seconds}.xlsx`;
}

/**
 * Sanitize sheet name for Excel (max 31 chars, no special chars)
 */
export function sanitizeSheetName(name: string): string {
  // Remove invalid characters for Excel sheet names
  let sanitized = name.replace(/[\\/:*?[\]]/g, '');
  // Limit to 31 characters (Excel limit)
  if (sanitized.length > 31) {
    sanitized = sanitized.substring(0, 31);
  }
  // Ensure it's not empty
  if (!sanitized.trim()) {
    sanitized = 'Sem Nome';
  }
  return sanitized.trim();
}

/**
 * Format procedures array to string
 */
export function formatProcedimentos(procedimentos: string[] | null | undefined): string {
  if (!procedimentos || !Array.isArray(procedimentos)) return '';
  return procedimentos.filter(p => p && p.trim()).join('; ');
}

/**
 * Get status label in Portuguese
 */
export function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    pendente: 'Pendente',
    aprovado: 'Aprovado',
    rejeitado: 'Rejeitado',
    cancelado: 'Cancelado',
  };
  return statusMap[status] || status;
}
