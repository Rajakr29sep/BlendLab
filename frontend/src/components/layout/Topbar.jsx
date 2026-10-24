import React from'react';
import { Bell, Command, ExternalLink, Search } from 'lucide-react';

export default function Topbar({ pageTitle, onGoToLab }) {
  return <header className="topbar">
    <div className="breadcrumb"><span>WORKSPACE</span><b>/</b><strong>{pageTitle}</strong></div>
    <div className="topbar-actions">
      <div className="topbar-search"><Search size={15} /><span>Search experiments</span><kbd><Command size={10} /> K</kbd></div>
      <button className="icon-button" aria-label="Notifications"><Bell size={17} /><i /></button>
      <button className="topbar-cta" onClick={onGoToLab}>Open lab <ExternalLink size={14} /></button>
    </div>
  </header>;
}
