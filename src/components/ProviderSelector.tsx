import React from 'react';
import { CloudProvider } from '../types';
import { Cloud, Check } from 'lucide-react';

interface ProviderSelectorProps {
  selectedProvider: CloudProvider;
  onChangeProvider: (provider: CloudProvider) => void;
}

export default function ProviderSelector({ selectedProvider, onChangeProvider }: ProviderSelectorProps) {
  const providers = [
    {
      id: 'aws' as CloudProvider,
      name: 'Amazon Web Services',
      short: 'AWS',
      accentColor: 'border-amber-500/80 hover:border-amber-500',
      activeBg: 'bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-sm',
      inactiveBg: 'bg-[#0D0F14] border-white/5 text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/10',
      logoChar: 'A',
      logoBg: 'bg-amber-500'
    },
    {
      id: 'gcp' as CloudProvider,
      name: 'Google Cloud Platform',
      short: 'GCP',
      accentColor: 'border-blue-500/80 hover:border-blue-500',
      activeBg: 'bg-blue-500/10 border-blue-500/40 text-blue-400 shadow-sm',
      inactiveBg: 'bg-[#0D0F14] border-white/5 text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/10',
      logoChar: 'G',
      logoBg: 'bg-blue-500'
    },
    {
      id: 'azure' as CloudProvider,
      name: 'Microsoft Azure',
      short: 'Azure',
      accentColor: 'border-sky-500/80 hover:border-sky-500',
      activeBg: 'bg-sky-500/10 border-sky-500/40 text-sky-400 shadow-sm',
      inactiveBg: 'bg-[#0D0F14] border-white/5 text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/10',
      logoChar: 'M',
      logoBg: 'bg-sky-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="provider-switcher">
      {providers.map((p) => {
        const isActive = selectedProvider === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onChangeProvider(p.id)}
            className={`flex items-center gap-3.5 p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer shadow-sm relative overflow-hidden group ${
              isActive ? p.activeBg : p.inactiveBg
            }`}
          >
            {/* Visual branding dot */}
            <div className={`w-8 h-8 rounded-lg ${p.logoBg} flex items-center justify-center text-white font-black font-mono shadow-sm group-hover:scale-105 transition-transform`}>
              {p.logoChar}
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-widest font-mono text-slate-500 block">
                Cloud Provider
              </span>
              <h3 className="text-sm font-bold truncate leading-snug">
                {p.name}
              </h3>
            </div>

            {isActive && (
              <span className="shrink-0 p-1 rounded-full bg-slate-950 border border-current">
                <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
              </span>
            )}
            
            {/* Subtle bottom active color bar */}
            {isActive && (
              <span className={`absolute bottom-0 left-0 right-0 h-0.5 ${p.logoBg}`} />
            )}
          </button>
        );
      })}
    </div>
  );
}
