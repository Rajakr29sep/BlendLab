import React from 'react';
import { Activity, Beaker, Database, FlaskConical, Leaf, PanelsTopLeft } from 'lucide-react';

const navItems = [
  { id: 'overview', label: 'Overview', icon: PanelsTopLeft },
  { id: 'virtual-lab', label: 'Virtual Lab', icon: FlaskConical },
  { id: 'recommendations', label: 'Blend Rankings', icon: Activity },
  { id: 'dataset', label: 'Dataset Explorer', icon: Database },
  { id: 'ingredients', label: 'Ingredient Data', icon: Leaf },
];

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sidebar">
      <a className="sidebar-brand" href="#overview" onClick={(event) => { event.preventDefault(); onNavigate('overview'); }}>
        <span className="brand-mark"><FlaskConical size={18} /></span>
        <span>FORMU<span className="brand-accent">LAB</span><small>VIRTUAL PROTEIN LAB</small></span>
      </a>
      <div className="sidebar-section-label">WORKSPACE</div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          return <button key={item.id} className={`nav-item ${activePage === item.id ? 'is-active' : ''}`} onClick={() => onNavigate(item.id)}><Icon size={17} /><span>{item.label}</span>{activePage === item.id && <i />}</button>;
        })}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-data-status"><span className="status-dot" /><div><strong>Dataset connected</strong><small>2 experimental CSVs</small></div></div>
        <div className="sidebar-version">HACKATHON BUILD <span>v0.1.0</span></div>
      </div>
    </aside>
  );
}
