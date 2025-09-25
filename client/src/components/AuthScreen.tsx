import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';

type AuthMode = 'login' | 'register';

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('login');

  const switchToRegister = () => setMode('register');
  const switchToLogin = () => setMode('login');

  return (
    <>
      {mode === 'login' ? (
        <Login onSwitchToRegister={switchToRegister} />
      ) : (
        <Register onSwitchToLogin={switchToLogin} />
      )}
    </>
  );
}