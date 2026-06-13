import React from 'react';
import { useStore } from '../store/useStore';
import Breadcrumb from './Breadcrumb';

export default function TopBar() {
  const isAuthenticated = useStore(state => state.isAuthenticated);

  const currentScreen = useStore(state => state.currentScreen);

  if (!isAuthenticated) return null;

  return (
    <header className="w-full bg-bg/60 backdrop-blur-md border-b border-white/5 h-14 px-5 select-none flex items-center justify-between font-sans relative z-40 flex-shrink-0 gap-4">
      <div className="flex-1 min-w-0 max-w-[40%]">
        <Breadcrumb />
      </div>
      
      {currentScreen === 'note' && (
        <div className="flex-shrink-0 flex items-center">
          <div id="quill-toolbar">
            <span className="ql-formats">
              <select className="ql-header">
                <option selected></option> {/* Normal */}
                <option value="1"></option>
                <option value="2"></option>
                <option value="3"></option>
              </select>
            </span>
            
            <span className="ql-formats">
              <select className="ql-font">
                <option selected></option> {/* Sailec Light (Default) */}
                <option value="georgia"></option> {/* Georgia */}
                <option value="sofia"></option> {/* Sofia Pro */}
                <option value="slabo"></option> {/* Slabo 13px */}
                <option value="roboto-slab"></option> {/* Roboto Slab */}
                <option value="inconsolata"></option> {/* Inconsolata */}
                <option value="ubuntu-mono"></option> {/* Ubuntu Mono */}
              </select>
            </span>

            <span className="ql-formats">
              <button className="ql-bold"></button>
              <button className="ql-italic"></button>
              <button className="ql-underline"></button>
            </span>

            <span className="ql-formats">
              <button className="ql-list" value="ordered"></button>
              <button className="ql-list" value="bullet"></button>
            </span>

            <span className="ql-formats">
              <select className="ql-align">
                <option selected></option> {/* Left Align */}
                <option value="center"></option>
                <option value="right"></option>
                <option value="justify"></option>
              </select>
            </span>

            <span className="ql-formats">
              <button className="ql-link"></button>
              <button className="ql-image"></button>
              <button className="ql-video"></button>
            </span>

            <span className="ql-formats">
              <button className="ql-formula"></button>
              <button className="ql-code-block"></button>
              <button className="ql-clean" title="Clear formatting"></button>
            </span>
          </div>
        </div>
      )}
    </header>
  );
}
