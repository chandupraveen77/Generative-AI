import React, { useRef, useState } from 'react';
import { 
  ShieldCheck, 
  UploadCloud, 
  Database, 
  FileSpreadsheet, 
  Activity, 
  Key, 
  BookOpen, 
  ChevronDown,
  Sparkles,
  Check
} from 'lucide-react';

export default function Navbar({ 
  activeFilename, 
  datasetSummary, 
  onLoadPreset, 
  onFileUpload, 
  isLoading,
  apiKey,
  setApiKey,
  selectedModel,
  setSelectedModel
}) {
  const fileInputRef = useRef(null);
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey || '');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const handleSaveKey = () => {
    setApiKey(tempKey);
    setShowKeyModal(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand & Research Citation */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold ring-1 ring-white/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                DataQualAI
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> GE Engine v1.24
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <span>Quality by Prompt</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">Abughazala et al., 2026</span>
            </div>
          </div>
        </div>

        {/* Dataset Controls & Ingestion */}
        <div className="flex items-center gap-3">
          
          {/* Preset Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPresetMenu(!showPresetMenu)}
              disabled={isLoading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 transition-all hover:border-slate-600 disabled:opacity-50"
            >
              <Database className="w-4 h-4 text-indigo-400" />
              <span>Load Benchmark Dataset</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showPresetMenu && (
              <div 
                className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95"
                onMouseLeave={() => setShowPresetMenu(false)}
              >
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Built-in Research Benchmarks
                </div>
                
                <button
                  onClick={() => {
                    setShowPresetMenu(false);
                    onLoadPreset('telco_churn');
                  }}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors flex items-start gap-3 group"
                >
                  <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 mt-0.5">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-white flex items-center gap-1.5">
                      Telecom Customer Churn
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">502 rows</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Contains missing TotalCharges, negative tenure & contract anomalies
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowPresetMenu(false);
                    onLoadPreset('healthcare_stroke');
                  }}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors flex items-start gap-3 group mt-1"
                >
                  <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20 mt-0.5">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-white flex items-center gap-1.5">
                      Healthcare Stroke Prediction
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300">500 rows</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Injected BMI missingness, glucose spikes & class imbalance
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Upload Custom Dataset */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,.xlsx,.xls,.parquet"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload File (.csv, .xlsx, .parquet)</span>
          </button>

          {/* Active Status Badge */}
          {activeFilename && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-slate-200 truncate max-w-[140px]">{activeFilename}</span>
              {datasetSummary && (
                <span className="text-slate-400 text-[11px]">
                  ({datasetSummary.total_rows.toLocaleString()} × {datasetSummary.total_columns})
                </span>
              )}
            </div>
          )}

          {/* LLM Key / Provider Modal Trigger */}
          <button
            onClick={() => setShowKeyModal(true)}
            title="Configure LLM Provider / OpenAI Key"
            className={`p-2 rounded-lg border text-xs font-medium transition-all ${
              apiKey 
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40' 
                : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* OpenAI API Key & Model Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">LLM Provider Configuration</h3>
                  <p className="text-xs text-slate-400">Mode A: Natural Language Requirement Transformation</p>
                </div>
              </div>
            </div>

            <div className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  OpenAI API Key (Optional)
                </label>
                <input
                  type="password"
                  placeholder="sk-proj-..."
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <div className="mt-2 text-[11px] text-slate-400 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                  💡 <span className="font-semibold text-indigo-300">Embedded Engine Included:</span> If no key is provided, DataQualAI seamlessly uses an offline semantic NLP heuristic engine that parses requirements directly!
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="gpt-4o-mini">GPT-4o-mini (Fast & Recommended)</option>
                  <option value="gpt-4o">GPT-4o (High-Precision Reasoning)</option>
                  <option value="heuristic-offline">Embedded Heuristic (Offline)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveKey}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
