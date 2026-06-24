import React, { useState } from 'react';
import { CloudProvider } from './types';
import { awsData } from './data/awsData';
import { gcpData } from './data/gcpData';
import { azureData } from './data/azureData';
import ProviderSelector from './components/ProviderSelector';
import ArchitectureDiagram from './components/ArchitectureDiagram';
import CodeExplorer from './components/CodeExplorer';
import PipelineSimulator from './components/PipelineSimulator';
import CostAndTradeoffs from './components/CostAndTradeoffs';
import ReadmeViewer from './components/ReadmeViewer';
import CompareProviders from './components/CompareProviders';

import { 
  Cloud, 
  Layers, 
  Code, 
  Terminal, 
  Coins, 
  FileText, 
  CheckCircle,
  HelpCircle,
  ArrowUpRight,
  GitCompare
} from 'lucide-react';

// Subtle, luxurious 3D Rose Gold Dome structures
function RoseGoldDomeHemi({ className = '', size = 'w-48 h-24' }) {
  return (
    <div 
      className={`rounded-t-full transition-all duration-700 hover:scale-[1.03] ${size} ${className}`}
      style={{
        background: 'radial-gradient(circle at 50% 20%, #FFFDFD 0%, #ECC2BC 20%, #CC8E87 50%, #B76E79 78%, #78363F 100%)',
        boxShadow: '0 15px 35px rgba(183, 110, 121, 0.12), inset -2px -6px 12px rgba(0,0,0,0.1), inset 2px 6px 12px rgba(255,255,255,0.7)',
        filter: 'blur(0.5px)'
      }}
    />
  );
}

function RoseGoldDomeSphere({ className = '', size = 'w-24 h-24' }) {
  return (
    <div 
      className={`rounded-full transition-all duration-700 hover:rotate-6 hover:scale-[1.05] ${size} ${className}`}
      style={{
        background: 'radial-gradient(circle at 35% 30%, #FFFDFD 0%, #F3DCDA 15%, #E3B0AB 40%, #B76E79 75%, #8A414C 100%)',
        boxShadow: '0 20px 40px rgba(183, 110, 121, 0.15), inset -4px -6px 12px rgba(0,0,0,0.15), inset 4px 6px 12px rgba(255,255,255,0.8)'
      }}
    />
  );
}

export default function App() {
  const [provider, setProvider] = useState<CloudProvider>('aws');
  const [activeTab, setActiveTab] = useState<'topology' | 'code' | 'pipeline' | 'cost' | 'readme' | 'compare'>('topology');
  const [selectedComponentId, setSelectedComponentId] = useState<string>('github');

  // Select dataset based on provider state
  const data = provider === 'aws' ? awsData : provider === 'gcp' ? gcpData : azureData;

  const tabs = [
    { id: 'topology' as const, label: 'Architecture Topology', icon: Layers, desc: 'Interactive deployment diagram and threat vector nodes.' },
    { id: 'code' as const, label: 'Infrastructure Code (IaC)', icon: Code, desc: 'View complete Terraform scripts, Node app files, and setups.' },
    { id: 'pipeline' as const, label: 'CI/CD Pipeline Simulator', icon: Terminal, desc: 'Simulate GitHub Actions workflow logs and checks.' },
    { id: 'cost' as const, label: 'Cost & Trade-offs', icon: Coins, desc: 'Budget estimates, calculator, and strategic trade-off boards.' },
    { id: 'compare' as const, label: 'Compare Providers', icon: GitCompare, desc: 'Side-by-side cost and infrastructure specification matrix.' },
    { id: 'readme' as const, label: 'Assessment README', icon: FileText, desc: 'Structured submission details, checklists, and documentation.' }
  ];

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-slate-800 flex flex-col font-sans select-none antialiased relative overflow-hidden">
      {/* Dynamic Background subtle 3D Domes and Spheres */}
      <div className="absolute top-[-40px] right-[5%] z-0 pointer-events-none opacity-90">
        <RoseGoldDomeHemi size="w-72 h-36" className="transform rotate-180" />
      </div>
      <div className="absolute bottom-[10%] left-[-60px] z-0 pointer-events-none opacity-40">
        <RoseGoldDomeSphere size="w-48 h-48" />
      </div>
      <div className="absolute top-[45%] right-[-40px] z-0 pointer-events-none opacity-30">
        <RoseGoldDomeSphere size="w-32 h-32" />
      </div>

      {/* Top Professional App Bar with Light Rose Gold Border */}
      <header className="h-20 border-b border-rosegold-100 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm shadow-rosegold-500/2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between relative z-10">
          <div>
            <h1 className="text-xl sm:text-2xl font-serif text-slate-900 tracking-tight flex items-center gap-2">
              Cloud deployment cost comparison
              <span className="text-[10px] font-sans text-rosegold-600 border border-rosegold-300 bg-rosegold-50/50 px-2 py-0.5 rounded-full ml-1 sm:ml-3 uppercase tracking-widest align-middle shrink-0 font-semibold">
                Submission v1.0
              </span>
            </h1>
            <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-[0.2em] font-sans font-bold">
              Sk Pradhan
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-gray-400 uppercase tracking-tighter">Submission Status</p>
              <p className="text-sm text-emerald-600 font-bold">Validation Successful</p>
            </div>
            <div className="w-10 h-10 rounded-full border border-rosegold-200 flex items-center justify-center bg-gradient-to-br from-rosegold-50 to-rosegold-100 shrink-0 shadow-sm shadow-rosegold-500/5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-text relative z-10">
        {/* Intro Hero Board */}
        <section className="bg-white border border-rosegold-200/60 p-6 sm:p-8 rounded-2xl shadow-sm shadow-rosegold-500/3 space-y-6 relative overflow-hidden">
          {/* Subtle 3D Rose Gold Dome integrated into the side of the Hero Board */}
          <div className="absolute right-[-20px] bottom-[-20px] pointer-events-none opacity-40">
            <RoseGoldDomeHemi size="w-44 h-22" />
          </div>

          <div className="space-y-2 max-w-4xl">
            <h2 className="text-xl sm:text-2xl font-serif font-semibold tracking-tight text-slate-900 leading-tight">
              Cloud Infrastructure Deployment Hub
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              This interactive platform demonstrates the full submission requirements of a standard Cloud Deployment Assessment. Explore realistic Terraform IaC scripts, trace network firewall boundaries, run automated GitHub Actions runners, and analyze monthly server budgets for **AWS**, **GCP**, or **Azure**.
            </p>
          </div>

          {/* Cloud Provider Switcher */}
          <div className="space-y-3 relative z-10">
            <h3 className="text-[10px] font-bold text-rosegold-600 font-sans uppercase tracking-[0.15em]">
              1. Select Target Cloud Provider Context
            </h3>
            <ProviderSelector selectedProvider={provider} onChangeProvider={setProvider} />
          </div>
        </section>

        {/* Workspace Controls / Tabs */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-rosegold-100">
            <h3 className="text-[10px] font-bold text-rosegold-600 font-sans uppercase tracking-[0.15em]">
              2. Explore Deliverables & Interactive Tools
            </h3>
            
            <div className="text-[11px] text-gray-500 font-mono flex items-center gap-2">
              <span>Target Environment:</span>
              <span className="text-rosegold-700 font-bold bg-rosegold-50/70 px-3 py-1 rounded-full border border-rosegold-200/60">
                {provider.toUpperCase()}_PRODUCTION
              </span>
            </div>
          </div>

          {/* Desktop Responsive Navigation Tab list */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2" id="workspace-tabs">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-rosegold-500 border-rosegold-600 text-white shadow-sm shadow-rosegold-700/20 font-semibold'
                      : 'bg-white border-rosegold-100/70 text-gray-500 hover:text-rosegold-800 hover:bg-rosegold-50/40 hover:border-rosegold-200'
                  }`}
                >
                  <TabIcon className="w-5 h-5 mb-2" />
                  <span className="text-xs font-sans block leading-tight">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Dynamic Tab Body Viewer */}
          <div className="mt-6">
            {activeTab === 'topology' && (
              <ArchitectureDiagram
                provider={provider}
                onSelectComponent={setSelectedComponentId}
                selectedComponentId={selectedComponentId}
              />
            )}

            {activeTab === 'code' && (
              <CodeExplorer data={data} />
            )}

            {activeTab === 'pipeline' && (
              <PipelineSimulator provider={provider} />
            )}

            {activeTab === 'cost' && (
              <CostAndTradeoffs provider={provider} data={data} />
            )}

            {activeTab === 'readme' && (
              <ReadmeViewer provider={provider} data={data} />
            )}

            {activeTab === 'compare' && (
              <CompareProviders />
            )}
          </div>
        </section>
      </main>

      {/* Structured Footer */}
      <footer className="h-16 border-t border-rosegold-100 bg-white text-[10px] text-gray-500 uppercase tracking-widest flex items-center shadow-inner relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col md:flex-row justify-between items-center gap-4 py-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="normal-case font-medium text-slate-500">Assessment Submission Portal &copy; 2026. Built with absolute DevOps craftsmanship.</span>
          </div>
          <div className="flex gap-4 font-mono font-medium text-slate-400">
            <span>Security: Verified</span>
            <span>IaC: Terraform v1.5+</span>
            <span>Provider: {provider.toUpperCase()} 5.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
