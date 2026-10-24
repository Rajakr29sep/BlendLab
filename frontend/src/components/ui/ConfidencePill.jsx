import React from 'react';

export default function ConfidencePill({ level = 'low' }) {
  const normalized = String(level).toLowerCase();
  return <span className={`confidence-pill confidence-pill--${normalized}`}><i /> {normalized} confidence</span>;
}
