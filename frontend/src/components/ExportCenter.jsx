import React from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  FileCode, 
  FileText, 
  FileJson, 
  Sparkles,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export default function ExportCenter({ 
  hasCleanedData, 
  hasRules, 
  hasProfile,
  onExportDataset, 
  onExportSuiteJson, 
  onExportScriptPy, 
  onExportReportPdf, 
  onExportReportMd 
}) {
  const exportItems = [
    {
      title: "Cleaned Tabular Dataset",
      format: ".CSV",
      icon: FileSpreadsheet,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      description: "Sanitized data with imputed missing values, de-duplicated rows, stripped whitespace, and clipped outliers.",
      actionLabel: "Download Cleaned CSV",
      onClick: () => onExportDataset('cleaned'),
      enabled: hasCleanedData || hasProfile
    },
    {
      title: "Great Expectations Rule Suite",
      format: ".JSON",
      icon: FileJson,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      description: "Official GE v3/v1 compliant JSON expectation suite artifact ready to commit to data pipeline repos.",
      actionLabel: "Export GE Suite (.json)",
      onClick: onExportSuiteJson,
      enabled: hasRules
    },
    {
      title: "Standalone Python Validation Script",
      format: ".PY",
      icon: FileCode,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
      description: "Executable Python test script using great_expectations and pandas for automated CI/CD integration.",
      actionLabel: "Download Python Script",
      onClick: onExportScriptPy,
      enabled: hasRules
    },
    {
      title: "Executive Quality Audit Report",
      format: ".PDF",
      icon: FileText,
      color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      description: "Formatted PDF publication with composite diagnosis score, dimensional radar, and itemized findings.",
      actionLabel: "Download Audit Report (.pdf)",
      onClick: onExportReportPdf,
      enabled: hasProfile
    },
    {
      title: "Markdown Quality Summary",
      format: ".MD",
      icon: FileText,
      color: "text-violet-400 bg-violet-500/10 border-violet-500/20",
      description: "GitHub-flavored markdown audit summary for repository READMEs, pull request comments, and wikis.",
      actionLabel: "Download Markdown Report",
      onClick: onExportReportMd,
      enabled: hasProfile
    }
  ];

  return (
    <div className="rounded-2xl glass-panel border-slate-800 p-6 space-y-6">
      
      <div>
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span>Artifact & Export Center</span>
          <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 font-semibold">
            Production Ready
          </span>
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Download cleaned datasets, Great Expectations suites, executable scripts, and executive reports
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exportItems.map((item, idx) => {
          const Icon = item.icon;

          return (
            <div
              key={idx}
              className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl border ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                    {item.format}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white mt-3.5">{item.title}</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-900">
                <button
                  onClick={item.onClick}
                  disabled={!item.enabled}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-semibold group-hover:border-indigo-500/50 transition-all disabled:opacity-40 disabled:hover:bg-slate-900"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{item.actionLabel}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
