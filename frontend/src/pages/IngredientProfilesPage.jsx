import React from 'react';
import { useState } from 'react';
import { ArrowUpRight, BadgeCheck, CircleDollarSign, Database, Info, Leaf, Save, ShieldCheck } from 'lucide-react';
import { api } from '../services/api.js';
import Notice from '../components/ui/Notice.jsx';
import LoadingState from '../components/ui/LoadingState.jsx';

const PROTEINS = ['Chickpea', 'Faba', 'Lentil', 'Mungbean', 'Pea', 'Soy'];
const EMPTY_PROFILE = () => ({ pricePerKg: '', proteinPer100g: '', source: '' });

export default function IngredientProfilesPage({ profiles, setProfiles }) {
  const [validation, setValidation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const readyCount = PROTEINS.filter((name) => {
    const profile = profiles[name] || EMPTY_PROFILE();
    return Number(profile.pricePerKg) > 0 && profile.proteinPer100g !== '' && Number(profile.proteinPer100g) >= 0 && Number(profile.proteinPer100g) <= 100 && profile.source?.trim();
  }).length;

  function update(name, field, value) {
    setProfiles((current) => ({ ...current, [name]: { ...(current[name] || EMPTY_PROFILE()), [field]: value } }));
  }

  async function validate() {
    setLoading(true); setError('');
    try { setValidation(await api.validateProfiles(profiles)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  function clearProfiles() {
    const empty = Object.fromEntries(PROTEINS.map((name) => [name, EMPTY_PROFILE()]));
    setProfiles(empty); setValidation(null);
  }

  return <div className="page-stack">
    <div className="page-intro-row"><div><span className="section-kicker">SOURCE DATA / 04</span><h1>Ingredient profiles</h1><p>Bring cost and nutrition into the formulation engine using source-traceable ingredient-grade values.</p></div><div className="profiles-count-pill"><ShieldCheck size={15} /><strong>{readyCount}/6</strong><span>profiles ready</span></div></div>
    <Notice type="warning" title="Do not guess these values">Your two CSVs do not contain ingredient price or protein composition. Enter values from a supplier quotation/specification or an appropriate nutrition reference, and keep the source field filled. Protein isolate, concentrate, textured protein and whole pulse flour have different values.</Notice>
    <section className="panel ingredient-profile-panel">
      <div className="panel-title-row"><div><span className="section-kicker">INGREDIENT CATALOGUE</span><h2>Source-traceable values</h2></div><span className="profile-save-state"><Save size={13} /> Auto-saved in this browser</span></div>
      <div className="ingredient-table-wrap"><table className="data-table ingredient-table"><thead><tr><th>Ingredient</th><th><CircleDollarSign size={13} /> Price / kg (₹)</th><th>Protein g / 100 g</th><th>Data source / ingredient grade</th><th>Status</th></tr></thead><tbody>{PROTEINS.map((name) => { const p = profiles[name] || EMPTY_PROFILE(); const ready = Number(p.pricePerKg) > 0 && p.proteinPer100g !== '' && Number(p.proteinPer100g) >= 0 && Number(p.proteinPer100g) <= 100 && p.source?.trim(); return <tr key={name}><td><div className="ingredient-name"><span className="ingredient-avatar">{name.slice(0, 1)}</span><strong>{name}</strong></div></td><td><input className="table-input" type="number" min="0" placeholder="e.g. 250" value={p.pricePerKg} onChange={(e) => update(name, 'pricePerKg', e.target.value)} /></td><td><input className="table-input" type="number" min="0" max="100" placeholder="e.g. 65" value={p.proteinPer100g} onChange={(e) => update(name, 'proteinPer100g', e.target.value)} /></td><td><input className="table-input source-input" type="text" placeholder="Supplier quote / spec sheet URL or ref" value={p.source} onChange={(e) => update(name, 'source', e.target.value)} /></td><td><span className={`profile-status ${ready ? 'profile-status--ready' : ''}`}><i />{ready ? 'Ready' : 'Missing'}</span></td></tr>; })}</tbody></table></div>
      <div className="ingredient-profile-actions"><div className="profile-hint"><Info size={15} /> Use the same ingredient grade when comparing profiles; price should reflect the relevant purchase unit and date.</div><div className="profile-buttons"><button className="button-ghost" onClick={clearProfiles}>Clear values</button><button className="button-primary" onClick={validate} disabled={loading}>{loading ? 'Validating…' : <>Validate profiles <ArrowUpRight size={15} /></>}</button></div></div>
    </section>
    {loading && <LoadingState label="Validating ingredient profiles…" />}
    {error && <Notice type="warning" title="Could not validate profiles">{error}</Notice>}
    {validation && <section className="panel profile-validation-panel"><div className="panel-title-row"><div><span className="section-kicker">VALIDATION RESULT</span><h2>{validation.readyCount} of {validation.total} profiles ready</h2></div><BadgeCheck size={18} /></div><div className="profile-validation-grid">{validation.profiles.map((profile) => <div key={profile.ingredient} className={`profile-validation-row ${profile.ready ? 'is-ready' : ''}`}><span>{profile.ready ? <BadgeCheck size={15} /> : <Info size={15} />}</span><div><strong>{profile.ingredient}</strong><small>{profile.ready ? `${profile.pricePerKg} ₹/kg · ${profile.proteinPer100g} g protein/100 g` : 'Missing numeric value or source attribution'}</small></div></div>)}</div><p className="muted-copy">Validation checks format and source presence; it does not independently verify that a supplier value is accurate. The ranking request uses these profiles in the browser session and backend request body.</p></section>}
  </div>;
}
