/**
 * API Client para agendamentos pendentes
 * Consome endpoints do backend Express
 */

export interface AgendamentoPendente {
  id: string;
  paciente: string;
  maternidade: string;
  procedimento?: string | null;
  telefones?: string | null;
  carteirinha?: string | null;
  medico?: string | null;
  
  dataDum?: string | null;
  dumConfiavel?: boolean | null;
  dataUsg?: string | null;
  semanasUsg?: number | null;
  diasUsg?: number | null;
  
  diagnosticoMaterno?: string | null;
  diagnosticoFetal?: string | null;
  indicacao?: string | null;
  
  metodoIg?: string | null;
  justificativaMetodo?: string | null;
  igIdeal?: string | null;
  igIdealSemanas?: number | null;
  categoriaDiagnostico?: string | null;
  diagnosticoEncontrado?: string | null;
  dataAgendada?: string | null;
  igNaData?: string | null;
  diasAdiados?: number | null;
  statusVaga?: string | null;
  dppCalculado?: string | null;
  
  status: string;
  formsRowId?: string | null;
  criadoEm?: string;
  aprovadoEm?: string | null;
  aprovadoPor?: number | null;
}

export interface PendentesFilters {
  status?: string;
  maternidade?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Lista agendamentos pendentes
 */
export async function listarPendentes(filters?: PendentesFilters): Promise<AgendamentoPendente[]> {
  const params = new URLSearchParams();
  
  if (filters?.status) params.set('status', filters.status);
  if (filters?.maternidade) params.set('maternidade', filters.maternidade);
  if (filters?.startDate) params.set('startDate', filters.startDate);
  if (filters?.endDate) params.set('endDate', filters.endDate);
  
  const url = `/api/pendentes${params.toString() ? '?' + params.toString() : ''}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erro ao listar pendentes: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Busca um agendamento pendente específico
 */
export async function buscarPendente(id: string): Promise<AgendamentoPendente> {
  const response = await fetch(`/api/pendentes/${id}`);
  if (!response.ok) {
    throw new Error(`Erro ao buscar pendente: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Atualiza status de um agendamento pendente
 */
export async function atualizarPendente(
  id: string,
  dados: { status: string; aprovadoPor?: number }
): Promise<AgendamentoPendente> {
  const response = await fetch(`/api/pendentes/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dados),
  });
  
  if (!response.ok) {
    throw new Error(`Erro ao atualizar pendente: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Aprova um agendamento pendente
 */
export async function aprovarPendente(id: string, userId: number): Promise<AgendamentoPendente> {
  return atualizarPendente(id, {
    status: 'aprovado',
    aprovadoPor: userId,
  });
}

/**
 * Rejeita um agendamento pendente
 */
export async function rejeitarPendente(id: string, userId: number): Promise<AgendamentoPendente> {
  return atualizarPendente(id, {
    status: 'rejeitado',
    aprovadoPor: userId,
  });
}
