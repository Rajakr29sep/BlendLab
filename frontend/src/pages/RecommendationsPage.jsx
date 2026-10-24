import React from 'react';
import { useState } from 'react';
import { ArrowRight, Award, Beaker, CircleDollarSign, Dna, Filter, Gauge, Sparkles } from 'lucide-react';
import { api } from '../services/api.js';
import ConfidencePill from '../components/ui/ConfidencePill.jsx';
import Notice from '../components/ui/Notice.jsx';
import LoadingState from '../components/ui/LoadingState.jsx';

const PREFS = [
  { key: 'hardness', label: 'Firmness', hint: 'Bite resistance' },
  { key: 'chewiness', label: 'Chewiness', hint: 'Chewing effort' },
  { key: 'springiness', label: 'Springiness', hint: 'Elastic recovery' },
  { key: 'cohesion', label: 'Cohesion', hint: 'Structure holds together' },
];

export default function RecommendationsPage({ config, setConfig, profiles, onGoToIngredients }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [maxCost, setMaxCost] = useState(config.maxCostPerKg || '');
  const [minProtein, setMinProtein] = useState(config.minProteinPer100g || '');
  const updatePref = (key, value) => setConfig((current) => ({ ...current, texturePreferences: { ...current.texturePreferences, [key]: value } }));

  async function runRanking() {
    setLoading(true); setError(''); setResult(null);
    try {
      const data = await api.rankRecommendations({
        feed: config.feed, ss: config.ss, mc: config.mc,
        texturePreferences: config.texturePreferences,
        maxCostPerKg: maxCost, minProteinPer100g: minProtein,
        ingredientProfiles: profiles,
      });
      setResult(data);
      setConfig((current) => ({ ...current, maxCostPerKg: maxCost, minProteinPer100g: minProtein }));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return <div className="page-stack">
    <div className="page-intro-row"><div><span className="section-kicker">FORMULATION ENGINE / 02</span><h1>Blend rankings</h1><p>Rank supported 50:50 blends by how closely they match your target texture profile.</p></div><div className="model-label"><Sparkles size={15} /> RANDOM FOREST BASELINE</div></div>
    <div className="ranking-layout">
      <section className="panel ranking-controls">
        <div className="panel-title-row"><div><span className="section-kicker">OPTIMIZATION TARGET</span><h2>Define your ideal texture</h2></div><Filter size={17} /></div>
        <p className="muted-copy">Sliders represent desired percentiles within this dataset, not universal sensory values for real meat.</p>
        <div className="preference-list">{PREFS.map((pref) => <label className="pref-control" key={pref.key}><span><strong>{pref.label}</strong><small>{pref.hint}</small></span><div className="pref-slider-wrap"><input type="range" min="0" max="100" step="5" value={config.texturePreferences[pref.key]} onChange={(e) => updatePref(pref.key, Number(e.target.value))} /><strong>{config.texturePreferences[pref.key]}<small>%</small></strong></div></label>)}</div>
        <div className="form-section-label">OPTIONAL CONSTRAINTS <span>Requires ingredient profiles</span></div>
        <label className="control-field"><span>Max protein-ingredient cost <small>(₹ per kg blend)</small></span><div className="input-with-prefix"><span>₹</span><input type="number" min="0" placeholder="Not applied yet" value={maxCost} onChange={(e) => setMaxCost(e.target.value)} /></div></label>
        <label className="control-field"><span>Minimum estimated protein <small>(g per 100 g blend)</small></span><div className="input-with-suffix"><input type="number" min="0" max="100" placeholder="Not applied yet" value={minProtein} onChange={(e) => setMinProtein(e.target.value)} /><span>g</span></div></label>
        <div className="profiles-readiness"><div><Dna size={16} /><span><strong>Ingredient profiles</strong><small>Costs and nutrition need verified source values</small></span></div><button className="text-button" onClick={onGoToIngredients}>Review data <ArrowRight size={13} /></button></div>
        <button className="button-primary button-full" onClick={runRanking} disabled={loading}>{loading ? 'Ranking candidates…' : <><Sparkles size={16} /> Rank available blends</>}</button>
      </section>
      <section className="panel ranking-results">
        <div className="panel-title-row"><div><span className="section-kicker">CANDIDATE BLENDS</span><h2>Recommended shortlist</h2></div><span className="results-count">{result?.recommendations?.length ?? '—'} candidates</span></div>
        {error && <Notice type="warning" title="Could not rank blends">{error}</Notice>}
        {!result && !loading && <div className="results-empty"><div className="empty-icon"><Award size={25} /></div><h3>Find your best-fit blends</h3><p>Set texture preferences and run ranking. The engine will compare candidates supported by recorded measurements.</p></div>}
        {loading && <LoadingState label="Predicting texture signals for supported blend pairs…" />}
        {result && <>
          {!result.available && <Notice type="warning" title="Ranking service unavailable">{result.message}</Notice>}
          {result.recommendations?.map((item, index) => <article className={`recommendation-card ${index === 0 ? 'recommendation-card--top' : ''}`} key={`${item.recipe.proteinA}-${item.recipe.proteinB}`}>
            <div className="recommendation-rank">{String(index + 1).padStart(2, '0')}</div>
            <div className="recommendation-main"><div className="recommendation-title-row"><div><h3>{item.recipe.proteinA} <span>+</span> {item.recipe.proteinB}</h3><p>50:50 plant-protein blend</p></div>{index === 0 && <span className="best-fit-badge"><Award size={12} /> TOP MATCH</span>}</div>
              <div className="recommendation-signals"><span><Gauge size={13} /> Texture similarity <strong>{item.score}/100</strong></span><span><Beaker size={13} /> {item.supportExperiments} conditions</span><ConfidencePill level={item.confidence?.level || 'low'} /></div>
              <div className="recommendation-metrics">{['Hardness', 'Chewiness', 'Springiness', 'Cohesion'].map((key) => <span key={key}>{key}<strong>{item.predictedMetrics?.[key] != null ? Number(item.predictedMetrics[key]).toLocaleString(undefined, { maximumFractionDigits: 1 }) : '—'}</strong></span>)}</div>
              <div className="recommendation-cost-row"><span><CircleDollarSign size={13} /> Protein blend cost <strong>{item.estimatedProteinIngredientCost_per_kg == null ? 'Add source data' : `₹${item.estimatedProteinIngredientCost_per_kg}/kg`}</strong></span><span><Dna size={13} /> Protein estimate <strong>{item.estimatedProteinBlend_g_per_100g == null ? 'Add source data' : `${item.estimatedProteinBlend_g_per_100g} g/100 g`}</strong></span></div>
            </div>
          </article>)}
          {result.recommendations?.length === 0 && <Notice type="warning" title="No blend met the current filters">Relax the constraints or add source-traceable ingredient price and nutrition profiles.</Notice>}
          {result.warnings?.length > 0 && <div className="ranking-warnings"><span className="section-kicker">BOUNDARIES TO KEEP IN MIND</span>{result.warnings.map((warning) => <p key={warning}>• {warning}</p>)}</div>}
          {result.nextExperiments?.length > 0 && <div className="next-experiments"><div className="panel-title-row"><div><span className="section-kicker">NEXT PHYSICAL TESTS</span><h3>What to validate first</h3></div><Beaker size={17} /></div>{result.nextExperiments.map((test) => <div className="next-test" key={test.priority}><span>{String(test.priority).padStart(2, '0')}</span><div><strong>{test.test}</strong><p>{test.why}</p></div></div>)}</div>}
        </>}
      </section>
    </div>
  </div>;
}
