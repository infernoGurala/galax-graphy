import React from 'react';
import { useStore } from '../store/useStore';
import Breadcrumb from './Breadcrumb';

export default function TopBar() {
  const isAuthenticated = useStore(state => state.isAuthenticated);

  if (!isAuthenticated) return null;

  return (
    <header className="w-full bg-bg/60 backdrop-blur-md border-b border-white/5 h-14 px-5 select-none flex items-center justify-start font-sans relative z-40 flex-shrink-0">
      <Breadcrumb />
    </header>
  );
}
