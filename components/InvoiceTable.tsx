
import React, { useState } from 'react';
import { InvoiceData, IncidenciaType, InvoiceStatus } from '../types';

interface InvoiceTableProps {
  invoices: InvoiceData[];
}

const InvoiceTable: React.FC<InvoiceTableProps> = ({ invoices }) => {
  const [filter, setFilter] = useState<IncidenciaType | 'ALL'>('ALL');
  const [showCancelled, setShowCancelled] = useState(true);
  
  const filteredInvoices = invoices.filter(inv => {
    const matchesIncidencia = filter === 'ALL' || inv.incidencia === filter;
    const matchesStatus = showCancelled || inv.status === InvoiceStatus.NORMAL;
    return matchesIncidencia && matchesStatus;
  });

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Detalhamento de Notas</h2>
          <p className="text-xs text-slate-400">Total visível: {filteredInvoices.length} notas</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer mr-2">
            <input 
              type="checkbox" 
              checked={showCancelled} 
              onChange={(e) => setShowCancelled(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Ver canceladas
          </label>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setFilter('ALL')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === 'ALL' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Todas
            </button>
            <button 
              onClick={() => setFilter(IncidenciaType.DENTRO)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === IncidenciaType.DENTRO ? 'bg-white shadow-sm text-green-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Dentro
            </button>
            <button 
              onClick={() => setFilter(IncidenciaType.FORA)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === IncidenciaType.FORA ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Fora
            </button>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-semibold">Nota / Data</th>
              <th className="px-6 py-4 font-semibold">Prestador</th>
              <th className="px-6 py-4 font-semibold text-right">Valor Bruto</th>
              <th className="px-6 py-4 font-semibold text-right text-red-500">Deduções</th>
              <th className="px-6 py-4 font-semibold text-center">Status</th>
              <th className="px-6 py-4 font-semibold text-center">Incidência</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredInvoices.map((inv) => (
              <tr key={inv.id} className={`hover:bg-slate-50 transition-colors ${inv.status === InvoiceStatus.CANCELADA ? 'opacity-60 bg-slate-50/50' : ''}`}>
                <td className="px-6 py-4">
                  <div className={`font-medium ${inv.status === InvoiceStatus.CANCELADA ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                    Nº {inv.numero}
                  </div>
                  <div className="text-xs text-slate-400">{formatDate(inv.dataEmissao)}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-700 truncate max-w-[200px]" title={inv.prestadorRazaoSocial}>
                    {inv.prestadorRazaoSocial}
                  </div>
                </td>
                <td className="px-6 py-4 text-right text-sm font-semibold">
                  <span className={inv.status === InvoiceStatus.CANCELADA ? 'text-slate-400' : 'text-slate-900'}>
                    {formatCurrency(inv.valorServicos)}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium text-red-500/80">
                  {inv.valorDeducoes > 0 ? formatCurrency(inv.valorDeducoes) : '-'}
                </td>
                <td className="px-6 py-4 text-center">
                  {inv.status === InvoiceStatus.CANCELADA ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 uppercase">
                      Cancelada
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-600 uppercase">
                      Ativa
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    inv.incidencia === IncidenciaType.DENTRO 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {inv.incidencia === IncidenciaType.DENTRO ? 'Dentro' : 'Fora'}
                  </span>
                </td>
              </tr>
            ))}
            {filteredInvoices.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-slate-400 italic">
                  Nenhuma nota encontrada para este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceTable;
