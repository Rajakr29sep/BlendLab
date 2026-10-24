
import React from 'react';
import { LoaderCircle } from 'lucide-react';

export default function LoadingState({
  label = 'Loading experimental data…'
}) {
  return (
    <div className="loading-state">
      <LoaderCircle className="spin" size={18} />
      {label}
    </div>
  );
}
