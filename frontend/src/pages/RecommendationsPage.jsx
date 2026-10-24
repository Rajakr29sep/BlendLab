import React, { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Beaker,
  CircleDollarSign,
  Database,
  Dna,
  Filter,
  FlaskConical,
  Gauge,
  Info,
  LoaderCircle,
  Sparkles,
} from "lucide-react";
import PageHeader from "../components/layout/PageHeader.jsx";
import Notice from "../components/ui/Notice.jsx";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const INITIAL_TARGETS = {
  hardness: 2500,
  chewiness: 1100,
  springiness: 70,
  cohesion: 0.55,
};

const metricLabels = [
  ["Hardness", "Hardness"],
  ["Chewiness", "Chewiness"],
  ["Springiness", "Springiness"],
  ["Cohesion", "Cohesion"],
];

function formatMetric(value) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "—";
  }
  return Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
}

function readableIngredient(value = "") {
  return String(value).replaceAll("_", " ");
}

export default function RecommendationsPage({
  config,
  setConfig,
  profiles,
  onGoToIngredients,
  onGoToLab,
}) {
  const [maxCost, setMaxCost] = useState(config.maxCostPerKg ?? "");
  const [minProtein, setMinProtein] = useState(config.targetProtein ?? "");
  const [targets, setTargets] = useState({
    ...INITIAL_TARGETS,
    ...(config.textureTargets || {}),
  });
  const [recommendations, setRecommendations] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [modelLimitations, setModelLimitations] = useState(null);
  const [rankingBasis, setRankingBasis] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasRequested, setHasRequested] = useState(false);

  const updateTarget = (key, value) => {
    setTargets((current) => ({
      ...current,
      [key]: value === "" ? "" : Number(value),
    }));
  };

  const run = async () => {
    setLoading(true);
    setError("");
    setHasRequested(true);
    setRecommendations([]);
    setWarnings([]);
    setModelLimitations(null);

    const excludedIngredients =
      config.ingredientPreference === "Reduce soy" ||
      config.ingredientPreference === "Soy-free candidates only"
        ? ["Soy"]
        : [];

    const payload = {
      productName: config.productName || "Plant-based Chicken Keema",
      material: "Plant_Poultry_Matrix",
      textureTargets: Object.fromEntries(
        Object.entries(targets).filter(
          ([, value]) => value !== "" && value !== null && Number.isFinite(Number(value))
        )
      ),
      preferredIngredients: [],
      excludedIngredients,
      topK: 3,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/recommendations/rank`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const detail =
          typeof data.error === "string"
            ? data.error
            : typeof data.message === "string"
              ? data.message
              : data.detail
                ? JSON.stringify(data.detail)
                : `Request failed with status ${response.status}`;
        throw new Error(detail);
      }

      setRecommendations(data.recommendations || []);
      setWarnings(data.warnings || []);
      setModelLimitations(data.modelLimitations || null);
      setRankingBasis(data.rankingBasis || "");
      setConfig((current) => ({
        ...current,
        maxCostPerKg: maxCost,
        targetProtein: minProtein,
        textureTargets: payload.textureTargets,
      }));
    } catch (err) {
      setError(
        err.message ||
          "Could not connect to FormuLab backend. Check that Node.js and Python services are running."
      );
    } finally {
      setLoading(false);
    }
  };

  const useInLab = (item) => {
    setConfig((current) => ({
      ...current,
      selectedBlend: item.candidateId,
      selectedCandidate: item,
    }));
    onGoToLab?.();
  };

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="RECOMMENDATIONS / 03"
        title="A shortlist, not a shot in the dark."
        description="Explore candidate blends against your product target. Predictions are exploratory until validated with physical experiments."
        action={
          <span className="pill pill--demo">
            <span /> {recommendations.length ? "ML MODEL RESULTS" : "ML CONNECTED"}
          </span>
        }
      />

      <div className="recommendation-layout">
        <section className="panel recommendation-controls">
          <div className="panel-heading-inline">
            <div>
              <span className="eyebrow">OPTIMIZATION TARGET</span>
              <h2>Define your ideal product</h2>
            </div>
            <Filter size={18} />
          </div>

          <div className="target-summary">
            <div className="target-icon">
              <FlaskConical size={20} />
            </div>
            <div>
              <strong>{config.productName || "Plant-based Chicken Keema"}</strong>
              <small>{config.category || "Plant-based formulation"}</small>
            </div>
            <button className="mini-edit" onClick={onGoToLab} type="button">
              Edit
            </button>
          </div>

          <label className="field-label">Desired texture</label>
          <div className="texture-chip-grid">
            {[
              "Fibrous & juicy",
              "Firm bite",
              "Tender & cohesive",
              "Springy & elastic",
            ].map((x) => (
              <button
                key={x}
                type="button"
                className={`texture-chip ${config.texture === x ? "selected" : ""}`}
                onClick={() => setConfig((c) => ({ ...c, texture: x }))}
              >
                {x}
              </button>
            ))}
          </div>

          <div className="form-section-label">
            MODEL TARGETS <span>Example values — adjust as needed</span>
          </div>
          <p className="field-help">
            The values below are test targets for ranking, not established chicken-keema standards.
          </p>

          <div className="target-number-grid">
            <label className="field-block">
              <span className="field-label">Hardness</span>
              <input
                type="number"
                value={targets.hardness}
                onChange={(e) => updateTarget("hardness", e.target.value)}
              />
            </label>
            <label className="field-block">
              <span className="field-label">Chewiness</span>
              <input
                type="number"
                value={targets.chewiness}
                onChange={(e) => updateTarget("chewiness", e.target.value)}
              />
            </label>
            <label className="field-block">
              <span className="field-label">Springiness</span>
              <input
                type="number"
                value={targets.springiness}
                onChange={(e) => updateTarget("springiness", e.target.value)}
              />
            </label>
            <label className="field-block">
              <span className="field-label">Cohesion</span>
              <input
                type="number"
                step="0.01"
                value={targets.cohesion}
                onChange={(e) => updateTarget("cohesion", e.target.value)}
              />
            </label>
          </div>

          <div className="form-section-label">
            PRODUCT CONSTRAINTS <span>Not used by current ML model</span>
          </div>
          <label className="field-block">
            <span className="field-label">
              Maximum ingredient cost <small>(₹/kg blend)</small>
            </span>
            <div className="input-with-prefix">
              <span>₹</span>
              <input
                type="number"
                min="0"
                value={maxCost}
                onChange={(e) => setMaxCost(e.target.value)}
              />
            </div>
          </label>

          <label className="field-block">
            <span className="field-label">
              Minimum protein target <small>(g per 100 g)</small>
            </span>
            <div className="input-with-suffix">
              <input
                type="number"
                min="0"
                max="100"
                value={minProtein}
                onChange={(e) => setMinProtein(e.target.value)}
              />
              <span>g</span>
            </div>
          </label>

          <div className="preference-note">
            <Dna size={17} />
            <div>
              <strong>Ingredient strategy</strong>
              <small>{config.ingredientPreference || "No preference selected"}</small>
            </div>
            <button className="mini-edit" onClick={onGoToLab} type="button">
              Change
            </button>
          </div>

          <div className="profile-link">
            <Database size={16} />
            <span>
              <strong>Ingredient profiles</strong>
              <small>Costs/nutrition are currently unverified.</small>
            </span>
            <button className="text-link" onClick={onGoToIngredients} type="button">
              Review <ArrowRight size={13} />
            </button>
          </div>

          <button
            className="button-primary button-full"
            onClick={run}
            type="button"
            disabled={loading}
          >
            {loading ? (
              <>
                <LoaderCircle className="spin" size={16} /> Generating recommendations…
              </>
            ) : (
              <>
                <Sparkles size={16} /> Generate ML recommendations
              </>
            )}
          </button>

          {error && (
            <div className="inline-feedback error-feedback" role="alert">
              <AlertTriangle size={15} />
              <span>{error}</span>
            </div>
          )}
        </section>

        <section className="recommendation-results">
          <div className="results-heading">
            <div>
              <span className="eyebrow">CANDIDATE BLENDS</span>
              <h2>
                {recommendations.length ? "Ranked candidates" : "Your shortlist"}{" "}
                <span className="count-pill">{recommendations.length}</span>
              </h2>
            </div>
            <span className="sort-label">
              <Gauge size={13} /> {rankingBasis ? "Target-based ranking" : "Awaiting model run"}
            </span>
          </div>

          {warnings.length > 0 && (
            <Notice type="warning" title="Exploratory predictions — not validated recipes">
              <ul className="warning-list">
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </Notice>
          )}

          {modelLimitations && (
            <p className="inline-feedback">
              <Info size={14} />
              Model confidence: {modelLimitations.confidence || "not assessed"}. Cost and nutrition
              are not modeled.
            </p>
          )}

          {loading && (
            <div className="panel loading-panel" role="status">
              <LoaderCircle className="spin" size={22} />
              <span>Running candidate predictions through the ML service…</span>
            </div>
          )}

          {!loading && !recommendations.length && !error && (
            <div className="panel empty-results">
              <Beaker size={28} />
              <h3>Ready to evaluate candidate blends</h3>
              <p>
                Set your target metrics and click <strong>Generate ML recommendations</strong>.
                Results will be fetched from your trained Python models through the Node.js API.
              </p>
            </div>
          )}

          {!loading &&
            recommendations.map((item, index) => {
              const ingredientA = item.ingredients?.[0] || {};
              const ingredientB = item.ingredients?.[1] || {};
              const ratioA = Number(ingredientA.ratioPercent ?? 50);
              const ratioB = Number(ingredientB.ratioPercent ?? 50);
              const predictions = item.predictions || {};

              return (
                <article
                  className={`blend-card ${index === 0 ? "blend-card--featured" : ""}`}
                  key={item.candidateId}
                >
                  <div className="blend-card-top">
                    <div className="blend-rank">
                      {String(item.rank ?? index + 1).padStart(2, "0")}
                    </div>
                    <div className="blend-heading">
                      <span className="blend-overline">
                        {index === 0 ? "TOP RANKED CANDIDATE" : "ML CANDIDATE"}
                      </span>
                      <h3>
                        {readableIngredient(ingredientA.name)} +{" "}
                        {readableIngredient(ingredientB.name)}
                      </h3>
                      <p>
                        {ratioA}:{ratioB} blend · {item.candidateId}
                      </p>
                    </div>
                    {index === 0 && (
                      <span className="top-match">
                        <Award size={13} /> TOP RANK
                      </span>
                    )}
                  </div>

                  <div className="blend-visual">
                    <div className="ratio-bar">
                      <span style={{ width: `${ratioA}%` }} />
                      <span style={{ width: `${ratioB}%` }} />
                    </div>
                    <div className="ratio-labels">
                      <span>
                        <i className="ratio-dot ratio-dot--a" />
                        {readableIngredient(ingredientA.name)} <b>{ratioA}%</b>
                      </span>
                      <span>
                        <i className="ratio-dot ratio-dot--b" />
                        {readableIngredient(ingredientB.name)} <b>{ratioB}%</b>
                      </span>
                    </div>
                  </div>

                  <div className="blend-meta">
                    <span>
                      <Gauge size={14} /> Ranking score <b>{formatMetric(item.score)}/100</b>
                    </span>
                    <span>
                      <Beaker size={14} /> Feed {formatMetric(item.processConditions?.feed)}
                    </span>
                    <span>
                      Screw speed <b>{formatMetric(item.processConditions?.screwSpeed)}</b>
                    </span>
                    <span>
                      Moisture <b>{formatMetric(item.processConditions?.moistureContent)}%</b>
                    </span>
                  </div>

                  <div className="blend-metrics">
                    {metricLabels.map(([key, label]) => (
                      <div key={key}>
                        <small>{label}</small>
                        <strong>{formatMetric(predictions[key])}</strong>
                        <em>Model prediction</em>
                      </div>
                    ))}
                  </div>

                  <p className="blend-why">
                    <Info size={15} />
                    Ranked using the requested texture targets. This is an exploratory prediction,
                    not a validated sensory or product-quality result.
                  </p>

                  <div className="blend-footer">
                    <span>
                      <CircleDollarSign size={14} /> <b>Cost:</b> not verified
                    </span>
                    <span>
                      <Dna size={14} /> <b>Protein:</b> not verified
                    </span>
                    <button className="text-link" onClick={() => useInLab(item)} type="button">
                      Use in lab <ArrowRight size={13} />
                    </button>
                  </div>
                </article>
              );
            })}

          {hasRequested && !loading && !error && recommendations.length === 0 && (
            <Notice type="warning" title="No candidates returned">
              Try different target values or review the backend logs.
            </Notice>
          )}

          {recommendations.length > 0 && (
            <div className="next-experiment-panel">
              <div className="next-experiment-icon">
                <Beaker size={20} />
              </div>
              <div>
                <span className="eyebrow">NEXT PHYSICAL TESTS</span>
                <h3>Validate before making product claims</h3>
                <p>
                  Treat these as candidate experiments. Record actual texture measurements after
                  lab trials and compare them with the predictions before claiming a formulation
                  performs like chicken keema.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
