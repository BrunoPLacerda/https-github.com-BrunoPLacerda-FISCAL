
import { InvoiceData, IncidenciaType, InvoiceStatus } from '../types';

const CAMPOS_MUNICIPIO_CODE = '3301009';

/**
 * Gets the text content of a tag, ignoring potential namespaces
 */
const getTagValue = (parent: Element | Document, tagName: string): string => {
  const elements = parent.getElementsByTagNameNS('*', tagName);
  if (elements.length > 0) {
    return elements[0].textContent || '';
  }
  // Fallback for non-namespaced or local tests
  const fallback = parent.getElementsByTagName(tagName);
  return fallback.length > 0 ? fallback[0].textContent || '' : '';
};

export const parseInvoiceXml = (xmlString: string, fileName: string): InvoiceData => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");

  const numero = getTagValue(xmlDoc, 'Numero');
  const dataEmissao = getTagValue(xmlDoc, 'DataEmissao');
  const valorServicos = parseFloat(getTagValue(xmlDoc, 'ValorServicos') || '0');
  const valorIss = parseFloat(getTagValue(xmlDoc, 'ValorIss') || '0');
  const valorDeducoes = parseFloat(getTagValue(xmlDoc, 'ValorDeducoes') || '0');
  const prestadorRazaoSocial = getTagValue(xmlDoc, 'RazaoSocial');
  const municipioIncidencia = getTagValue(xmlDoc, 'MunicipioIncidencia');
  
  // No padrão ABRASF: 1 = Normal, 2 = Cancelada
  const statusRaw = getTagValue(xmlDoc, 'Status');
  const temCancelamento = xmlDoc.getElementsByTagNameNS('*', 'Cancelamento').length > 0;
  
  const status = (statusRaw === '2' || temCancelamento) 
    ? InvoiceStatus.CANCELADA 
    : InvoiceStatus.NORMAL;

  const incidencia = municipioIncidencia === CAMPOS_MUNICIPIO_CODE 
    ? IncidenciaType.DENTRO 
    : IncidenciaType.FORA;

  return {
    id: Math.random().toString(36).substr(2, 9),
    numero,
    dataEmissao,
    valorServicos,
    valorIss,
    valorDeducoes,
    prestadorRazaoSocial,
    municipioIncidencia,
    incidencia,
    status,
    fileName
  };
};
