import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  Wrench, 
  Download, 
  RefreshCw, 
  FileSpreadsheet, 
  FileCode, 
  FileText, 
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function ValidationReport({ 
  validationResult, 
  onRemediate, 
  onRevalidateCleaned, 
  isLoading,
  remediationSummary,
  hasCleanedData
}) {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [showRemediationPanel, setShowRemediationPanel] = useState(false);
  
  // Remediation config checkboxes
  const [remedConfig, setRemedConfig] = useState({
    impute_missing: true,
    drop_duplicates: true,
    strip_whitespace: true,
    fix_negative_values: true,
    clip_outliers: true
  });

  if (!validationResult) {
    return (
      <div className="rounded-2xl glass-panel border-slate-800 p-8 text-center space-y-3">
        <Sparkles className="w-10 h-10 text-indigo-400 mx-auto" />
        <h3 className="text-base font-bold text-white">No Validation Run Yet</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Configure or generate your Great Expectations rules in the "Natural Language Quality Rules" tab, then click "Execute Validation Suite".
        </p>
      </div>
    );
  }

  const { statistics, results } = validationResult;
  const isOverallSuccess = validationResult.success;

  const toggleExpand = (idx) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  const handleRunRemediation = () => {
    onRemediate(remedConfig);
  };

  return (
    <div className="space-y-6">
      
      {/* Validation Outcome Top Banner */}
      <div className={`rounded-2xl p-6 border transition-all ${
        isOverallSuccess
          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-100 shadow-xl shadow-emerald-950/20'
          : 'bg-rose-950/40 border-rose-500/40 text-rose-100 shadow-xl shadow-rose-950/20'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl mt-0.5 ${isOverallSuccess ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {isOverallSuccess ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">
                  {isOverallSuccess ? 'Validation Passed Completely!' : 'Validation Violations Detected'}
                </h3>
                <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                  isOverallSuccess ? 'bg-emerald-500/30 text-emerald-200' : 'bg-rose-500/30 text-rose-200'
                }`}>
                  {statistics.success_percent}% Success
                </span>
              </div>
              <p className="text-xs opacity-90 mt-1 max-w-xl leading-relaxed">
                {isOverallSuccess
                  ? 'All Great Expectations rules satisfied. Dataset adheres strictly to specified business constraints.'
                  : `${statistics.unsuccessful_expectations} of ${statistics.evaluated_expectations} expectations failed against the uploaded dataset. Remediation recommended.`}
              </p>
            </div>
          </div>

          {/* Quick Action buttons */}
          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={() => setShowRemediationPanel(!showRemediationPanel)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Wrench className="w-4 h-4" />
              <span>One-Click Auto-Remediation</span>
            </button>

            {hasCleanedData && (
              <button
                onClick={onRevalidateCleaned}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-all disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                <span>Verify on Cleaned Data</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 Metrics Pills */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-white/10 text-xs">
          <div>
            <div className="opacity-75">Evaluated Expectations</div>
            <div className="text-lg font-bold font-mono">{statistics.evaluated_expectations}</div>
          </div>
          <div>
            <div className="opacity-75">Successful Rules</div>
            <div className="text-lg font-bold font-mono text-emerald-300">{statistics.successful_expectations}</div>
          </div>
          <div>
            <div className="opacity-75">Unsuccessful Rules</div>
            <div className="text-lg font-bold font-mono text-rose-300">{statistics.unsuccessful_expectations}</div>
          </div>
        </div>
      </div>

      {/* Remediation Panel (Collapsible) */}
      {showRemediationPanel && (
        <div className="rounded-2xl glass-panel border-indigo-500/30 p-6 space-y-5 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Automated Dataset Remediation Engine</h4>
                <p className="text-xs text-slate-400">Apply algorithmic repairs to eliminate quality defects</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
              <input
                type="checkbox"
                checked={remedConfig.impute_missing}
                onChange={(e) => setRemedConfig({ ...remedConfig, impute_missing: e.target.checked })}
                className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <div className="text-xs font-semibold text-slate-200">Impute Missing Values</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Numeric: Median | Categorical: Mode</div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
              <input
                type="checkbox"
                checked={remedConfig.drop_duplicates}
                onChange={(e) => setRemedConfig({ ...remedConfig, drop_duplicates: e.target.checked })}
                className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <div className="text-xs font-semibold text-slate-200">Drop Duplicate Rows</div>
                <div className="text-[11px] text-slate-400 mt-0.5">De-duplicates identical observations</div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
              <input
                type="checkbox"
                checked={remedConfig.strip_whitespace}
                onChange={(e) => setRemedConfig({ ...remedConfig, strip_whitespace: e.target.checked })}
                className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <div className="text-xs font-semibold text-slate-200">Sanitize Text Whitespace</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Strips leading/trailing space anomalies</div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
              <input
                type="checkbox"
                checked={remedConfig.fix_negative_values}
                onChange={(e) => setRemedConfig({ ...remedConfig, fix_negative_values: e.target.checked })}
                className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <div className="text-xs font-semibold text-slate-200">Rectify Negative Anomalies</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Fix negative tenure, charges, or age</div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
              <input
                type="checkbox"
                checked={remedConfig.clip_outliers}
                onChange={(e) => setRemedConfig({ ...remedConfig, clip_outliers: e.target.checked })}
                className="mt-0.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <div className="text-xs font-semibold text-slate-200">Soft-Clip Extreme Spikes</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Winsorize extreme outliers at 3*IQR</div>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400">
              Non-destructive: original raw data remains preserved in memory.
            </span>
            <button
              onClick={handleRunRemediation}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Executing Cleaning Pipeline...' : 'Run Auto-Cleaning Pipeline'}
            </button>
          </div>

          {/* Remediation Summary Card */}
          {remediationSummary && (
            <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Cleaning Completed Successfully!
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  Estimated Improvement: {remediationSummary.estimated_score_improvement}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs font-mono text-slate-300">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Missing Eliminated</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {remediationSummary.missing_eliminated} cells
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Duplicates Removed</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {remediationSummary.duplicates_removed} rows
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase">Cleaned Rows</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {remediationSummary.final_metrics.rows.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 space-y-1">
                {remediationSummary.actions_applied?.map((act, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="text-emerald-400">•</span>
                    <span><strong>{act.action}:</strong> {act.details}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Itemized Expectations Results List */}
      <div className="rounded-2xl glass-panel border-slate-800 p-6 space-y-4">
        <h4 className="text-sm font-bold text-white">
          Itemized Great Expectations Results
        </h4>

        <div className="space-y-3">
          {results.map((item, idx) => {
            const isPassed = item.success;
            const res = item.result || {};
            const isExpanded = expandedIndex === idx;

            return (
              <div 
                key={idx}
                className={`rounded-xl border transition-all ${
                  isPassed 
                    ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700' 
                    : 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50'
                }`}
              >
                <div 
                  onClick={() => toggleExpand(idx)}
                  className="p-4 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${isPassed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {isPassed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-200">
                          {item.expectation_type}
                        </span>
                        {item.kwargs.column && (
                          <span className="px-2 py-0.2 rounded bg-slate-900 text-indigo-300 font-mono text-[11px] border border-slate-800">
                            {item.kwargs.column}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {item.meta.description || 'Validation assertion'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Failure details badge */}
                    {!isPassed ? (
                      <div className="text-right">
                        <span className="px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-300 font-mono text-xs font-bold border border-rose-500/30">
                          {res.unexpected_count} failing ({res.unexpected_percent}%)
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                        Passed
                      </span>
                    )}

                    <div className="text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Collapsible details (failing sample rows & values) */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-800/60 space-y-3 text-xs animate-in fade-in">
                    
                    {/* Kwargs & Observed */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300 font-mono text-[11px] bg-slate-900/60 p-3 rounded-lg">
                      <div>
                        <strong className="text-slate-400">Target Kwargs:</strong> {JSON.stringify(item.kwargs)}
                      </div>
                      <div>
                        <strong className="text-slate-400">Observed Value:</strong> {JSON.stringify(res.observed_value || 'None')}
                      </div>
                    </div>

                    {/* Failing sample values if failed */}
                    {!isPassed && res.partial_unexpected_list && res.partial_unexpected_list.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-xs font-semibold text-rose-300">
                          Sample Failing Values:
                        </div>
                        <div className="flex flex-wrap gap-1.5 font-mono">
                          {res.partial_unexpected_list.map((v, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-200 border border-rose-500/20 text-[11px]">
                              {String(v)}
                            </span>
                          ))}
                        </div>
                        {res.partial_unexpected_index_list && res.partial_unexpected_index_list.length > 0 && (
                          <div className="text-[11px] text-slate-400 mt-1">
                            Failing row indices: {res.partial_unexpected_index_list.join(', ')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
