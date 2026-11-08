import React from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Layers, 
  Fingerprint, 
  CheckCheck, 
  BarChart2, 
  Sliders, 
  Target,
  FileText,
  Copy,
  HardDrive
} from 'lucide-react';

export default function KPICards({ profile }) {
  if (!profile) return null;

  const { dataset_summary, quality_scores, target_stats } = profile;
  const overall = quality_scores.overall || 0;
  const grade = quality_scores.grade || 'N/A';
  const dims = quality_scores.dimensions || {};

  // Score color logic
  const getScoreColor = (score) => {
    if (score >= 85) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 70) return 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10';
    if (score >= 50) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  const getProgressColor = (score) => {
    if (score >= 85) return 'bg-emerald-500';
    if (score >= 70) return 'bg-indigo-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const dimensionConfigs = [
    {
      key: 'completeness',
      title: 'Completeness',
      icon: Layers,
      description: 'Missing values & empty records',
      metric: `${dataset_summary.total_missing_cells} cells (${dataset_summary.total_missing_percent}%)`
    },
    {
      key: 'uniqueness',
      title: 'Uniqueness',
      icon: Fingerprint,
      description: 'Duplicate rows & primary key collisions',
      metric: `${dataset_summary.duplicate_rows} dups (${dataset_summary.duplicate_percent}%)`
    },
    {
      key: 'validity',
      title: 'Validity & Types',
      icon: CheckCheck,
      description: 'Type mismatches & domain boundaries',
      metric: 'Dtype & domain health'
    },
    {
      key: 'range_distribution',
      title: 'Range & Distribution',
      icon: BarChart2,
      description: 'IQR & Z-score statistical outliers',
      metric: 'Extreme values |Z| > 3'
    },
    {
      key: 'consistency',
      title: 'Consistency',
      icon: Sliders,
      description: 'Whitespace, casing & rare categories',
      metric: 'Categorical integrity'
    },
    {
      key: 'target_health',
      title: 'Target / Label Health',
      icon: Target,
      description: 'Class imbalance & label noise',
      metric: target_stats?.imbalance_ratio ? `Ratio ${target_stats.imbalance_ratio}:1` : 'Supervised metrics'
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Composite Quality Diagnosis Score + Top Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Overall Quality Score Card (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl glass-panel p-6 relative overflow-hidden flex flex-col justify-between border-indigo-500/20">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Diagnosis Quality Index
              </span>
              <h2 className="text-xl font-bold text-white mt-0.5">Composite Score</h2>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getScoreColor(overall)}`}>
              {grade}
            </span>
          </div>

          <div className="my-6 flex items-baseline gap-4">
            <div className="text-5xl font-extrabold tracking-tight text-white font-mono">
              {overall}%
            </div>
            <div className="text-xs text-slate-400 max-w-[200px] leading-relaxed">
              Synthesized across 6 diagnostic quality dimensions & Great Expectations rules.
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span>0% Critical</span>
              <span>Target: 100%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-800/80 overflow-hidden p-0.5">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${getProgressColor(overall)}`}
                style={{ width: `${Math.min(100, Math.max(5, overall))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Dataset Metrics (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl glass-panel p-4 flex flex-col justify-between border-slate-800">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Total Rows</span>
              <FileText className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono text-white">
                {dataset_summary.total_rows.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Records ingested</div>
            </div>
          </div>

          <div className="rounded-2xl glass-panel p-4 flex flex-col justify-between border-slate-800">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Total Columns</span>
              <Layers className="w-4 h-4 text-violet-400" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono text-white">
                {dataset_summary.total_columns}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Feature schema</div>
            </div>
          </div>

          <div className="rounded-2xl glass-panel p-4 flex flex-col justify-between border-slate-800">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Missing Cells</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono text-amber-300">
                {dataset_summary.total_missing_percent}%
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {dataset_summary.total_missing_cells} cells empty
              </div>
            </div>
          </div>

          <div className="rounded-2xl glass-panel p-4 flex flex-col justify-between border-slate-800">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Duplicates</span>
              <Copy className="w-4 h-4 text-rose-400" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold font-mono text-white">
                {dataset_summary.duplicate_rows}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {dataset_summary.duplicate_percent}% duplicate
              </div>
            </div>
          </div>

          {/* Additional details row */}
          <div className="col-span-2 sm:col-span-4 rounded-xl bg-slate-900/60 border border-slate-800/80 px-4 py-3 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-slate-400" />
              <span>In-Memory Size: <strong className="text-white font-mono">{dataset_summary.memory_usage_mb} MB</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span>Primary Key:</span>
              {dataset_summary.primary_key_candidate ? (
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[11px]">
                  {dataset_summary.primary_key_candidate}
                </span>
              ) : (
                <span className="text-slate-400 italic">None auto-detected</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 6 Dimensions Breakdown Grid */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-sm font-bold text-slate-200 tracking-wide flex items-center gap-2">
            <span>6-Dimensional Diagnostic Breakdown</span>
            <span className="text-xs font-normal text-slate-400">(Theoretical Foundation)</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dimensionConfigs.map((cfg) => {
            const Icon = cfg.icon;
            const dimData = dims[cfg.key] || { score: 100, weight: 0.16 };
            const score = dimData.score;

            return (
              <div 
                key={cfg.key}
                className="rounded-xl glass-panel p-4.5 border-slate-800 glass-panel-hover flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{cfg.title}</h4>
                        <p className="text-[11px] text-slate-400">{cfg.description}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${getScoreColor(score)}`}>
                      {score}%
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{cfg.metric}</span>
                    <span className="font-mono text-slate-400">Wt: {Math.round(dimData.weight * 100)}%</span>
                  </div>
                </div>

                <div className="mt-2.5 w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ${getProgressColor(score)}`}
                    style={{ width: `${Math.min(100, Math.max(3, score))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
