import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, Beaker, FlaskConical, Gauge, Play, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { api } from '../services/api.js';
import LoadingState from '../components/ui/LoadingState.jsx';
import Notice from '../components/ui/Notice.jsx';
import ConfidencePill from '../components/ui/ConfidencePill.jsx';

const METRICS = [
  { key: 'Hardness', label: 'Hardness', unit: 'source units', description: 'Force required for the first bite.' },
  { key: 'Chewiness', label: 'Chewiness', unit: 'source units', description: 'Energy-like texture signal associated with chewing.' },
  { key: 'Springiness', label: 'Springiness', unit: 'source units', description: 'How much the sample rebounds.' },
  { key: 'Cohesion', label: 'Cohesion', unit: 'source units', description: 'How well the structure holds together.' },
  { key: 'WHC', label: 'Water holding', unit: 'source units', description: 'Water-holding capacity where measured.' },
  { key: 'ER', label: 'Expansion ratio', unit: 'source units', description: 'Expansion measurement from extrusion.' },
];

function NumberSlider({ label, value, min, max, step, onChange, suffix = '' }) {
  return <label className="control-field slider-field"><span>{label}<strong>{value}{suffix}</strong></span><input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /><span className="slider-bounds"><small>{min}{suffix}</small><small>{max}{suffix}</small></span></label>;
}

export default function VirtualLabPage({ config, setConfig, onShowRankings }) {
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [result, setResult] = useState(null);
  const [loadingRun, setLoadingRun] = useState(false);
  const [error, setError] = useState('');
  const [showObserved, setShowObserved] = useState(false);

  useEffect(() => {
    let active = true;
    api.datasetSummary().then((data) => {
      if (!active) return;
      setSummary(data);
      const selected = data.blendPairs.find((item) => item.proteinA === config.proteinA && item.proteinB === config.proteinB) || data.blendPairs[0];
      if (selected) setConfig((current) => ({ ...current, proteinA: selected.proteinA, proteinB: selected.proteinB }));
      setLoadingSummary(false);
    }).catch((e) => { if (active) { setError(e.message); setLoadingSummary(false); } });
    return () => { active = false; };
  }, []);

  const blendPairs = summary?.blendPairs.filter((item) => item.hasTexture) || [];
  const selectedKey = `${config.proteinA}__${config.proteinB}`;
  const selectedPair = useMemo(() => blendPairs.find((item) => `${item.proteinA}__${item.proteinB}` === selectedKey), [blendPairs, selectedKey]);
  const predictions = result?.predictedMetrics || result?.metrics || {};
  const measured = result?.nearestObservedMetrics || result?.metrics || {};

  const update = (key, value) => setConfig((current) => ({ ...current, [key]: value }));
  const updatePreference = (key, value) => setConfig((current) => ({ ...current, texturePreferences: { ...current.texturePreferences, [key]: value } }));

  async function runExperiment() {
    setLoadingRun(true); setError(''); setResult(null);
    try {
      const data = await api.runLab({
        proteinA: config.proteinA, proteinB: config.proteinB,
        feed: config.feed, ss: config.ss, mc: config.mc,
        texturePreferences: config.texturePreferences,
      });
      setResult(data);
    } catch (e) { setError(e.message); }
    finally { setLoadingRun(false); }
  }

  if (loadingSummary) return <LoadingState label="Loading supported blend experiments…" />;

  return <div className="page-stack">
    <div className="page-intro-row"><div><span className="section-kicker">EXPERIMENT STUDIO / 01</span><h1>Virtual lab</h1><p>Change a supported blend and process conditions to estimate texture outcomes using the measured experiment data.</p></div><div className="lab-mode-pill"><span className="pulse-dot" /> SURROGATE MODEL ACTIVE</div></div>
    {error && <Notice type="warning" title="Action needs attention">{error}</Notice>}
    <div className="lab-layout">
      <section className="panel lab-controls-panel">
        <div className="panel-title-row"><div><div className="panel-icon"><SlidersHorizontal size={18} /></div><div><h2>Set up experiment</h2><p>Use a recorded 50:50 protein blend from Trial 2.</p></div></div><span className="step-label">STEP 01</span></div>
        <div className="form-section-label">PROTEIN BLEND <span>50 / 50 ratio</span></div>
        <div className="blend-select-row">
          <label className="control-field"><span>Protein A</span><select value={selectedKey} onChange={(event) => { const [proteinA, proteinB] = event.target.value.split('__'); setConfig((current) => ({ ...current, proteinA, proteinB })); setResult(null); }}>
            {blendPairs.map((pair) => <option key={`${pair.proteinA}__${pair.proteinB}`} value={`${pair.proteinA}__${pair.proteinB}`}>{pair.proteinA} + {pair.proteinB}</option>)}
          </select></label>
          <div className="blend-ratio-indicator"><span>50%</span><i /><span>50%</span></div>
        </div>
        <div className="blend-ingredient-chips"><span className="ingredient-chip"><i />{config.proteinA || 'Protein A'}</span><span className="ingredient-chip ingredient-chip--blue"><i />{config.proteinB || 'Protein B'}</span></div>

        <div className="form-section-label process-label">PROCESS SETTINGS <span>Source columns</span></div>
        <div className="slider-list">
          <NumberSlider label="Feed" value={config.feed} min={30} max={35} step={1} onChange={(v) => update('feed', v)} />
          <NumberSlider label="SS" value={config.ss} min={600} max={600} step={1} onChange={(v) => update('ss', v)} />
          <NumberSlider label="MC" value={config.mc} min={24} max={31.7} step={0.1} suffix="" onChange={(v) => update('mc', v)} />
        </div>
        <Notice type="info">The CSV does not document the units for Feed / SS / MC. We preserve the original column labels and restrict inputs to the observed data range.</Notice>
        <div className="lab-actions"><button className="button-primary button-full" onClick={runExperiment} disabled={loadingRun || !selectedPair}>{loadingRun ? <><span className="button-spinner" /> Running model…</> : <><Play size={16} fill="currentColor" /> Run virtual experiment</>}</button><button className="icon-button reset-button" aria-label="Reset process settings" onClick={() => { setConfig((current) => ({ ...current, feed: 35, ss: 600, mc: 28 })); setResult(null); }}><RotateCcw size={16} /></button></div>
      </section>

      <section className="lab-result-column">
        <div className="panel lab-visual-panel">
          <div className="lab-visual-grid" />
          <div className="lab-visual-orbit lab-visual-orbit--one" /><div className="lab-visual-orbit lab-visual-orbit--two" />
          <div className="lab-visual-header"><span><FlaskConical size={15} /> VIRTUAL EXTRUSION CHAMBER</span><span className="live-pill"><i /> LIVE VIEW</span></div>
          <div className="extruder-visual"><div className="extruder-feed"><span>FEED</span><div /></div><div className="extruder-body"><div className="extruder-window"><div className="extruder-screw"><i /><i /><i /><i /><i /><i /></div><span>PROCESS ZONE</span></div><div className="extruder-controls"><b /><b /><b /></div></div><div className="extruder-nozzle"><i /><i /><i /></div><div className="extruder-product"><span /><span /><span /><span /><span /></div></div>
          <div className="lab-visual-footer"><span><i className="tiny-dot mint" /> PROTEIN MATRIX</span><span><i className="tiny-dot blue" /> TEXTURE SIGNALS</span><span className="visual-condition">{config.feed} / {config.ss} / {Number(config.mc).toFixed(1)}</span></div>
        </div>

        <div className="panel results-panel">
          <div className="panel-title-row"><div><span className="section-kicker">MODEL OUTPUT</span><h2>Experiment readout</h2></div>{result && <ConfidencePill level={result.confidence?.level || 'low'} />}</div>
          {!result && !loadingRun && <div className="results-empty"><div className="empty-icon"><Gauge size={25} /></div><h3>Your results will appear here</h3><p>Run the virtual experiment to estimate texture metrics and view the nearest measured condition.</p><div className="empty-data-points"><span>01 / Predict</span><span>02 / Compare</span><span>03 / Test physically</span></div></div>}
          {loadingRun && <LoadingState label="Aggregating experiments and estimating texture…" />}
          {result && <>
            {!result.available ? <Notice type="warning" title="No supported prediction">{result.message || 'No experiment support for this input.'}</Notice> : <>
              <div className="result-summary-row"><div><span className="result-label">PROTEIN BLEND</span><strong>{result.recipe?.proteinA} <i>+</i> {result.recipe?.proteinB}</strong></div><div><span className="result-label">RATIO</span><strong>50 : 50</strong></div><div><span className="result-label">SUPPORT</span><strong>{result.supportExperiments} <small>conditions</small></strong></div></div>
              <div className="readout-grid">{METRICS.filter((item) => predictions[item.key] != null || measured[item.key] != null).map((item) => <div className="readout-card" key={item.key}><div className="readout-top"><span>{item.label}</span><span className="readout-unit">{item.unit}</span></div><strong>{Number(predictions[item.key] ?? measured[item.key]).toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong><p>{item.description}</p></div>)}</div>
              <button className="text-button" onClick={() => setShowObserved((v) => !v)}>{showObserved ? 'Hide' : 'Compare with'} nearest measured experiment <ArrowRight size={14} className={showObserved ? 'arrow-rotated' : ''} /></button>
              {showObserved && <div className="observed-compare"><div><span>Nearest condition</span><strong>Feed {result.nearestObservedProcess?.Feed} · SS {result.nearestObservedProcess?.SS} · MC {result.nearestObservedProcess?.MC}</strong></div><div className="observed-metric-list">{Object.entries(measured).slice(0, 10).map(([key, value]) => <span key={key}>{key}<strong>{Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong></span>)}</div></div>}
              <Notice type="warning" title="Prototype result, not a physical test">{result.caveat || result.confidence?.reason}</Notice>
            </>}
          </>}
          <div className="results-bottom"><span><AlertCircle size={14} /> Evidence-limited model</span><button className="text-button" onClick={onShowRankings}>Rank blends <ArrowRight size={14} /></button></div>
        </div>
      </section>
    </div>
  </div>;
}
