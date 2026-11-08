import React, { useState } from 'react';
import { 
  Sparkles, 
  Play, 
  Wand2, 
  Code2, 
  Plus, 
  Trash2, 
  HelpCircle, 
  CheckCircle, 
  FileJson,
  Layers,
  ArrowRight,
  BookOpen
} from 'lucide-react';

export default function RuleStudio({ 
  profile, 
  rules, 
  setRules, 
  onGenerateFromPrompt, 
  onGenerateSmartSuite, 
  onExecuteValidation, 
  isLoading,
  ruleSource 
}) {
  const [promptText, setPromptText] = useState(
    "Monthly charges must be between 10 and 150, customer ID cannot be null and must be unique, and churn must only be 'Yes' or 'No'"
  );
  const [activeTab, setActiveTab] = useState('rules'); // 'rules' | 'json' | 'python'
  const [newExpType, setNewExpType] = useState('expect_column_values_to_not_be_null');
  const [newCol, setNewCol] = useState(profile?.schema?.[0]?.name || '');

  const samplePrompts = [
    {
      title: "Telecom Churn Baseline",
      prompt: "Monthly charges must be between 10 and 150, customer ID cannot be null and must be unique, and churn must only be 'Yes' or 'No'"
    },
    {
      title: "Healthcare Stroke Protocol",
      prompt: "Age must be between 1 and 100, bmi cannot be null, avg_glucose_level must be less than 300, and stroke must be in set [0, 1]"
    },
    {
      title: "Strict Identity & Completeness",
      prompt: "id cannot be null, id must be unique, and gender must only be 'Male' or 'Female'"
    }
  ];

  const handleAddRule = () => {
    if (!newCol) return;
    const newRule = {
      expectation_type: newExpType,
      kwargs: { column: newCol },
      meta: {
        description: `Manual rule: ${newExpType} on ${newCol}`,
        dimension: "Manual"
      }
    };
    setRules([...rules, newRule]);
  };

  const handleDeleteRule = (index) => {
    setRules(rules.filter((_, idx) => idx !== index));
  };

  return (
    <div className="space-y-6">
      
      {/* Research Paper Intro Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-indigo-950/40 border border-indigo-500/20 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 mt-0.5 border border-indigo-500/20">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">
                Quality by Prompt Rule Generation Engine
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">
                Abughazala et al., 2026
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Translates informal business language into rigorous, formal Great Expectations (GE) assertions. 
              Supports zero-shot requirements conversion, automated schema inference, and executable test suites.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={onGenerateSmartSuite}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            <Wand2 className="w-4 h-4 text-violet-400" />
            <span>Mode B: Smart Inferred Suite</span>
          </button>
        </div>
      </div>

      {/* Mode A: Natural Language Requirement Input Box */}
      <div className="rounded-2xl glass-panel border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Mode A: Natural Language Data Quality Requirement (DQR)</span>
          </label>
          <span className="text-[11px] text-slate-400">
            Plain English translated into Great Expectations assertions
          </span>
        </div>

        <div className="relative">
          <textarea
            rows={3}
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Type your data quality rule in plain English (e.g. Monthly charges must be between 10 and 150, customer ID cannot be null and must be unique...)"
            className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 transition-colors font-sans leading-relaxed"
          />
        </div>

        {/* Preset Prompt Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-400 mr-1">Quick Presets:</span>
          {samplePrompts.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => setPromptText(preset.prompt)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
            >
              {preset.title}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-400">
            {ruleSource && (
              <span className="flex items-center gap-1.5 text-indigo-300 font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Source: {ruleSource}</span>
              </span>
            )}
          </div>

          <button
            onClick={() => onGenerateFromPrompt(promptText)}
            disabled={isLoading || !promptText.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isLoading ? 'Translating via Engine...' : 'Transform Prompt into GE Rules'}</span>
          </button>
        </div>
      </div>

      {/* Rules Studio & Inspector */}
      <div className="rounded-2xl glass-panel border-slate-800 p-6 space-y-5">
        
        {/* Sub-header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">
                Active Great Expectations Suite
              </h3>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                {rules.length} Rules Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Review, edit, and execute GE validation assertions against the dataset
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('rules')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  activeTab === 'rules' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Rule Cards
              </button>
              <button
                onClick={() => setActiveTab('json')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  activeTab === 'json' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                GE JSON Suite
              </button>
            </div>

            <button
              onClick={onExecuteValidation}
              disabled={isLoading || rules.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition-all disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Execute Validation Suite</span>
            </button>
          </div>
        </div>

        {/* TAB 1: RULE CARDS */}
        {activeTab === 'rules' && (
          <div className="space-y-4">
            
            {/* Quick Add Custom Rule Bar */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-indigo-400" /> Add Rule:
              </span>
              <select
                value={newExpType}
                onChange={(e) => setNewExpType(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="expect_column_values_to_not_be_null">expect_column_values_to_not_be_null</option>
                <option value="expect_column_values_to_be_unique">expect_column_values_to_be_unique</option>
                <option value="expect_column_values_to_be_between">expect_column_values_to_be_between</option>
                <option value="expect_column_values_to_be_in_set">expect_column_values_to_be_in_set</option>
                <option value="expect_table_row_count_to_be_between">expect_table_row_count_to_be_between</option>
              </select>

              <select
                value={newCol}
                onChange={(e) => setNewCol(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {profile?.schema?.map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>

              <button
                onClick={handleAddRule}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                Insert Rule
              </button>
            </div>

            {/* List of active rules */}
            {rules.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-800 rounded-xl">
                No Great Expectations rules created yet. Type a requirement prompt above or click "Mode B: Smart Inferred Suite".
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {rules.map((rule, idx) => {
                  const kwargs = rule.kwargs || {};
                  const meta = rule.meta || {};

                  return (
                    <div 
                      key={idx}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-mono font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="font-mono text-xs font-bold text-indigo-300">
                              {rule.expectation_type}
                            </span>
                          </div>

                          <button
                            onClick={() => handleDeleteRule(idx)}
                            className="text-slate-400 hover:text-rose-400 p-1 transition-colors"
                            title="Remove Rule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="mt-2.5 text-xs text-slate-200 font-medium">
                          {meta.description || 'Validates tabular assertion constraint.'}
                        </div>

                        {/* Kwargs pill badges */}
                        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-mono">
                          {kwargs.column && (
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                              column: <strong className="text-white">{kwargs.column}</strong>
                            </span>
                          )}
                          {kwargs.min_value !== undefined && (
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                              min: {kwargs.min_value}
                            </span>
                          )}
                          {kwargs.max_value !== undefined && (
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                              max: {kwargs.max_value}
                            </span>
                          )}
                          {kwargs.value_set && (
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                              set: [{kwargs.value_set.join(', ')}]
                            </span>
                          )}
                        </div>
                      </div>

                      {meta.dimension && (
                        <div className="mt-3 pt-2.5 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-400">
                          <span>Dimension: <strong className="text-slate-300">{meta.dimension}</strong></span>
                          <span className="text-slate-400">Great Expectations v3</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: RAW JSON SUITE */}
        {activeTab === 'json' && (
          <div className="relative">
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto max-h-[400px]">
              {JSON.stringify({
                data_asset_type: "Dataset",
                expectation_suite_name: "dataqualai_suite",
                expectations: rules
              }, null, 2)}
            </pre>
          </div>
        )}

      </div>

    </div>
  );
}
