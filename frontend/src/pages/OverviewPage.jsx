import React from 'react';
import { useEffect, useState } from 'react';
import { ArrowRight, Beaker, CheckCircle2, Database, Dna, FlaskConical, Gauge, Sparkles } from 'lucide-react';
import { api } from '../services/api.js';
import MetricCard from '../components/ui/MetricCard.jsx';
import LoadingState from '../components/ui/LoadingState.jsx';
import Notice from '../components/ui/Notice.jsx';

export default function OverviewPage({ onNavigate }) {
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState({ loading: true, error: '' });
  useEffect(() => {
    let active = true;
    Promise.all([api.datasetSummary(), api.health()])
      .then(([data, health]) => { if (active) { setSummary({ ...data, health }); setStatus({ loading: false, error: '' }); } })
      .catch((error) => { if (active) setStatus({ loading: false, error: error.message }); });
    return () => { active = false; };
  }, []);

  return <div className="page-stack overview-page">
    <section className="dashboard-hero">
      <div className="dashboard-hero-grid" />
      <div className="dashboard-hero-copy">
        <div className="eyebrow"><span className="eyebrow-line" /> YOUR FORMULATION WORKSPACE</div>
        <h1>Design better blends.<br /><em>Prove them virtually.</em></h1>
        <p>Explore real plant-protein extrusion data, test process conditions and shortlist formulations before spending time in the physical lab.</p>
        <div className="hero-buttons"><button className="button-primary" onClick={() => onNavigate('virtual-lab')}>Run a virtual experiment <ArrowRight size={16} /></button><button className="button-ghost" onClick={() => onNavigate('dataset')}>Explore dataset</button></div>
        <div className="hero-mini-proof"><span><CheckCircle2 size={14} /> Experimental data-backed</span><span><Dna size={14} /> 6 protein sources</span><span><Beaker size={14} /> Texture-first MVP</span></div>
      </div>
      <div className="dashboard-hero-visual"><div className="hero-visual-orbit orbit-a" /><div className="hero-visual-orbit orbit-b" /><div className="hero-visual-core"><Dna size={49} strokeWidth={1.1} /></div><span className="hero-float-tag tag-a"><span /> 50:50 blend space</span><span className="hero-float-tag tag-b"><Gauge size={13} /> texture signals</span><span className="hero-float-tag tag-c">FORMULATION / 001</span></div>
    </section>

    {status.loading ? <LoadingState label="Connecting to experimental datasets…" /> : status.error ? <Notice type="warning" title="Backend connection needed">{status.error} Start the Node API on port 5000 and refresh this page.</Notice> : <>
      <section className="metric-grid">
        <MetricCard label="Measured rows" value={summary.totals.measurements.toLocaleString()} detail="Across the two supplied trial files" icon={Database} tone="mint" />
        <MetricCard label="Ingredient sources" value={summary.proteins.length} detail={summary.proteins.join(' · ')} icon={Dna} tone="blue" />
        <MetricCard label="Blend pairs" value={summary.blendPairs.length} detail="Recorded 50:50 combinations" icon={Beaker} tone="violet" />
        <MetricCard label="Texture signals" value={7} detail="Hardness, chewiness, cohesion + more" icon={Gauge} tone="orange" />
      </section>
      <div className="section-heading"><div><span className="section-kicker">START HERE</span><h2>From experiment data to a smarter shortlist</h2></div><span className="section-meta">01 — 03</span></div>
      <section className="workflow-grid">
        <button className="workflow-card" onClick={() => onNavigate('dataset')}><span className="workflow-number">01</span><span className="workflow-icon"><Database size={20} /></span><h3>Inspect the data</h3><p>Understand which ingredient blends and process settings have measured evidence.</p><span className="workflow-link">Open dataset <ArrowRight size={14} /></span></button>
        <button className="workflow-card" onClick={() => onNavigate('virtual-lab')}><span className="workflow-number">02</span><span className="workflow-icon"><FlaskConical size={20} /></span><h3>Run a virtual test</h3><p>Choose a supported blend, adjust process settings and inspect predicted texture signals.</p><span className="workflow-link">Launch lab <ArrowRight size={14} /></span></button>
        <button className="workflow-card" onClick={() => onNavigate('ingredients')}><span className="workflow-number">03</span><span className="workflow-icon"><Sparkles size={20} /></span><h3>Ground cost & nutrition</h3><p>Add source-traceable ingredient prices and protein values before applying those filters.</p><span className="workflow-link">Add ingredient data <ArrowRight size={14} /></span></button>
      </section>
      <Notice type="info" title="Honest model boundary">The uploaded files measure extrusion properties; they do not provide ingredient prices or nutritional composition. Blend ranking can use texture estimates now. Cost and protein constraints remain inactive until verified ingredient profiles are added.</Notice>
      <section className="panel health-panel"><div className="panel-title-row"><div><span className="section-kicker">SYSTEM STATUS</span><h3>Data pipeline</h3></div><span className="live-pill"><i /> API connected</span></div><div className="pipeline-strip"><div className="pipeline-node"><span className="pipeline-icon"><Database size={16} /></span><div><strong>CSV experiments</strong><small>{summary.totals.trial1Rows} Trial 1 rows · {summary.totals.trial2Rows.toLocaleString()} Trial 2 rows</small></div></div><span className="pipeline-arrow">→</span><div className="pipeline-node"><span className="pipeline-icon"><Gauge size={16} /></span><div><strong>Feature aggregation</strong><small>{summary.totals.aggregatedExperimentGroups} experiment groups</small></div></div><span className="pipeline-arrow">→</span><div className="pipeline-node"><span className="pipeline-icon"><Sparkles size={16} /></span><div><strong>Texture estimator</strong><small>Python baseline · evidence limited</small></div></div></div></section>
    </>}
  </div>;
}
