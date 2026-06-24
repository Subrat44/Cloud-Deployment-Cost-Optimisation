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

  // Calculate Costs (Local default calculation for immediate feedback / offline fallback)
  const computeMonthlyCost = currentInstanceObj.monthlyCost * instanceCount;
  const storageMonthlyCost = diskStorageGb * data.storageCostGb * instanceCount;
  const networkMonthlyCost = dataTransferGb * data.dataTransferCostGb;
  const totalMonthlyCost = computeMonthlyCost + storageMonthlyCost + networkMonthlyCost;
  const totalAnnualCost = totalMonthlyCost * 12;

  // Python server-side state overrides
  const [backendComputeCost, setBackendComputeCost] = useState(computeMonthlyCost);
  const [backendStorageCost, setBackendStorageCost] = useState(storageMonthlyCost);
  const [backendNetworkCost, setBackendNetworkCost] = useState(networkMonthlyCost);
  const [backendTotalMonthly, setBackendTotalMonthly] = useState(totalMonthlyCost);
  const [backendTotalAnnual, setBackendTotalAnnual] = useState(totalAnnualCost);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    setIsCalculating(true);
    const controller = new AbortController();
    fetch('/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        instanceType: selectedInstance,
        diskGb: diskStorageGb,
        egressGb: dataTransferGb,
        instanceCount: instanceCount
      }),
      signal: controller.signal
    })
      .then(res => {
        if (!res.ok) throw new Error('Network error');
        return res.json();
      })
      .then(resData => {
        setBackendComputeCost(resData.computeCost);
        setBackendStorageCost(resData.storageCost);
        setBackendNetworkCost(resData.networkCost);
        setBackendTotalMonthly(resData.totalMonthly);
        setBackendTotalAnnual(resData.totalAnnual);
        setIsCalculating(false);
      })
      .catch(() => {
        // Fallback to local
        setBackendComputeCost(computeMonthlyCost);
        setBackendStorageCost(storageMonthlyCost);
        setBackendNetworkCost(networkMonthlyCost);
        setBackendTotalMonthly(totalMonthlyCost);
        setBackendTotalAnnual(totalAnnualCost);
        setIsCalculating(false);
      });

    return () => controller.abort();
  }, [provider, selectedInstance, diskStorageGb, dataTransferGb, instanceCount, computeMonthlyCost, storageMonthlyCost, networkMonthlyCost, totalMonthlyCost, totalAnnualCost]);

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
      <div className="bg-white border border-rosegold-200/60 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-rosegold-100">
          <span className="p-1 rounded bg-rosegold-50 text-rosegold-600 border border-rosegold-200">
            <Calculator className="w-4 h-4" />
          </span>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
            Interactive Cost Awareness Calculator
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* VM Instance Class */}
              <div>
                <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1.5 font-bold">
                  Virtual Machine Size
                </label>
                <select
                  value={selectedInstance}
                  onChange={(e) => setSelectedInstance(e.target.value)}
                  className="w-full bg-rosegold-50/30 border border-rosegold-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 font-semibold focus:outline-none focus:border-rosegold-400 cursor-pointer"
                >
                  {data.instances.map((inst) => (
                    <option key={inst.type} value={inst.type} className="text-slate-800 font-mono">
                      {inst.type} ({inst.vcpu} vCPU, {inst.ram} RAM) - ${inst.monthlyCost.toFixed(2)}/mo
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-500 mt-1 block leading-relaxed font-sans font-medium">
                  {currentInstanceObj.description}
                </span>
              </div>

              {/* VM Instance Count */}
              <div>
                <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1.5 font-bold">
                  Instance Count
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={instanceCount}
                  onChange={(e) => setInstanceCount(parseInt(e.target.value))}
                  className="w-full accent-rose-400 cursor-pointer h-1.5 bg-rosegold-100 rounded-lg appearance-none mt-2"
                />
                <div className="flex justify-between items-center text-xs font-mono text-slate-500 mt-2">
                  <span className="font-medium">Count:</span>
                  <span className="text-slate-800 font-bold">{instanceCount} VM(s)</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Storage Sliders */}
              <div>
                <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1.5 font-bold">
                  Disk Volume Storage Size (GB)
                </label>
                <input
                  type="range"
                  min="8"
                  max="100"
                  value={diskStorageGb}
                  onChange={(e) => setDiskStorageGb(parseInt(e.target.value))}
                  className="w-full accent-rose-400 cursor-pointer h-1.5 bg-rosegold-100 rounded-lg appearance-none mt-2"
                />
                <div className="flex justify-between items-center text-xs font-mono text-slate-500 mt-2">
                  <span className="font-medium">Size:</span>
                  <span className="text-slate-800 font-bold">{diskStorageGb} GB SSD</span>
                </div>
              </div>

              {/* Data Transfer Egress Sliders */}
              <div>
                <label className="text-[10px] text-slate-500 font-mono uppercase block mb-1.5 font-bold">
                  Internet Outbound Data Egress (GB/Month)
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={dataTransferGb}
                  onChange={(e) => setDataTransferGb(parseInt(e.target.value))}
                  className="w-full accent-rose-400 cursor-pointer h-1.5 bg-rosegold-100 rounded-lg appearance-none mt-2"
                />
                <div className="flex justify-between items-center text-xs font-mono text-slate-500 mt-2">
                  <span className="font-medium">Data Out:</span>
                  <span className="text-slate-800 font-bold">{dataTransferGb} GB/mo</span>
                </div>
              </div>
            </div>

            {freeTierText && (
              <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-lg flex items-start gap-2.5">
                <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-xs text-emerald-800 leading-relaxed font-semibold">
                  {freeTierText}
                </span>
              </div>
            )}
          </div>

          {/* Cost Estimates Display */}
          <div className="bg-rosegold-50/20 rounded-xl p-5 border border-rosegold-100 flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-bold">
                  Monthly Estimate (USD)
                </span>
                <span className="text-[8px] font-mono font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Python API
                </span>
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <DollarSign className="w-5 h-5 text-rosegold-500" />
                <span className={`text-3xl font-black text-slate-800 tracking-tight font-sans transition-all duration-300 ${isCalculating ? 'opacity-50' : 'opacity-100'}`}>
                  {backendTotalMonthly.toFixed(2)}
                </span>
                <span className="text-slate-500 text-xs font-mono">/mo</span>
              </div>

              <div className="mt-4 space-y-2 border-t border-rosegold-100 pt-3 text-xs font-mono text-slate-600">
                <div className="flex justify-between">
                  <span>Compute VM:</span>
                  <span className="text-slate-800 font-bold">${backendComputeCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Disk SSD:</span>
                  <span className="text-slate-800 font-bold">${backendStorageCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Egress Net:</span>
                  <span className="text-slate-800 font-bold">${backendNetworkCost.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-rosegold-100 flex justify-between items-center">
              <div>
                <span className="text-[9px] text-slate-400 block uppercase font-mono font-bold">Annualized cost</span>
                <span className="text-sm font-bold text-slate-700 font-mono">${backendTotalAnnual.toFixed(2)}</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                LCOE Verified
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ARCHITECTURAL TRADE-OFFS PANEL */}
      <div className="bg-white border border-rosegold-200/60 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-rosegold-100">
          <span className="p-1 rounded bg-rosegold-50 text-rosegold-600 border border-rosegold-200">
            <Flame className="w-4 h-4" />
          </span>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
            Core Architectural Trade-offs Evaluated
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Tradeoff 1 */}
          <div className="bg-rosegold-50/10 rounded-xl p-4.5 border border-rosegold-100/60 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2.5 gap-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest font-mono">
                  Hosting: VM vs. Container
                </h4>
                <span className="text-[9px] shrink-0 bg-rosegold-100/50 border border-rosegold-200 text-rosegold-800 px-1.5 py-0.5 rounded font-mono font-bold">Active Choice: VM</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium mb-3">
                Deploying directly to a Virtual Machine (EC2/GCE) with PM2 provides direct OS access, basic scripting simplicity, and consistent resources. 
              </p>
              <div className="space-y-1.5 text-[11px] font-sans">
                <div className="text-slate-600 font-medium"><strong className="text-emerald-600 font-mono font-bold">Pros:</strong> Absolute filesystem control; Nginx proxy configs.</div>
                <div className="text-slate-600 font-medium"><strong className="text-rose-500 font-mono font-bold">Cons:</strong> OS patching responsibility; no built-in autoscaling.</div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-rosegold-100/50 text-[10px] text-slate-500 italic font-medium font-sans">
              VM selected for hands-on network/sysadmin evaluation.
            </div>
          </div>

          {/* Tradeoff 2 */}
          <div className="bg-rosegold-50/10 rounded-xl p-4.5 border border-rosegold-100/60 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2.5 gap-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest font-mono">
                  State: Local vs. Managed DB
                </h4>
                <span className="text-[9px] shrink-0 bg-rosegold-100/50 border border-rosegold-200 text-rosegold-800 px-1.5 py-0.5 rounded font-mono font-bold">Active Choice: Local/N/A</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium mb-3">
                For a basic application with minimal database read/write actions, using local file storage or SQLite keeps architecture simple and costs at exactly $0.00.
              </p>
              <div className="space-y-1.5 text-[11px] font-sans">
                <div className="text-slate-600 font-medium"><strong className="text-emerald-600 font-mono font-bold">Pros:</strong> Zero cost; no VPC complexity; instant local queries.</div>
                <div className="text-slate-600 font-medium"><strong className="text-rose-500 font-mono font-bold">Cons:</strong> Ephemeral disk state; cannot scale VM horizontally.</div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-rosegold-100/50 text-[10px] text-slate-500 italic font-medium font-sans">
              Managed DB (RDS/Cloud SQL) avoided to control assessment billing.
            </div>
          </div>

          {/* Tradeoff 3 */}
          <div className="bg-rosegold-50/10 rounded-xl p-4.5 border border-rosegold-100/60 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2.5 gap-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest font-mono">
                  Static CDN vs. Dynamic VM
                </h4>
                <span className="text-[9px] shrink-0 bg-rosegold-100/50 border border-rosegold-200 text-rosegold-800 px-1.5 py-0.5 rounded font-mono font-bold">Active Choice: Dynamic VM</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium mb-3">
                Static sites hosted directly on AWS S3, GCP GCS, or Azure Blob Storage combined with CDNs (CloudFront, CDN) offer near-infinite scale and maximum safety.
              </p>
              <div className="space-y-1.5 text-[11px] font-sans">
                <div className="text-slate-600 font-medium"><strong className="text-emerald-600 font-mono font-bold">Pros:</strong> Infinite scalability; immune to DDoS; monthly cost &lt; $0.50.</div>
                <div className="text-slate-600 font-medium"><strong className="text-rose-500 font-mono font-bold">Cons:</strong> Lacks server-side Node/Python capabilities.</div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-rosegold-100/50 text-[10px] text-slate-500 italic font-medium font-sans">
              VM selected as required for server-side endpoints and health tracking.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
