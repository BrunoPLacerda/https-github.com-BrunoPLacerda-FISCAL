
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { InvoiceData, SummaryStats, IncidenciaType, InvoiceStatus } from './types';
import { parseInvoiceXml } from './utils/xmlParser';
import SummaryCards from './components/SummaryCards';
import InvoiceTable from './components/InvoiceTable';
import { getFiscalAnalysis } from './geminiService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import JSZip from 'jszip';

const IMPORT_LIMIT = 3;
const PIX_KEY = "bplacerda@hotmail.com";

const App: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Controle de assinatura e limite
  const [importCount, setImportCount] = useState<number>(() => {
    const saved = localStorage.getItem('fiscal_campos_import_count');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isSubscribed, setIsSubscribed] = useState(false); // Simulação de estado de assinante
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    localStorage.setItem('fiscal_campos_import_count', importCount.toString());
  }, [importCount]);

  const processXmlContent = (text: string, fileName: string): InvoiceData | null => {
    try {
      return parseInvoiceXml(text, fileName);
    } catch (err) {
      console.error(`Erro ao processar XML ${fileName}:`, err);
      return null;
    }
  };

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Verificação de limite
    if (!isSubscribed && importCount >= IMPORT_LIMIT) {
      setShowPaywall(true);
      event.target.value = '';
      return;
    }

    setLoading(true);
    const newInvoices: InvoiceData[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (file.type === 'text/xml' || file.name.endsWith('.xml')) {
        try {
          const text = await file.text();
          const data = processXmlContent(text, file.name);
          if (data) newInvoices.push(data);
        } catch (err) {
          console.error(`Erro ao ler arquivo ${file.name}:`, err);
        }
      } 
      else if (file.name.endsWith('.zip') || file.type === 'application/zip' || file.type === 'application/x-zip-compressed') {
        try {
          const zip = new JSZip();
          const loadedZip = await zip.loadAsync(file);
          
          const promises: Promise<void>[] = [];
          
          loadedZip.forEach((relativePath, zipEntry) => {
            if (!zipEntry.dir && zipEntry.name.endsWith('.xml')) {
              const promise = zipEntry.async('text').then((text) => {
                const data = processXmlContent(text, zipEntry.name);
                if (data) newInvoices.push(data);
              });
              promises.push(promise);
            }
          });
          
          await Promise.all(promises);
        } catch (err) {
          console.error(`Erro ao processar arquivo ZIP ${file.name}:`, err);
        }
      }
    }

    if (newInvoices.length > 0) {
      setInvoices(prev => [...prev, ...newInvoices]);
      if (!isSubscribed) {
        setImportCount(prev => prev + 1);
      }
    }
    
    setLoading(false);
    event.target.value = '';
  }, [importCount, isSubscribed]);

  const copyPixKey = () => {
    navigator.clipboard.writeText(PIX_KEY);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const clearData = () => {
    setInvoices([]);
    setAiInsight(null);
  };

  const stats = useMemo<SummaryStats>(() => {
    const initial: SummaryStats = {
      totalServicos: 0,
      totalIss: 0,
      totalDeducoes: 0,
      dentroServicos: 0,
      dentroIss: 0,
      foraServicos: 0,
      foraIss: 0,
      count: invoices.length,
      cancelledCount: invoices.filter(i => i.status === InvoiceStatus.CANCELADA).length
    };

    return invoices.reduce((acc, curr) => {
      if (curr.status === InvoiceStatus.CANCELADA) return acc;
      acc.totalServicos += curr.valorServicos;
      acc.totalIss += curr.valorIss;
      acc.totalDeducoes += curr.valorDeducoes;
      if (curr.incidencia === IncidenciaType.DENTRO) {
        acc.dentroServicos += curr.valorServicos;
        acc.dentroIss += curr.valorIss;
      } else {
        acc.foraServicos += curr.valorServicos;
        acc.foraIss += curr.valorIss;
      }
      return acc;
    }, initial);
  }, [invoices]);

  const generateAiAnalysis = async () => {
    if (invoices.length === 0) return;
    setAiLoading(true);
    const insight = await getFiscalAnalysis(stats);
    setAiInsight(insight);
    setAiLoading(false);
  };

  const chartData = [
    { name: 'Dentro (Campos)', value: stats.dentroServicos, color: '#10b981' },
    { name: 'Fora', value: stats.foraServicos, color: '#f97316' },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8 lg:p-12 pb-20 text-slate-900">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Fis<span className="text-blue-600">campos</span>
          </h1>
          <p className="text-slate-500 mt-1">Gestão inteligente e análise de incidência tributária NFSe.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end mr-2">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isSubscribed ? 'Plano Ilimitado' : 'Plano Gratuito'}</span>
             <div className="flex items-center gap-1 mt-0.5">
                {[...Array(IMPORT_LIMIT)].map((_, i) => (
                  <div key={i} className={`w-3 h-1.5 rounded-full ${i < importCount || isSubscribed ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                ))}
                {!isSubscribed && <span className="ml-1 text-xs font-semibold text-slate-600">{importCount}/{IMPORT_LIMIT}</span>}
                {isSubscribed && <i className="fa-solid fa-check-circle text-blue-600 text-xs ml-1"></i>}
             </div>
          </div>

          {invoices.length > 0 && (
            <button 
              onClick={clearData}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all"
            >
              Limpar
            </button>
          )}

          <label className={`relative group ${!isSubscribed && importCount >= IMPORT_LIMIT ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
            <div className="bg-blue-600 group-hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all flex items-center gap-2">
              <i className="fa-solid fa-file-zipper"></i>
              Importar XMLs ou ZIP
            </div>
            <input 
              type="file" 
              multiple 
              accept=".xml,.zip" 
              onChange={handleFileUpload} 
              className="hidden" 
              disabled={!isSubscribed && importCount >= IMPORT_LIMIT}
            />
          </label>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mb-6">
              <i className="fa-solid fa-file-invoice text-blue-600 text-3xl"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Pronto para começar?</h3>
            <p className="text-slate-500 max-w-sm text-center mb-8">
              {isSubscribed 
                ? "Importe suas notas fiscais sem limites e aproveite todas as funcionalidades premium."
                : `Importe suas notas fiscais para análise imediata. Você possui ${IMPORT_LIMIT - importCount} importações gratuitas restantes.`}
            </p>
            {!isSubscribed && importCount >= IMPORT_LIMIT && (
              <button 
                onClick={() => setShowPaywall(true)}
                className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold shadow-xl hover:bg-black transition-all flex items-center gap-2"
              >
                <i className="fa-solid fa-crown text-yellow-400"></i>
                Liberar Acesso Ilimitado
              </button>
            )}
          </div>
        ) : (
          <>
            <SummaryCards stats={stats} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Pie Chart Analysis */}
              <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
                <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                  <i className="fa-solid fa-chart-pie text-blue-500"></i>
                  Distribuição
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AI Insights */}
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                      <i className="fa-solid fa-brain text-purple-500"></i>
                      Análise Inteligente Gemini
                    </h3>
                    <button 
                      onClick={generateAiAnalysis}
                      disabled={aiLoading}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 uppercase tracking-widest disabled:opacity-50"
                    >
                      {aiLoading ? 'Processando...' : 'Gerar Insight'}
                    </button>
                 </div>
                 {aiInsight ? (
                   <div className="prose prose-slate max-w-none text-slate-600 text-sm leading-relaxed h-52 overflow-y-auto pr-2">
                     {aiInsight.split('\n').map((line, i) => <p key={i} className="mb-2">{line}</p>)}
                   </div>
                 ) : (
                   <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                      <i className="fa-solid fa-magic-wand-sparkles text-2xl mb-2 opacity-20"></i>
                      <p className="text-xs">Aguardando solicitação de análise técnica.</p>
                   </div>
                 )}
              </div>
            </div>

            <InvoiceTable invoices={invoices} />
          </>
        )}
      </div>

      {/* Paywall Modal */}
      {showPaywall && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white max-w-md w-full rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-10 text-center text-white relative">
              <button 
                onClick={() => setShowPaywall(false)}
                className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
              >
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
              <div className="bg-white/20 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-xl">
                <i className="fa-solid fa-crown text-2xl text-yellow-300"></i>
              </div>
              <h2 className="text-2xl font-black mb-1 leading-tight text-white">Fiscampos</h2>
              <p className="text-blue-100 text-xs">Acesso ilimitado agora por apenas R$ 19,99/mês</p>
            </div>
            <div className="p-8">
              <div className="mb-6 bg-blue-50/50 p-5 rounded-3xl border border-blue-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Chave Pix (E-mail)</span>
                  <div className="flex items-center gap-1 text-xs text-blue-800 font-bold">
                    <i className="fa-brands fa-pix"></i>
                    PIX EXCLUSIVO
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-blue-100">
                  <code className="text-sm font-bold text-slate-800 select-all truncate">{PIX_KEY}</code>
                  <button 
                    onClick={copyPixKey}
                    className={`flex-shrink-0 p-2 rounded-lg transition-all ${copySuccess ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  >
                    <i className={`fa-solid ${copySuccess ? 'fa-check' : 'fa-copy'}`}></i>
                  </button>
                </div>
                {copySuccess && <p className="text-[10px] text-green-600 font-bold mt-2 text-center">Chave copiada com sucesso!</p>}
              </div>

              <ul className="space-y-3 mb-6">
                {[
                  'Importações ilimitadas (XML/ZIP)',
                  'Análises via IA ilimitadas',
                  'Filtros avançados e exportação',
                  'Suporte técnico prioritário'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-600 text-[13px] font-medium">
                    <i className="fa-solid fa-circle-check text-green-500"></i>
                    {item}
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => {
                  alert("Chave Pix copiada! Após realizar o pagamento, sua assinatura será processada.");
                  setIsSubscribed(true); // Mock para demonstração do estado liberado
                  setShowPaywall(false);
                }}
                className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-bold text-lg shadow-xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                Já realizei o Pix
                <i className="fa-solid fa-arrow-right text-sm"></i>
              </button>

              <div className="mt-6 flex flex-col items-center gap-2 border-t border-slate-100 pt-6">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Confirmação</p>
                <p className="text-xs text-slate-500 text-center leading-relaxed">
                  Ao realizar o pagamento via Pix, a liberação ocorre conforme o processamento bancário.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-semibold text-slate-700">Processando lote...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
