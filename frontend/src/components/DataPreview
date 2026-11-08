import React, { useState } from 'react';
import { 
  Table, 
  BarChart, 
  Search, 
  HelpCircle, 
  Hash, 
  Type, 
  Percent, 
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell 
} from 'recharts';

export default function DataPreview({ profile }) {
  if (!profile) return null;

  const [activeTab, setActiveTab] = useState('table'); // 'table' | 'charts' | 'schema'
  const [searchTerm, setSearchTerm] = useState('');

  const { preview_rows, schema, distribution_stats } = profile;

  // Filter columns by search term
  const filteredColumns = schema.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Missing values chart data
  const missingChartData = schema
    .filter(c => c.null_percentage > 0)
    .sort((a, b) => b.null_percentage - a.null_percentage)
    .map(c => ({
      name: c.name,
      null_pct: c.null_percentage,
      null_count: c.null_count
    }));

  return (
    <div className="rounded-2xl glass-panel border-slate-800 p-6 space-y-6">
      
      {/* Top Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>Exploratory Data Profiling & Preview</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-normal">
              First 15 sample rows
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time inspection of feature formats, inferred types, and null indicators
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'table' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Data Table
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'charts' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Missingness Charts
            </button>
            <button
              onClick={() => setActiveTab('schema')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'schema' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Statistical Summary
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: DATA TABLE */}
      {activeTab === 'table' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter column names..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="text-xs text-slate-400">
              Showing {filteredColumns.length} of {schema.length} columns
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 max-h-[460px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 text-[11px] font-mono text-slate-400 w-12 text-center border-r border-slate-800">
                    #
                  </th>
                  {filteredColumns.map((col) => (
                    <th key={col.name} className="py-2.5 px-4 font-semibold text-slate-200 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span>{col.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                          col.is_numeric ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {col.type}
                        </span>
                      </div>
                      {col.null_count > 0 && (
                        <div className="text-[10px] text-amber-400 font-normal mt-0.5">
                          {col.null_percentage}% missing
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {preview_rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-2 px-3 text-[11px] font-mono text-slate-400 text-center border-r border-slate-800/60">
                      {idx + 1}
                    </td>
                    {filteredColumns.map((col) => {
                      const val = row[col.name];
                      const isNull = val === null || val === undefined || (typeof val === 'string' && val.trim() === '');

                      return (
                        <td key={col.name} className="py-2 px-4 whitespace-nowrap text-slate-300 font-mono">
                          {isNull ? (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[10px] font-sans font-semibold">
                              &lt;null&gt;
                            </span>
                          ) : (
                            <span>{String(val)}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: MISSINGNESS CHARTS */}
      {activeTab === 'charts' && (
        <div className="space-y-6">
          {missingChartData.length > 0 ? (
            <div>
              <div className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <span>Missing Value Rates by Column (%)</span>
                <span className="text-slate-400 font-normal">Identifies columns needing imputation or dropping</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={missingChartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(val, name, item) => [`${val}% (${item.payload.null_count} missing records)`, 'Missingness']}
                    />
                    <Bar dataKey="null_pct" radius={[4, 4, 0, 0]}>
                      {missingChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.null_pct > 20 ? '#f43f5e' : (entry.null_pct > 5 ? '#f59e0b' : '#6366f1')} 
                        />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              🎉 No missing values detected in any feature column. Completeness is 100%!
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: STATISTICAL SUMMARY */}
      {activeTab === 'schema' && (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-900 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4 font-semibold text-slate-200">Feature</th>
                <th className="py-2.5 px-4 font-semibold text-slate-200">Type</th>
                <th className="py-2.5 px-4 font-semibold text-slate-200">Mean</th>
                <th className="py-2.5 px-4 font-semibold text-slate-200">Median</th>
                <th className="py-2.5 px-4 font-semibold text-slate-200">Std Dev</th>
                <th className="py-2.5 px-4 font-semibold text-slate-200">Min - Max</th>
                <th className="py-2.5 px-4 font-semibold text-slate-200">IQR Outliers</th>
                <th className="py-2.5 px-4 font-semibold text-slate-200">Z-Score Outliers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {schema.map((col) => {
                const stats = distribution_stats[col.name];

                return (
                  <tr key={col.name} className="hover:bg-slate-900/40 font-mono">
                    <td className="py-2.5 px-4 text-white font-semibold">{col.name}</td>
                    <td className="py-2.5 px-4 text-slate-400">{col.type}</td>
                    <td className="py-2.5 px-4 text-slate-300">{stats ? stats.mean : '—'}</td>
                    <td className="py-2.5 px-4 text-slate-300">{stats ? stats.median : '—'}</td>
                    <td className="py-2.5 px-4 text-slate-300">{stats ? stats.std : '—'}</td>
                    <td className="py-2.5 px-4 text-slate-300">
                      {stats ? `[${stats.min}, ${stats.max}]` : '—'}
                    </td>
                    <td className="py-2.5 px-4">
                      {stats && stats.iqr_outlier_count > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[11px]">
                          {stats.iqr_outlier_count} ({stats.iqr_outlier_percent}%)
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      {stats && stats.z_outlier_count > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 text-[11px] font-bold">
                          {stats.z_outlier_count} (|z| &gt; 3)
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
