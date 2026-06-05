import React, { useState } from 'react';
import { useStore } from '../store/useStore';

export default function PasswordGate() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const login = useStore(state => state.login);

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = login(password);
    if (success) {
      setError(false);
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg px-4 select-none">
      <div className="w-full max-w-sm p-8 bg-surface border border-border rounded-xl shadow-2xl flex flex-col items-center transition-all duration-300">
        <h2 className="text-xl font-bold text-text mb-2 tracking-wide font-sans">
          Workspace Gate
        </h2>
        <p className="text-xs text-text-muted text-center mb-8 font-sans">
          Enter authorization credentials to access notes and boards
        </p>

        <form onSubmit={handleSubmit} className="w-full">
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            className={`w-full px-4 py-3 bg-bg border ${
              error ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-accent'
            } rounded-lg text-text text-center text-sm outline-none transition-all duration-200 placeholder:text-text-muted font-mono`}
            autoFocus
          />
          {error && (
            <p className="text-xs text-red-500 text-center mt-2 font-sans">
              Invalid credentials. Try again.
            </p>
          )}
          <button
            type="submit"
            className="w-full mt-5 py-3 px-4 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-semibold tracking-wide transition-all duration-200 cursor-pointer font-sans"
          >
            Authenticate
          </button>
        </form>
      </div>
    </div>
  );
}
