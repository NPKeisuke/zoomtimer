import { useState } from 'react';
import type { AppScreen, TimerPreset } from './types';
import { PasswordScreen } from './components/PasswordScreen';
import { SetupScreen } from './components/SetupScreen';
import { ControlScreen } from './components/ControlScreen';

function App() {
  const [screen, setScreen] = useState<AppScreen>('password');
  const [activePreset, setActivePreset] = useState<TimerPreset | null>(null);

  if (screen === 'password') {
    return <PasswordScreen onUnlock={() => setScreen('setup')} />;
  }

  if (screen === 'setup') {
    return (
      <SetupScreen
        onStart={(preset) => {
          setActivePreset(preset);
          setScreen('control');
        }}
      />
    );
  }

  if (screen === 'control' && activePreset) {
    return (
      <ControlScreen
        initialPreset={activePreset}
        onExit={() => setScreen('setup')}
      />
    );
  }

  return null;
}

export default App;
