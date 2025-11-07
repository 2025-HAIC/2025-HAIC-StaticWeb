import React from 'react';

const buttons = [
  { id: 'replay', label: '리플레이', disabled: false },
  { id: 'single', label: '1인 플레이', disabled: false },
  { id: 'pvp', label: 'PVP 대전', disabled: true },
];

function ModeSelector({ selectedMode, onChange }) {
  return (
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
  );
}

export default ModeSelector;
