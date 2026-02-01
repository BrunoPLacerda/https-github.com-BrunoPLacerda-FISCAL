
export enum IncidenciaType {
  DENTRO = 'DENTRO',
  FORA = 'FORA'
}

export enum InvoiceStatus {
  NORMAL = 'NORMAL',
  CANCELADA = 'CANCELADA'
}

export interface InvoiceData {
  id: string;
  numero: string;
  dataEmissao: string;
  valorServicos: number;
  valorIss: number;
  valorDeducoes: number;
  prestadorRazaoSocial: string;
  municipioIncidencia: string;
  incidencia: IncidenciaType;
  status: InvoiceStatus;
  fileName: string;
}

export interface SummaryStats {
  totalServicos: number;
  totalIss: number;
  totalDeducoes: number;
  dentroServicos: number;
  dentroIss: number;
  foraServicos: number;
  foraIss: number;
  count: number;
  cancelledCount: number;
}
