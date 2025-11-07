import React from 'react';

const buttons = [
  { id: 'replay', label: '리플레이', disabled: false },
  { id: 'single', label: '1인 플레이', disabled: false },
  // PvP는 현재 디버깅 중이라 일단 비활성화합니다. 향후 재개시 todo.md 참고
  { id: 'pvp', label: 'PVP 대전', disabled: true },
];

function ModeSelector({ selectedMode, onChange, theme, setTheme }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
      <div className="controls-row">
        {buttons.map((button) => (
          <button
            key={button.id}
            type="button"
            onClick={() => !button.disabled && onChange(button.id)}
            disabled={button.disabled}
            style={{
              background:
                selectedMode === button.id && !button.disabled
                  ? '#2ecc71'
                  : undefined,
            }}
          >
            {button.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: '0.5rem' }}>
        <button
          type="button"
          onClick={() => setTheme && setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? '🌙 다크 모드' : '🌤️ 라이트 모드'}
        </button>
      </div>
    </div>
  );
}

export default ModeSelector;
