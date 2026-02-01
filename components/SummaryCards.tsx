
import React from 'react';
import { SummaryStats } from '../types';

interface SummaryCardsProps {
  stats: SummaryStats;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ stats }) => {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">Serviços (Bruto)</span>
          <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
            <i className="fa-solid fa-file-invoice-dollar"></i>
          </div>
        </div>
        <div className="text-xl font-bold text-slate-900">{formatCurrency(stats.totalServicos)}</div>
        <div className="mt-1 text-xs text-slate-400">{stats.count} notas</div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">Deduções</span>
          <div className="bg-red-100 p-2 rounded-lg text-red-600">
            <i className="fa-solid fa-tags"></i>
          </div>
        </div>
        <div className="text-xl font-bold text-slate-900">{formatCurrency(stats.totalDeducoes)}</div>
        <div className="mt-1 text-xs text-slate-400">Descontos/Materiais</div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">Total ISS</span>
          <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
            <i className="fa-solid fa-percent"></i>
          </div>
        </div>
        <div className="text-xl font-bold text-slate-900">{formatCurrency(stats.totalIss)}</div>
        <div className="mt-1 text-xs text-slate-400">Imposto apurado</div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">Dentro de Campos</span>
          <div className="bg-green-100 p-2 rounded-lg text-green-600">
            <i className="fa-solid fa-house-chimney"></i>
          </div>
        </div>
        <div className="text-xl font-bold text-slate-900">{formatCurrency(stats.dentroServicos)}</div>
        <div className="mt-1 text-xs text-slate-400">Incidência local</div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">Fora de Campos</span>
          <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
            <i className="fa-solid fa-plane"></i>
          </div>
        </div>
        <div className="text-xl font-bold text-slate-900">{formatCurrency(stats.foraServicos)}</div>
        <div className="mt-1 text-xs text-slate-400">Outros municípios</div>
      </div>
    </div>
  );
};

export default SummaryCards;
