import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import KPICards from './components/KPICards';
import DataPreview from './components/DataPreview';
import FindingsTable from './components/FindingsTable';
import RuleStudio from './components/RuleStudio';
import ValidationReport from './components/ValidationReport';
import ExportCenter from './components/ExportCenter';
import Toast from './components/Toast';

import { 
  BarChart3, 
  AlertOctagon, 
  Sparkles, 
  ShieldCheck, 
  Download,
  Layers,
  Database
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'findings' | 'rules' | 'validation' | 'export'
  const [activeFilename, setActiveFilename] = useState('');
  const [profile, setProfile] = useState(null);
  const [rules, setRules] = useState([]);
  const [validationResult, setValidationResult] = useState(null);
  const [remediationSummary, setRemediationSummary] = useState(null);
  const [hasCleanedData, setHasCleanedData] = useState(false);
  const [ruleSource, setRuleSource] = useState('');
  
  // Settings
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = (title, message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initial load: Load the primary preset "Telecom Customer Churn"
  useEffect(() => {
    handleLoadPreset('telco_churn');
  }, []);

  // API Call: Load Preset
  const handleLoadPreset = async (presetKey) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('preset', presetKey);

      const resp = await fetch('/api/load-preset', {
        method: 'POST',
        body: formData,
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail || 'Failed to load preset');
      }

      const data = await resp.json();
      setActiveFilename(data.filename);
      setProfile(data.profile);
      setHasCleanedData(false);
      setRemediationSummary(null);
      setValidationResult(null);

      // Auto-generate initial smart rules so the rule studio has rich context immediately
      handleGenerateSmartRulesDirect(data.profile);

      addToast(
        'Preset Loaded',
        `Successfully loaded benchmark dataset "${data.filename}" with real-world anomalies.`,
        'success'
      );
    } catch (err) {
      addToast('Error Loading Preset', err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // API Call: File Upload (.csv, .xlsx, .parquet)
  const handleFileUpload = async (file) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const resp = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail || 'Upload failed');
      }

      const data = await resp.json();
      setActiveFilename(data.filename);
      setProfile(data.profile);
      setHasCleanedData(false);
      setRemediationSummary(null);
      setValidationResult(null);

      handleGenerateSmartRulesDirect(data.profile);

      addToast(
        'Dataset Uploaded',
        `Parsed ${data.profile.dataset_summary.total_rows} rows from "${file.name}".`,
        'success'
      );
    } catch (err) {
      addToast('Upload Failed', err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Mode A: Prompt to Rules
  const handleGenerateFromPrompt = async (promptText) => {
    setIsLoading(true);
    try {
      const resp = await fetch('/api/rules/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          api_key: apiKey,
          model: selectedModel,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail || 'Translation failed');
      }

      const data = await resp.json();
      setRules(data.rules || []);
      setRuleSource(data.source || 'Quality by Prompt Engine');

      addToast(
        'Rules Generated',
        `Translated requirements into ${data.rules?.length || 0} Great Expectations rules.`,
        'success'
      );
    } catch (err) {
      addToast('Rule Generation Failed', err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Mode B: Smart Inferred Suite
  const handleGenerateSmartSuite = async () => {
    setIsLoading(true);
    try {
      const resp = await fetch('/api/rules/smart', {
        method: 'POST',
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail || 'Smart suite generation failed');
      }

      const data = await resp.json();
      setRules(data.rules || []);
      setRuleSource('Mode B: Smart Statistical Schema Inference');

      addToast(
        'Smart Suite Inferred',
        `Synthesized ${data.rules?.length || 0} Great Expectations rules from distribution bounds.`,
        'success'
      );
    } catch (err) {
      addToast('Inference Failed', err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSmartRulesDirect = async () => {
    try {
      const resp = await fetch('/api/rules/smart', { method: 'POST' });
      if (resp.ok) {
        const data = await resp.json();
        setRules(data.rules || []);
        setRuleSource('Initial Baseline Suite');
      }
    } catch (e) {
      console.warn('Initial rule inference error', e);
    }
  };

  // Mode C: Execute Validation Suite
  const handleExecuteValidation = async (useCleaned = false) => {
    if (!rules || rules.length === 0) {
      addToast('No Rules Active', 'Please generate or add Great Expectations rules first.', 'info');
      return;
    }

    setIsLoading(true);
    try {
      const resp = await fetch('/api/rules/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rules: rules,
          use_cleaned: useCleaned,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail || 'Validation failed');
      }

      const outcome = await resp.json();
      setValidationResult(outcome);
      setActiveTab('validation');

      if (outcome.success) {
        addToast(
          'Validation Passed! 🎉',
          `All ${outcome.statistics.evaluated_expectations} expectations succeeded (100%).`,
          'success'
        );
      } else {
        addToast(
          'Validation Completed with Violations',
          `${outcome.statistics.unsuccessful_expectations} expectations violated. Inspect failure samples below.`,
          'error'
        );
      }
    } catch (err) {
      addToast('Validation Execution Failed', err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Feature 4: Interactive Remediation
  const handleRemediate = async (remedConfig) => {
    setIsLoading(true);
    try {
      const resp = await fetch('/api/remediate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(remedConfig),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail || 'Remediation failed');
      }

      const data = await resp.json();
      setRemediationSummary(data.summary);
      setHasCleanedData(true);
      setProfile(data.cleaned_profile);

      addToast(
        'Remediation Applied',
        `Eliminated ${data.summary.missing_eliminated} missing values & ${data.summary.duplicates_removed} duplicates.`,
        'success'
      );
    } catch (err) {
      addToast('Remediation Failed', err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Export handlers
  const handleExportDataset = (version) => {
    window.location.href = `/api/export/dataset?version=${version}`;
  };

  const handleExportSuiteJson = async () => {
    const resp = await fetch('/api/export/suite-json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suite_name: 'dataqualai_suite', expectations: rules }),
    });
    const blob = await resp.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dataqualai_suite.json';
    a.click();
  };

  const handleExportScriptPy = async () => {
    const resp = await fetch('/api/export/script-py', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suite_name: 'dataqualai_suite', expectations: rules }),
    });
    const blob = await resp.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dataqualai_validator.py';
    a.click();
  };

  const handleExportReportPdf = () => {
    window.location.href = '/api/export/report-pdf';
  };

  const handleExportReportMd = () => {
    window.location.href = '/api/export/report-md';
  };

  const tabs = [
    { id: 'overview', label: 'Overview & Profiling', icon: BarChart3 },
    { 
      id: 'findings', 
      label: 'Diagnostic Findings', 
      icon: AlertOctagon,
      badge: profile?.findings?.length ? String(profile.findings.length) : null
    },
    { 
      id: 'rules', 
      label: 'Natural Language Quality Rules', 
      icon: Sparkles,
      badge: rules?.length ? String(rules.length) : null
    },
    { 
      id: 'validation', 
      label: 'Validation & Remediation', 
      icon: ShieldCheck,
      badge: validationResult ? (validationResult.success ? 'Pass' : 'Alert') : null,
      badgeColor: validationResult ? (validationResult.success ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300') : ''
    },
    { id: 'export', label: 'Export Center', icon: Download }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Navigation Header */}
      <Navbar
        activeFilename={activeFilename}
        datasetSummary={profile?.dataset_summary}
        onLoadPreset={handleLoadPreset}
        onFileUpload={handleFileUpload}
        isLoading={isLoading}
        apiKey={apiKey}
        setApiKey={setApiKey}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Tab Switcher Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 ring-1 ring-white/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    tab.badgeColor || (isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300')
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB CONTENTS */}
        {profile ? (
          <div>
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <KPICards profile={profile} />
                <DataPreview profile={profile} />
              </div>
            )}

            {activeTab === 'findings' && (
              <div className="animate-in fade-in duration-200">
                <FindingsTable 
                  findings={profile.findings} 
                  onNavigateToRemediate={() => setActiveTab('validation')}
                />
              </div>
            )}

            {activeTab === 'rules' && (
              <div className="animate-in fade-in duration-200">
                <RuleStudio
                  profile={profile}
                  rules={rules}
                  setRules={setRules}
                  onGenerateFromPrompt={handleGenerateFromPrompt}
                  onGenerateSmartSuite={handleGenerateSmartSuite}
                  onExecuteValidation={() => handleExecuteValidation(false)}
                  isLoading={isLoading}
                  ruleSource={ruleSource}
                />
              </div>
            )}

            {activeTab === 'validation' && (
              <div className="animate-in fade-in duration-200">
                <ValidationReport
                  validationResult={validationResult}
                  onRemediate={handleRemediate}
                  onRevalidateCleaned={() => handleExecuteValidation(true)}
                  isLoading={isLoading}
                  remediationSummary={remediationSummary}
                  hasCleanedData={hasCleanedData}
                />
              </div>
            )}

            {activeTab === 'export' && (
              <div className="animate-in fade-in duration-200">
                <ExportCenter
                  hasCleanedData={hasCleanedData}
                  hasRules={rules && rules.length > 0}
                  hasProfile={!!profile}
                  onExportDataset={handleExportDataset}
                  onExportSuiteJson={handleExportSuiteJson}
                  onExportScriptPy={handleExportScriptPy}
                  onExportReportPdf={handleExportReportPdf}
                  onExportReportMd={handleExportReportMd}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="py-20 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Loading Dataset Session...</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Initializing Great Expectations engine and benchmark presets.
            </p>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950 py-5 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">DataQualAI</span>
            <span>— Intelligent Dataset Diagnosis & Quality Analysis System</span>
          </div>
          <div>
            Implemented according to <em>"Quality by Prompt"</em> (Abughazala et al., 2026) & Great Expectations v1.24
          </div>
        </div>
      </footer>

    </div>
  );
}
