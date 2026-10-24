import React from 'react';

import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export default function Notice({ type = 'info', title, children }) {
  const Icon =
    type === 'warning'
      ? AlertTriangle
      : type === 'success'
        ? CheckCircle2
        : Info;

  return (
    <div className={`notice notice--${type}`}>
      <Icon size={17} />
      <div>
        {title && <strong>{title}</strong>}
        <div>{children}</div>
      </div>
    </div>
  );
}
