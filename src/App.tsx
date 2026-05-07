import { useState } from 'react';
import type { AppScreen, TimerPreset, ZoomConfig } from './types';
import { PasswordScreen } from './components/PasswordScreen';
import { SetupScreen } from './components/SetupScreen';
import { ControlScreen } from './components/ControlScreen';

function App() {
  const [screen, setScreen] = useState<AppScreen>('password');
  const [activePreset, setActivePreset] = useState<TimerPreset | null>(null);
  const [zoomConfig, setZoomConfig] = useState<ZoomConfig | null>(null);
  const [joinZoom, setJoinZoom] = useState(false);

  if (screen === 'password') {
    return <PasswordScreen onUnlock={() => setScreen('setup')} />;
  }

  if (screen === 'setup') {
    return (
      <SetupScreen
        onStart={(preset, config, shouldJoin) => {
          setActivePreset(preset);
          setZoomConfig(config);
          setJoinZoom(shouldJoin);
          setScreen('control');
        }}
      />
    );
  }

  if (screen === 'control' && activePreset && zoomConfig) {
    return (
      <ControlScreen
        initialPreset={activePreset}
        zoomConfig={zoomConfig}
        joinZoom={joinZoom}
        onExit={() => setScreen('setup')}
      />
    );
  }

  return null;
}

export default App;
