import React, { useState, useEffect } from 'react';
import { CloudData, CloudProvider } from '../types';
import { HelpCircle, DollarSign, Calculator, Info, Flame, ToggleLeft, ArrowRight } from 'lucide-react';

interface CostAndTradeoffsProps {
  provider: CloudProvider;
  data: CloudData;
}

export default function CostAndTradeoffs({ provider, data }: CostAndTradeoffsProps) {
  // Calculator States
  const [selectedInstance, setSelectedInstance] = useState(data.instances[0].type);
  const [diskStorageGb, setDiskStorageGb] = useState(15);
  const [dataTransferGb, setDataTransferGb] = useState(10);
  const [instanceCount, setInstanceCount] = useState(1);

  // Sync state when provider changes
  useEffect(() => {
    setSelectedInstance(data.instances[1]?.type || data.instances[0].type);
  }, [provider, data]);

  const currentInstanceObj = data.instances.find(i => i.type === selectedInstance) || data.instances[0];

  // Calculate Costs
  const computeMonthlyCost = currentInstanceObj.monthlyCost * instanceCount;
  const storageMonthlyCost = diskStorageGb * data.storageCostGb * instanceCount;
  const networkMonthlyCost = dataTransferGb * data.dataTransferCostGb;
  const totalMonthlyCost = computeMonthlyCost + storageMonthlyCost + networkMonthlyCost;
  const totalAnnualCost = totalMonthlyCost * 12;

  // Free Tier callout text
  const getFreeTierEligible = () => {
    if (provider === 'aws' && selectedInstance === 't3.micro') {
      return 'Eligible for AWS Free Tier (750 hours/month free for first 12 months).';
    }
    if (provider === 'gcp' && selectedInstance === 'e2-micro') {
      return 'Eligible for GCP Always Free program (1 non-preemptible e2-micro VM in eligible US regions).';
    }
    if (provider === 'azure' && selectedInstance === 'Standard_B1s') {
      return 'Eligible for Azure 12-Month Free Services (750 hours/month of Standard_B1s VM free).';
    }
    return null;
  };

  const freeTierText = getFreeTierEligible();

  return (
    <div className="space-y-8" id="cost-section">
      {/* 1. INTERACTIVE PRICING CALCULATOR */}
      <div className="bg-[#0D0F14] border border-white/10 rounded-xl p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
          <span className="p-1 rounded bg-blue-900/40 text-blue-400 border border-blue-800">
            <Calculator className="w-4 h-4" />
          </span>
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
            Interactive Cost Awareness Calculator
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* VM Instance Class */}
              <div>
                <label className="text-[10px] text-gray-500 font-mono uppercase block mb-1.5">
                  Virtual Machine Size
                </label>
                <select
                  value={selectedInstance}
                  onChange={(e) => setSelectedInstance(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-gray-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {data.instances.map((inst) => (
                    <option key={inst.type} value={inst.type}>
                      {inst.type} ({inst.vcpu} vCPU, {inst.ram} RAM) - ${inst.monthlyCost.toFixed(2)}/mo
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-gray-500 mt-1 block leading-relaxed font-sans">
                  {currentInstanceObj.description}
                </span>
              </div>

              {/* VM Instance Count */}
              <div>
                <label className="text-[10px] text-gray-500 font-mono uppercase block mb-1.5">
                  Instance Count
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={instanceCount}
                  onChange={(e) => setInstanceCount(parseInt(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-black/40 rounded-lg appearance-none mt-2"
                />
                <div className="flex justify-between items-center text-xs font-mono text-gray-400 mt-2">
                  <span>Count:</span>
                  <span className="text-white font-bold">{instanceCount} VM(s)</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Storage Sliders */}
              <div>
                <label className="text-[10px] text-gray-500 font-mono uppercase block mb-1.5">
                  Disk Volume Storage Size (GB)
                </label>
                <input
                  type="range"
                  min="8"
                  max="100"
                  value={diskStorageGb}
                  onChange={(e) => setDiskStorageGb(parseInt(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-black/40 rounded-lg appearance-none mt-2"
                />
                <div className="flex justify-between items-center text-xs font-mono text-gray-400 mt-2">
                  <span>Size:</span>
                  <span className="text-white font-bold">{diskStorageGb} GB SSD</span>
                </div>
              </div>

              {/* Data Transfer Egress Sliders */}
              <div>
                <label className="text-[10px] text-gray-500 font-mono uppercase block mb-1.5">
                  Internet Outbound Data Egress (GB/Month)
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={dataTransferGb}
                  onChange={(e) => setDataTransferGb(parseInt(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-black/40 rounded-lg appearance-none mt-2"
                />
                <div className="flex justify-between items-center text-xs font-mono text-gray-400 mt-2">
                  <span>Data Out:</span>
                  <span className="text-white font-bold">{dataTransferGb} GB/mo</span>
                </div>
              </div>
            </div>

            {freeTierText && (
              <div className="bg-green-400/5 border border-green-400/10 p-3 rounded-lg flex items-start gap-2.5">
                <Info className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <span className="text-xs text-green-500/90 leading-relaxed">
                  {freeTierText}
                </span>
              </div>
            )}
          </div>

          {/* Cost Estimates Display */}
          <div className="bg-black/20 rounded-xl p-5 border border-white/5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">
                Monthly Estimate (USD)
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <DollarSign className="w-5 h-5 text-blue-400" />
                <span className="text-3xl font-extrabold text-white tracking-tight font-sans">
                  {totalMonthlyCost.toFixed(2)}
                </span>
                <span className="text-gray-500 text-xs font-mono">/mo</span>
              </div>

              <div className="mt-4 space-y-2 border-t border-white/5 pt-3 text-xs font-mono text-gray-400">
                <div className="flex justify-between">
                  <span>Compute VM:</span>
                  <span className="text-gray-200">${computeMonthlyCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Disk SSD:</span>
                  <span className="text-gray-200">${storageMonthlyCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Egress Net:</span>
                  <span className="text-gray-200">${networkMonthlyCost.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
              <div>
                <span className="text-[9px] text-gray-500 block uppercase font-mono">Annualized cost</span>
                <span className="text-sm font-bold text-gray-300 font-mono">${totalAnnualCost.toFixed(2)}</span>
              </div>
              <span className="text-[10px] text-green-400 font-bold bg-green-400/5 px-2 py-0.5 rounded border border-green-400/10">
                LCOE Verified
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ARCHITECTURAL TRADE-OFFS PANEL */}
      <div className="bg-[#0D0F14] border border-white/10 rounded-xl p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
          <span className="p-1 rounded bg-blue-900/40 text-blue-400 border border-blue-800">
            <Flame className="w-4 h-4" />
          </span>
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
            Core Architectural Trade-offs Evaluated
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Tradeoff 1 */}
          <div className="bg-black/20 rounded-xl p-4.5 border border-white/5 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2.5">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest font-mono">
                  Hosting: VM vs. Container
                </h4>
                <span className="text-[9px] bg-white/5 border border-white/10 text-gray-300 px-1.5 py-0.5 rounded font-mono">Active Choice: VM</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed mb-3">
                Deploying directly to a Virtual Machine (EC2/GCE) with PM2 provides direct OS access, basic scripting simplicity, and consistent resources. 
              </p>
              <div className="space-y-1.5 text-[11px] font-sans">
                <div className="text-gray-400"><strong className="text-green-400 font-mono font-medium">Pros:</strong> Absolute filesystem control; Nginx proxy configs.</div>
                <div className="text-gray-400"><strong className="text-red-400 font-mono font-medium">Cons:</strong> OS patching responsibility; no built-in autoscaling.</div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-gray-500 italic font-sans">
              VM selected for hands-on network/sysadmin evaluation.
            </div>
          </div>

          {/* Tradeoff 2 */}
          <div className="bg-black/20 rounded-xl p-4.5 border border-white/5 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2.5">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest font-mono">
                  State: Local vs. Managed DB
                </h4>
                <span className="text-[9px] bg-white/5 border border-white/10 text-gray-300 px-1.5 py-0.5 rounded font-mono">Active Choice: Local/N/A</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed mb-3">
                For a basic application with minimal database read/write actions, using local file storage or SQLite keeps architecture simple and costs at exactly $0.00.
              </p>
              <div className="space-y-1.5 text-[11px] font-sans">
                <div className="text-gray-400"><strong className="text-green-400 font-mono font-medium">Pros:</strong> Zero cost; no VPC complexity; instant local queries.</div>
                <div className="text-gray-400"><strong className="text-red-400 font-mono font-medium">Cons:</strong> Ephemeral disk state; cannot scale VM horizontally.</div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-gray-500 italic font-sans">
              Managed DB (RDS/Cloud SQL) avoided to control assessment billing.
            </div>
          </div>

          {/* Tradeoff 3 */}
          <div className="bg-black/20 rounded-xl p-4.5 border border-white/5 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2.5">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest font-mono">
                  Static CDN vs. Dynamic VM
                </h4>
                <span className="text-[9px] bg-white/5 border border-white/10 text-gray-300 px-1.5 py-0.5 rounded font-mono">Active Choice: Dynamic VM</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed mb-3">
                Static sites hosted directly on AWS S3, GCP GCS, or Azure Blob Storage combined with CDNs (CloudFront, CDN) offer near-infinite scale and maximum safety.
              </p>
              <div className="space-y-1.5 text-[11px] font-sans">
                <div className="text-gray-400"><strong className="text-green-400 font-mono font-medium">Pros:</strong> Infinite scalability; immune to DDoS; monthly cost &lt; $0.50.</div>
                <div className="text-gray-400"><strong className="text-red-400 font-mono font-medium">Cons:</strong> Lacks server-side Node/Python capabilities.</div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-gray-500 italic font-sans">
              VM selected as required for server-side endpoints and health tracking.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
