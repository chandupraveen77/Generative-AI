import React, { useState } from 'react';
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  Filter, 
  Search, 
  Wrench, 
  CheckCircle2 
} from 'lucide-react';

export default function FindingsTable({ findings, onNavigateToRemediate }) {
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [dimensionFilter, setDimensionFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  if (!findings || findings.length === 0) {
    return (
      <div className="rounded-2xl glass-panel border-slate-800 p-8 text-center space-y-3">
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
        <h3 className="text-base font-bold text-white">No Critical Diagnostic Findings</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          The dataset passed all primary diagnostic integrity and distribution checks with zero high-severity anomalies.
        </p>
      </div>
    );
  }

  // Extract unique dimensions
  const dimensions = ['ALL', ...new Set(findings.map(f => f.dimension))];

  // Filter findings
  const filteredFindings = findings.filter(f => {
    const matchesSev = severityFilter === 'ALL' || f.severity === severityFilter;
    const matchesDim = dimensionFilter === 'ALL' || f.dimension === dimensionFilter;
    const matchesSearch = 
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.column.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSev && matchesDim && matchesSearch;
  });

  const highCount = findings.filter(f => f.severity === 'HIGH').length;
  const medCount = findings.filter(f => f.severity === 'MEDIUM').length;
  const lowCount = findings.filter(f => f.severity === 'LOW').length;

  return (
    <div className="rounded-2xl glass-panel border-slate-800 p-6 space-y-5">
      
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-white">
              Itemized Diagnostic Findings
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {findings.length} issues detected
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Prioritized tabular anomalies categorized by severity and data dimension
          </p>
        </div>

        {/* Severity summary pills */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setSeverityFilter(severityFilter === 'HIGH' ? 'ALL' : 'HIGH')}
            className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-all ${
              severityFilter === 'HIGH' 
                ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-1 ring-rose-500' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>High: {highCount}</span>
          </button>

          <button
            onClick={() => setSeverityFilter(severityFilter === 'MEDIUM' ? 'ALL' : 'MEDIUM')}
            className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-all ${
              severityFilter === 'MEDIUM' 
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500' 
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Medium: {medCount}</span>
          </button>

          <button
            onClick={() => setSeverityFilter(severityFilter === 'LOW' ? 'ALL' : 'LOW')}
            className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-all ${
              severityFilter === 'LOW' 
                ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500' 
                : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20'
            }`}
          >
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            <span>Low: {lowCount}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Search */}
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search anomalies by column, title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Dimension Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {dimensions.map(dim => (
            <button
              key={dim}
              onClick={() => setDimensionFilter(dim)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                dimensionFilter === dim
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {dim}
            </button>
          ))}
        </div>
      </div>

      {/* Findings Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold">
            <tr>
              <th className="py-3 px-4 w-28">Severity</th>
              <th className="py-3 px-4 w-32">Dimension</th>
              <th className="py-3 px-4 w-36">Column</th>
              <th className="py-3 px-4">Diagnosis & Description</th>
              <th className="py-3 px-4 w-32">Impact</th>
              <th className="py-3 px-4 w-48">Recommended Fix</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredFindings.map((finding) => {
              const isHigh = finding.severity === 'HIGH';
              const isMed = finding.severity === 'MEDIUM';

              return (
                <tr key={finding.id} className="hover:bg-slate-900/40 transition-colors">
                  
                  {/* Severity */}
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-bold text-[11px] border ${
                      isHigh
                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        : isMed
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                    }`}>
                      {isHigh && <AlertCircle className="w-3 h-3 text-rose-400" />}
                      {isMed && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                      {!isHigh && !isMed && <Info className="w-3 h-3 text-indigo-400" />}
                      {finding.severity}
                    </span>
                  </td>

                  {/* Dimension */}
                  <td className="py-3 px-4 font-medium text-slate-300">
                    {finding.dimension}
                  </td>

                  {/* Column */}
                  <td className="py-3 px-4">
                    <span className="font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-200 border border-slate-800 text-[11px]">
                      {finding.column}
                    </span>
                  </td>

                  {/* Description */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-100">{finding.title}</div>
                    <div className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                      {finding.description}
                    </div>
                  </td>

                  {/* Impact */}
                  <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-300">
                    <div>{finding.affected_count.toLocaleString()} rows</div>
                    <div className="text-[10px] text-slate-400">({finding.affected_percent}%)</div>
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4">
                    <div className="text-[11px] text-indigo-300 bg-indigo-950/40 p-2 rounded-lg border border-indigo-800/40">
                      {finding.recommended_action}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
