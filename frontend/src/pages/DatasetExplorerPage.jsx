
import React from 'react';
import { useEffect, useState } from 'react';
import { ArrowDownToLine, Database, Filter, Info } from 'lucide-react';
import { api } from '../services/api.js';
import LoadingState from '../components/ui/LoadingState.jsx';
import Notice from '../components/ui/Notice.jsx';

export default function DatasetExplorerPage() {
  const [summary, setSummary] = useState(null);
  const [experimentData, setExperimentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterProtein, setFilterProtein] = useState('all');
  useEffect(() => {
    let active = true;
    Promise.all([api.datasetSummary(), api.experiments()]).then(([sum, exps]) => { if (active) { setSummary(sum); setExperimentData(exps.experiments); setLoading(false); } }).catch((e) => { if (active) { setError(e.message); setLoading(false); } });
    return () => { active = false; };
  }, []);
  const rows = (experimentData || []).filter((row) => filterProtein === 'all' || row.Protein_1 === filterProtein || row.Protein_2 === filterProtein);
  const fmt = (v) => v == null || Number.isNaN(Number(v)) ? '—' : Number(v).toLocaleString(undefined, { maximumFractionDigits: 3 });

  return <div className="page-stack">
    <div className="page-intro-row"><div><span className="section-kicker">DATA INVENTORY / 03</span><h1>Dataset explorer</h1><p>Inspect the evidence behind the virtual lab. Replicates are aggregated to experiment-level measurements before modelling.</p></div><span className="source-pill"><Database size={14} /> SOURCE CSVs</span></div>
    {error && <Notice type="warning" title="Cannot load datasets">{error}</Notice>}
    {loading ? <LoadingState /> : <>
      <div className="dataset-source-grid"><article className="dataset-source-card"><div className="dataset-source-icon"><Database size={19} /></div><div className="dataset-source-meta"><span>TRIAL 1</span><strong>{summary.totals.trial1Rows.toLocaleString()} rows</strong></div><p>100% single-protein extrusion observations. Density, water holding, expansion and colour; no texture-profile category.</p><div className="dataset-tags"><span>6 proteins</span><span>single protein</span><span>extrudate</span></div></article><article className="dataset-source-card dataset-source-card--highlight"><div className="dataset-source-icon"><Filter size={19} /></div><div className="dataset-source-meta"><span>TRIAL 2</span><strong>{summary.totals.trial2Rows.toLocaleString()} rows</strong></div><p>Mostly 50:50 binary protein blends with measured texture-profile analysis across process conditions.</p><div className="dataset-tags"><span>50:50 blends</span><span>texture metrics</span><span>{summary.totals.aggregatedExperimentGroups} grouped conditions</span></div></article></div>
      <Notice type="info" title="How to interpret the table">Each row below is an aggregated experiment condition. Values are means of replicate measurements for a given metric. They are not separate recipes for every measurement row.</Notice>
      <section className="panel dataset-table-panel"><div className="panel-title-row"><div><span className="section-kicker">AGGREGATED RESULTS</span><h2>Trial 2 blend experiments</h2></div><label className="table-filter"><Filter size={14} /><select value={filterProtein} onChange={(e) => setFilterProtein(e.target.value)}><option value="all">All proteins</option>{summary.proteins.map((p) => <option key={p}>{p}</option>)}</select></label></div>
        <div className="table-scroll"><table className="data-table"><thead><tr><th>Blend</th><th>Ratio</th><th>Feed</th><th>SS</th><th>MC</th><th>Hardness</th><th>Chewiness</th><th>Springiness</th><th>Cohesion</th><th>WHC</th></tr></thead><tbody>{rows.map((row, i) => <tr key={`${row.Protein_1}-${row.Protein_2}-${row.Sample}-${i}`}><td><strong>{row.Protein_1} + {row.Protein_2}</strong><small>Sample {row.Sample ?? '—'}</small></td><td>{row.Protein_1_Ratio}:{row.Protein_2_Ratio}</td><td>{fmt(row.Feed)}</td><td>{fmt(row.SS)}</td><td>{fmt(row.MC)}</td><td>{fmt(row.metrics.Hardness)}</td><td>{fmt(row.metrics.Chewiness)}</td><td>{fmt(row.metrics.Springiness)}</td><td>{fmt(row.metrics.Cohesion)}</td><td>{fmt(row.metrics.WHC)}</td></tr>)}</tbody></table></div>
        <div className="table-foot"><span>Showing {rows.length} aggregated experiment conditions with measured texture.</span><span><ArrowDownToLine size={13} /> Raw source files retained in <code>data/raw/</code></span></div>
      </section>
      <section className="panel data-limit-panel"><div className="panel-title-row"><div><span className="section-kicker">DATA QUALITY & SCOPE</span><h2>What the current dataset can tell us</h2></div><Info size={18} /></div><div className="data-limit-list">{summary.dataLimits.map((limit, i) => <div key={limit}><span>{String(i + 1).padStart(2, '0')}</span><p>{limit}</p></div>)}</div></section>
    </>}
  </div>;
}
