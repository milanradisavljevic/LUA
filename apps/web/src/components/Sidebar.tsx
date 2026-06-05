import { useState } from 'react';

interface Props {
  currentView: string;
  onSettingsOpen?: () => void;
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
  { id: 'settings', label: 'Einstellungen', icon: '⚙', active: false },
  { id: 'api', label: 'API-Schlüssel', icon: '🔑', active: true },
  { id: 'providers', label: 'LLM-Anbieter', icon: '🤖', active: false },
  { id: 'help', label: 'Hilfe', icon: '?', active: false },
  { id: 'feedback', label: 'Feedback', icon: '💬', active: false },
];

export function Sidebar({ currentView, onSettingsOpen }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const handleItemClick = (item: { id: string; label: string; icon: string; active: boolean }) => {
    if (!item.active) return;
    if (item.id === 'api' && onSettingsOpen) {
      onSettingsOpen();
    }
  };

  const renderNavItem = (item: { id: string; label: string; icon: string; active: boolean }) => {
    const isCurrent = item.id === currentView;
    const isDisabled = !item.active;

    return (
      <button
        key={item.id}
        disabled={isDisabled}
        onClick={() => handleItemClick(item)}
        aria-current={isCurrent ? 'page' : undefined}
        aria-label={isDisabled ? `${item.label} (bald verfügbar)` : item.label}
        title={collapsed ? item.label : (isDisabled ? `${item.label} (bald verfügbar)` : item.label)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          width: '100%',
          padding: collapsed ? '0.625rem 0' : '0.625rem 1rem',
          background: isCurrent ? 'rgba(91,91,214,0.15)' : 'none',
          border: 'none',
          borderLeft: isCurrent ? '3px solid #7c7ce0' : '3px solid transparent',
          color: isCurrent ? 'white' : isDisabled ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.75)',
          fontSize: '0.875rem',
          fontWeight: isCurrent ? 700 : 400,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          justifyContent: collapsed ? 'center' : 'flex-start',
          transition: 'background 0.15s, color 0.15s',
          position: 'relative',
        }}
      >
        <span aria-hidden="true" style={{ fontSize: '1rem', minWidth: 20, textAlign: 'center' }}>{item.icon}</span>
        {!collapsed && (
          <>
            <span>{item.label}</span>
            {isDisabled && !collapsed && (
              <span style={{
                fontSize: '0.5625rem',
                background: 'rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.5)',
                padding: '0.125rem 0.375rem',
                borderRadius: '3px',
                marginLeft: 'auto',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                whiteSpace: 'nowrap',
              }}>
                bald
              </span>
            )}
          </>
        )}
      </button>
    );
  };

  return (
    <aside
      aria-label="Hauptnavigation"
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
        {NAV_ITEMS.map(renderNavItem)}

        {/* Trennlinie */}
        <div style={{ margin: '0.75rem 1rem', height: 1, background: 'rgba(255,255,255,0.08)' }} />

        {SETTINGS_ITEMS.map(renderNavItem)}
      </nav>

      {/* Collapse-Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Seitenleiste ausklappen' : 'Seitenleiste einklappen'}
        aria-expanded={!collapsed}
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