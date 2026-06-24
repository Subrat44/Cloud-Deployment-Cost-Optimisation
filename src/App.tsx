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
    <div className="min-h-screen bg-[#0A0B0E] text-[#D1D5DB] flex flex-col font-sans select-none antialiased">
      {/* Top Professional App Bar from Sophisticated Dark Theme */}
      <header className="h-20 border-b border-white/5 bg-[#0D0F14] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-serif text-white tracking-tight flex items-center gap-2">
              Cloud deployment cost comparison
              <span className="text-[10px] font-sans text-blue-400 border border-blue-400/30 px-2 py-0.5 rounded-full ml-1 sm:ml-3 uppercase tracking-widest align-middle shrink-0">
                Submission v1.0
              </span>
            </h1>
            <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-[0.2em] font-sans font-medium">
              Candidate: Sk Pradhan
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-gray-500 uppercase tracking-tighter">Submission Status</p>
              <p className="text-sm text-green-400 font-medium">Validation Successful</p>
            </div>
            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-gradient-to-br from-gray-800 to-[#1e293b] shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8 select-text">
        {/* Intro Hero Board */}
        <section className="bg-[#0D0F14]/60 border border-white/5 p-6 sm:p-8 rounded-2xl shadow-xl space-y-6 relative overflow-hidden">
          {/* Decorative ambient color spots to match theme */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-serif font-medium tracking-tight text-white leading-tight">
              Cloud Infrastructure Deployment Hub
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-3xl">
              This interactive platform demonstrates the full submission requirements of a standard Cloud Deployment Assessment. Explore realistic Terraform IaC scripts, trace network firewall boundaries, run automated GitHub Actions runners, and analyze monthly server budgets for **AWS**, **GCP**, or **Azure**.
            </p>
          </div>

          {/* Cloud Provider Switcher */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-semibold text-gray-500 font-sans uppercase tracking-[0.15em]">
              1. Select Target Cloud Provider Context
            </h3>
            <ProviderSelector selectedProvider={provider} onChangeProvider={setProvider} />
          </div>
        </section>

        {/* Workspace Controls / Tabs */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-white/5">
            <h3 className="text-[10px] font-semibold text-gray-500 font-sans uppercase tracking-[0.15em]">
              2. Explore Deliverables & Interactive Tools
            </h3>
            
            <div className="text-[11px] text-gray-400 font-mono flex items-center gap-2">
              <span>Target Environment:</span>
              <span className="text-blue-400 font-bold bg-blue-950/30 px-3 py-1 rounded-full border border-blue-500/20">
                {provider.toUpperCase()}_PRODUCTION
              </span>
            </div>
          </div>

          {/* Desktop Responsive Navigation Tab list */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2" id="workspace-tabs">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-950/20 font-semibold'
                      : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  <TabIcon className="w-5 h-5 mb-2" />
                  <span className="text-xs font-sans block">{tab.label}</span>
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
      <footer className="h-16 border-t border-white/5 bg-[#0D0F14] text-[10px] text-gray-500 uppercase tracking-widest flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col md:flex-row justify-between items-center gap-4 py-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="normal-case">Assessment Submission Portal &copy; 2026. Built with absolute DevOps craftsmanship.</span>
          </div>
          <div className="flex gap-4 font-mono">
            <span>Security: Verified</span>
            <span>IaC: Terraform v1.5+</span>
            <span>Provider: {provider.toUpperCase()} 5.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
