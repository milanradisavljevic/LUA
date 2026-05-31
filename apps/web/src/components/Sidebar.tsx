import { useState } from 'react';

interface Props {
  currentView: string;
}

const NAV_ITEMS = [
  { id: 'new', label: 'Neue erstellen', icon: '✚', active: true },
  { id: 'materials', label: 'Meine Unterlagen', icon: '📁', active: false },
  { id: 'templates', label: 'Vorlagen', icon: '📋', active: false },
  { id: 'history', label: 'Verlauf', icon: '🕐', active: false },
  { id: 'favorites', label: 'Favoriten', icon: '★', active: false },
  { id: 'trash', label: 'Papierkorb', icon: '🗑', active: false },
];

const SETTINGS_ITEMS = [
  { id: 'settings', label: 'Einstellungen', icon: '⚙' },
  { id: 'api', label: 'API-Schlüssel', icon: '🔑' },
  { id: 'providers', label: 'LLM-Anbieter', icon: '🤖' },
  { id: 'help', label: 'Hilfe', icon: '?' },
  { id: 'feedback', label: 'Feedback', icon: '💬' },
];

export function Sidebar({ currentView }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      style={{
        width: collapsed ? 60 : 240,
        minWidth: collapsed ? 60 : 240,
        background: '#1a1a2e',
        color: '#e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s',
        height: '100vh',
        position: 'sticky',
        top: 0,
      }}
    >
      {/* Marke */}
      <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontWeight: 700, fontSize: collapsed ? '0.875rem' : '1rem', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden' }}>
          {collapsed ? 'N' : 'Natascha'}
        </div>
        {!collapsed && (
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
            Lehrunterlagen-Generator
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '0.75rem 0', overflowY: 'auto' }}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            disabled={!item.active}
            title={item.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              width: '100%',
              padding: collapsed ? '0.625rem 0' : '0.625rem 1rem',
              background: 'none',
              border: 'none',
              color: item.active ? 'white' : 'rgba(255,255,255,0.35)',
              fontSize: '0.875rem',
              cursor: item.active ? 'pointer' : 'not-allowed',
              opacity: item.active ? 1 : 0.5,
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
          >
            <span style={{ fontSize: '1rem', minWidth: 20, textAlign: 'center' }}>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}

        {/* Trennlinie */}
        <div style={{ margin: '0.75rem 1rem', height: 1, background: 'rgba(255,255,255,0.08)' }} />

        {SETTINGS_ITEMS.map((item) => (
          <button
            key={item.id}
            disabled
            title={item.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              width: '100%',
              padding: collapsed ? '0.625rem 0' : '0.625rem 1rem',
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.35)',
              fontSize: '0.875rem',
              cursor: 'not-allowed',
              opacity: 0.5,
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
          >
            <span style={{ fontSize: '1rem', minWidth: 20, textAlign: 'center' }}>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Collapse-Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.5)',
          padding: '0.75rem',
          cursor: 'pointer',
          fontSize: '0.75rem',
          textAlign: 'center',
        }}
      >
        {collapsed ? '→' : '← einklappen'}
      </button>

      {/* Version */}
      <div style={{ padding: '0.5rem 1rem', fontSize: '0.6875rem', color: 'rgba(255,255,255,0.3)', textAlign: collapsed ? 'center' : 'left' }}>
        {collapsed ? 'v1' : 'v1.0.0-beta'}
      </div>
    </aside>
  );
}
