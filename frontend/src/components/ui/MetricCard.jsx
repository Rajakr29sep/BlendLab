import React from 'react';

export default function MetricCard({ label, value, detail, icon: Icon, tone = 'mint' }) {
  return <article className={`metric-card metric-card--${tone}`}>
    <div className="metric-card-head"><span>{label}</span>{Icon && <span className="metric-icon"><Icon size={17} /></span>}</div>
    <div className="metric-value">{value}</div>
    <div className="metric-detail">{detail}</div>
  </article>;
}
