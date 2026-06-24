import React, { useState, useEffect } from 'react';
import { CloudProvider } from '../types';
import { awsData } from '../data/awsData';
import { gcpData } from '../data/gcpData';
import { azureData } from '../data/azureData';
import { 
  GitCompare, 
  Coins, 
  Layers, 
  Check, 
  Copy, 
  ArrowLeftRight, 
  ShieldCheck, 
  DollarSign, 
  Sliders, 
  Activity, 
  HardDrive, 
  ArrowUpRight, 
  HelpCircle,
  FileCode,
  Lock,
  Cpu,
  Globe,
  UserCheck
} from 'lucide-react';

export default function CompareProviders() {
  const [providerA, setProviderA] = useState<CloudProvider>('aws');
  const [providerB, setProviderB] = useState<CloudProvider>('gcp');

  // Shared comparison parameters
  const [instanceCount, setInstanceCount] = useState<number>(1);
  const [diskStorageGb, setDiskStorageGb] = useState<number>(30);
  const [dataTransferGb, setDataTransferGb] = useState<number>(15);

  // Selected instances per provider
  const [selectedInstanceA, setSelectedInstanceA] = useState<string>('');
  const [selectedInstanceB, setSelectedInstanceB] = useState<string>('');

  // Active code comparison section
  const [activeCodeSection, setActiveCodeSection] = useState<'main' | 'variables' | 'iam' | 'outputs'>('main');
  const [copiedA, setCopiedA] = useState(false);
  const [copiedB, setCopiedB] = useState(false);

  // Helper to map providers to their data
  const getProviderData = (prov: CloudProvider) => {
    switch (prov) {
      case 'aws': return awsData;
      case 'gcp': return gcpData;
      case 'azure': return azureData;
    }
  };

  const dataA = getProviderData(providerA);
  const dataB = getProviderData(providerB);

  // Reset selected instances on provider change
  useEffect(() => {
    if (dataA.instances.length > 0) {
      // Prefer micro/small default
      const defaultInst = dataA.instances.find(i => i.type.includes('micro') || i.type.includes('B1s')) || dataA.instances[0];
      setSelectedInstanceA(defaultInst.type);
    }
  }, [providerA]);

  useEffect(() => {
    if (dataB.instances.length > 0) {
      const defaultInst = dataB.instances.find(i => i.type.includes('micro') || i.type.includes('B1s')) || dataB.instances[0];
      setSelectedInstanceB(defaultInst.type);
    }
  }, [providerB]);

  const currentInstanceA = dataA.instances.find(i => i.type === selectedInstanceA) || dataA.instances[0];
  const currentInstanceB = dataB.instances.find(i => i.type === selectedInstanceB) || dataB.instances[0];

  // Calculations for A
  const computeCostA = (currentInstanceA?.monthlyCost || 0) * instanceCount;
  const storageCostA = diskStorageGb * dataA.storageCostGb * instanceCount;
  const networkCostA = dataTransferGb * dataA.dataTransferCostGb;
  const totalCostA = computeCostA + storageCostA + networkCostA;

  // Calculations for B
  const computeCostB = (currentInstanceB?.monthlyCost || 0) * instanceCount;
  const storageCostB = diskStorageGb * dataB.storageCostGb * instanceCount;
  const networkCostB = dataTransferGb * dataB.dataTransferCostGb;
  const totalCostB = computeCostB + storageCostB + networkCostB;

  // Highlight helper
  const getCheaperClass = (valA: number, valB: number, current: 'A' | 'B') => {
    if (valA === valB) return 'text-gray-400';
    if (current === 'A') {
      return valA < valB ? 'text-green-400 font-bold' : 'text-gray-400';
    } else {
      return valB < valA ? 'text-green-400 font-bold' : 'text-gray-400';
    }
  };

  const getCheaperBadge = (valA: number, valB: number, current: 'A' | 'B') => {
    if (valA === valB) return null;
    if (current === 'A' && valA < valB) {
      const pct = ((valB - valA) / valB * 100).toFixed(0);
      return <span className="ml-1.5 px-1.5 py-0.5 text-[9px] bg-green-500/10 border border-green-400/20 rounded text-green-400 font-bold uppercase tracking-wider">Save {pct}%</span>;
    }
    if (current === 'B' && valB < valA) {
      const pct = ((valA - valB) / valA * 100).toFixed(0);
      return <span className="ml-1.5 px-1.5 py-0.5 text-[9px] bg-green-500/10 border border-green-400/20 rounded text-green-400 font-bold uppercase tracking-wider">Save {pct}%</span>;
    }
    return null;
  };

  const handleCopy = (side: 'A' | 'B', text: string) => {
    navigator.clipboard.writeText(text);
    if (side === 'A') {
      setCopiedA(true);
      setTimeout(() => setCopiedA(false), 2000);
    } else {
      setCopiedB(true);
      setTimeout(() => setCopiedB(false), 2000);
    }
  };

  // Infrastructure details mapping
  const getInfraSpecs = (prov: CloudProvider) => {
    switch (prov) {
      case 'aws':
        return {
          computeService: 'Elastic Compute Cloud (EC2)',
          storageService: 'Elastic Block Store (EBS) gp3',
          vpcName: 'Amazon Virtual Private Cloud (VPC)',
          securityName: 'AWS Security Group (Stateful)',
          iamName: 'IAM Instance Profile / IAM Role',
          oidcName: 'AWS OIDC Provider Federation',
          netDetails: 'Isolated subnets with Internet Gateway route mapping. Ingress filtered explicitly by Security Group state tables.',
          secDetails: 'Least-privilege firewall block. No port 22 access default; HTTP (80) & HTTPS (443) only for inbound public route paths.',
          iamDetails: 'Trust relationships establish connection using OpenID Connect (OIDC) without long-lived access keys.',
          tfResources: [
            { resource: 'aws_vpc', desc: 'Custom network partition' },
            { resource: 'aws_subnet', desc: 'Custom IP segment' },
            { resource: 'aws_security_group', desc: 'Stateful firewall' },
            { resource: 'aws_instance', desc: 'Virtual Compute instance' },
            { resource: 'aws_iam_role', desc: 'Least-privilege role identity' }
          ]
        };
      case 'gcp':
        return {
          computeService: 'Compute Engine VM Instance',
          storageService: 'Persistent Disk (PD) Standard/SSD',
          vpcName: 'Google Virtual Private Cloud (VPC)',
          securityName: 'VPC Firewall Rule (Stateful)',
          iamName: 'Google Service Account',
          oidcName: 'Workload Identity Federation',
          netDetails: 'Custom mode network with Cloud Router / Cloud NAT. Egress-focused private paths with explicit static target routes.',
          secDetails: 'Stateful VPC firewall rules with network service tags. Specific CIDR validation filtering to prevent broad exposure.',
          iamDetails: 'OIDC temporary security credentials mapped directly into service accounts for secure deployment pipeline auth.',
          tfResources: [
            { resource: 'google_compute_network', desc: 'Custom VPC network' },
            { resource: 'google_compute_subnetwork', desc: 'VPC network segment' },
            { resource: 'google_compute_firewall', desc: 'Stateful network rules' },
            { resource: 'google_compute_instance', desc: 'Virtual VM host' },
            { resource: 'google_service_account', desc: 'Service execution keyless profile' }
          ]
        };
      case 'azure':
        return {
          computeService: 'Azure Virtual Machine (Linux)',
          storageService: 'Premium SSD Managed Disk',
          vpcName: 'Azure Virtual Network (VNet)',
          securityName: 'Network Security Group (NSG)',
          iamName: 'User Assigned Managed Identity',
          oidcName: 'Azure Federated Credentials (OIDC)',
          netDetails: 'Virtual networks with dynamic routing tables. Explicit Public IP resource allocated and bound directly to Network Interface (NIC).',
          secDetails: 'Network Security Groups structured with strict rule prioritization (e.g. Rule 100 HTTP, Rule 110 HTTPS, Rule 1000 DenyAll).',
          iamDetails: 'Federated credentials grant workflow pipeline execution tokens mapping straight onto user-assigned identities.',
          tfResources: [
            { resource: 'azurerm_virtual_network', desc: 'Custom virtual network' },
            { resource: 'azurerm_subnet', desc: 'Virtual network segment' },
            { resource: 'azurerm_network_security_group', desc: 'Prioritized security rules' },
            { resource: 'azurerm_linux_virtual_machine', desc: 'Linux virtual machine' },
            { resource: 'azurerm_user_assigned_identity', desc: 'Least-privilege container' }
          ]
        };
    }
  };

  const specA = getInfraSpecs(providerA);
  const specB = getInfraSpecs(providerB);

  // Grab active code files
  const getCodeContent = (data: typeof awsData, section: typeof activeCodeSection) => {
    switch (section) {
      case 'main': return data.terraform.mainTf;
      case 'variables': return data.terraform.variablesTf;
      case 'iam': return data.terraform.iamTf;
      case 'outputs': return data.terraform.outputsTf;
    }
  };

  const codeA = getCodeContent(dataA, activeCodeSection);
  const codeB = getCodeContent(dataB, activeCodeSection);

  const getCodeFileName = (prov: CloudProvider, section: typeof activeCodeSection) => {
    switch (section) {
      case 'main': return 'main.tf';
      case 'variables': return 'variables.tf';
      case 'iam': return prov === 'aws' ? 'iam.tf' : prov === 'gcp' ? 'iam_service_account.tf' : 'managed_identity.tf';
      case 'outputs': return 'outputs.tf';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="compare-providers-section">
      {/* Feature Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0D0F14] border border-white/10 rounded-xl p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg shadow-sm">
            <GitCompare className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono">
              Cloud Provider Comparative Workspace
            </h3>
            <p className="text-xs text-gray-400 mt-1 font-sans">
              Compare budget forecasts, architectural definitions, and actual Terraform configurations side-by-side.
            </p>
          </div>
        </div>
        <div className="text-[10px] bg-blue-400/5 text-blue-400 border border-blue-400/20 font-mono px-3 py-1 rounded-full uppercase tracking-wider">
          Multi-Cloud Assessment Tool
        </div>
      </div>

      {/* Side-by-Side Provider Configuration Selector Card */}
      <div className="bg-[#0D0F14] border border-white/10 rounded-xl p-6 shadow-xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
          {/* Vertical Separator for wide screens */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-white/5 -ml-px"></div>

          {/* Left Column (Provider A Selection) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 text-[10px] font-mono flex items-center justify-center font-bold">A</span>
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest font-mono">Select Provider A</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-gray-500 font-mono uppercase block mb-1.5">Cloud Platform</label>
                <select
                  value={providerA}
                  onChange={(e) => setProviderA(e.target.value as CloudProvider)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-gray-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="aws">Amazon Web Services (AWS)</option>
                  <option value="gcp">Google Cloud Platform (GCP)</option>
                  <option value="azure">Microsoft Azure</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 font-mono uppercase block mb-1.5">VM Instance size</label>
                <select
                  value={selectedInstanceA}
                  onChange={(e) => setSelectedInstanceA(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-gray-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {dataA.instances.map((inst) => (
                    <option key={inst.type} value={inst.type}>
                      {inst.type} ({inst.vcpu}v, {inst.ram}R) - ${inst.monthlyCost.toFixed(2)}/mo
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 bg-black/20 p-3 rounded-lg border border-white/5 leading-relaxed font-sans min-h-[50px]">
              {currentInstanceA?.description || 'Virtual machine instance configuration details.'}
            </p>
          </div>

          {/* Right Column (Provider B Selection) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <span className="w-5 h-5 rounded-full bg-emerald-600/20 text-emerald-400 text-[10px] font-mono flex items-center justify-center font-bold">B</span>
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest font-mono">Select Provider B</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-gray-500 font-mono uppercase block mb-1.5">Cloud Platform</label>
                <select
                  value={providerB}
                  onChange={(e) => setProviderB(e.target.value as CloudProvider)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-gray-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="aws">Amazon Web Services (AWS)</option>
                  <option value="gcp">Google Cloud Platform (GCP)</option>
                  <option value="azure">Microsoft Azure</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 font-mono uppercase block mb-1.5">VM Instance size</label>
                <select
                  value={selectedInstanceB}
                  onChange={(e) => setSelectedInstanceB(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-gray-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {dataB.instances.map((inst) => (
                    <option key={inst.type} value={inst.type}>
                      {inst.type} ({inst.vcpu}v, {inst.ram}R) - ${inst.monthlyCost.toFixed(2)}/mo
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 bg-black/20 p-3 rounded-lg border border-white/5 leading-relaxed font-sans min-h-[50px]">
              {currentInstanceB?.description || 'Virtual machine instance configuration details.'}
            </p>
          </div>
        </div>

        {/* Validation Check Warning */}
        {providerA === providerB && (
          <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-lg text-center">
            <span className="text-xs text-amber-500 font-medium">
              💡 Tip: Select different providers for A and B to evaluate real multi-vendor cost differentials!
            </span>
          </div>
        )}
      </div>

      {/* Dynamic Shared Siders (Cost parameters) & Cost Output */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sliders Input Panel */}
        <div className="lg:col-span-1 bg-[#0D0F14] border border-white/10 rounded-xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
              <span className="p-1 rounded bg-blue-900/40 text-blue-400 border border-blue-800">
                <Sliders className="w-4 h-4" />
              </span>
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                Shared Sizing Parameters
              </h4>
            </div>

            <div className="space-y-5">
              {/* Slider 1: Instance Count */}
              <div>
                <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                  <span className="text-gray-500 uppercase tracking-wider text-[10px]">VM Instance Count</span>
                  <span className="text-white font-bold">{instanceCount} VM(s)</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={instanceCount}
                  onChange={(e) => setInstanceCount(parseInt(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-black/40 rounded-lg appearance-none mt-1"
                />
              </div>

              {/* Slider 2: Storage Size */}
              <div>
                <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                  <span className="text-gray-500 uppercase tracking-wider text-[10px]">SSD Disk Volume</span>
                  <span className="text-white font-bold">{diskStorageGb} GB / VM</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="10"
                  value={diskStorageGb}
                  onChange={(e) => setDiskStorageGb(parseInt(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-black/40 rounded-lg appearance-none mt-1"
                />
              </div>

              {/* Slider 3: Network Data Egress */}
              <div>
                <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                  <span className="text-gray-500 uppercase tracking-wider text-[10px]">Net Outbound Egress</span>
                  <span className="text-white font-bold">{dataTransferGb} GB / month</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={dataTransferGb}
                  onChange={(e) => setDataTransferGb(parseInt(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer h-1.5 bg-black/40 rounded-lg appearance-none mt-1"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 text-[10px] text-gray-500 leading-relaxed font-sans">
            <HelpCircle className="w-3.5 h-3.5 inline mr-1 text-blue-400/80 align-text-bottom" />
            Varying sliders scales both systems proportionally using corresponding provider billing parameters.
          </div>
        </div>

        {/* Side-by-Side Cost Comparison Displays */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Provider A Cost breakdown */}
          <div className="bg-[#0D0F14] border border-white/10 rounded-xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-4">
                <span className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider">{dataA.providerName}</span>
                <span className="text-[10px] text-blue-400 font-mono font-bold uppercase">Side A</span>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">Compute Host Class Monthly</span>
                  <div className="text-lg font-bold text-white font-mono mt-0.5">
                    ${computeCostA.toFixed(2)}
                    <span className="text-gray-500 text-xs font-normal"> ({currentInstanceA?.type})</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">SSD Storage Monthly</span>
                  <div className="text-lg font-bold text-white font-mono mt-0.5">
                    ${storageCostA.toFixed(2)}
                    <span className="text-gray-500 text-xs font-normal"> (${dataA.storageCostGb.toFixed(2)}/GB)</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">Data Outbound Network Monthly</span>
                  <div className="text-lg font-bold text-white font-mono mt-0.5">
                    ${networkCostA.toFixed(2)}
                    <span className="text-gray-500 text-xs font-normal"> (${dataA.dataTransferCostGb.toFixed(2)}/GB)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono block">Aggregate Monthly Estimate</span>
              <div className="flex items-baseline gap-1 mt-1">
                <DollarSign className="w-5 h-5 text-gray-400" />
                <span className={`text-3xl font-extrabold tracking-tight ${getCheaperClass(totalCostA, totalCostB, 'A')}`}>
                  {totalCostA.toFixed(2)}
                </span>
                <span className="text-gray-500 text-xs font-mono">/mo</span>
                {getCheaperBadge(totalCostA, totalCostB, 'A')}
              </div>
              <div className="text-[10px] text-gray-500 font-mono mt-1 uppercase tracking-wider">
                Annual estimate: ${(totalCostA * 12).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Provider B Cost breakdown */}
          <div className="bg-[#0D0F14] border border-white/10 rounded-xl p-5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-4">
                <span className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider">{dataB.providerName}</span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase">Side B</span>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">Compute Host Class Monthly</span>
                  <div className="text-lg font-bold text-white font-mono mt-0.5">
                    ${computeCostB.toFixed(2)}
                    <span className="text-gray-500 text-xs font-normal"> ({currentInstanceB?.type})</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">SSD Storage Monthly</span>
                  <div className="text-lg font-bold text-white font-mono mt-0.5">
                    ${storageCostB.toFixed(2)}
                    <span className="text-gray-500 text-xs font-normal"> (${dataB.storageCostGb.toFixed(2)}/GB)</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">Data Outbound Network Monthly</span>
                  <div className="text-lg font-bold text-white font-mono mt-0.5">
                    ${networkCostB.toFixed(2)}
                    <span className="text-gray-500 text-xs font-normal"> (${dataB.dataTransferCostGb.toFixed(2)}/GB)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono block">Aggregate Monthly Estimate</span>
              <div className="flex items-baseline gap-1 mt-1">
                <DollarSign className="w-5 h-5 text-gray-400" />
                <span className={`text-3xl font-extrabold tracking-tight ${getCheaperClass(totalCostA, totalCostB, 'B')}`}>
                  {totalCostB.toFixed(2)}
                </span>
                <span className="text-gray-500 text-xs font-mono">/mo</span>
                {getCheaperBadge(totalCostA, totalCostB, 'B')}
              </div>
              <div className="text-[10px] text-gray-500 font-mono mt-1 uppercase tracking-wider">
                Annual estimate: ${(totalCostB * 12).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cost Delta Analysis callout */}
      {totalCostA !== totalCostB && (
        <div className="bg-[#0D0F14] border border-white/10 rounded-xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Coins className="w-5 h-5 text-green-400 shrink-0" />
            <div className="text-xs leading-relaxed font-sans text-gray-300">
              Platform <strong className="text-white">{totalCostA < totalCostB ? dataA.providerName : dataB.providerName}</strong> is currently estimated to be{' '}
              <strong className="text-green-400">${Math.abs(totalCostA - totalCostB).toFixed(2)}/month</strong> cheaper for this specific usage criteria.
              <span className="block text-[11px] text-gray-500 mt-0.5">This represents a total annualized multi-cloud delta of <strong>${(Math.abs(totalCostA - totalCostB) * 12).toFixed(2)}/year</strong>.</span>
            </div>
          </div>
          <div className="text-xs font-mono font-bold bg-green-500/10 border border-green-400/20 text-green-400 px-3 py-1.5 rounded uppercase tracking-wider">
            Savings potential: {((Math.abs(totalCostA - totalCostB) / Math.max(totalCostA, totalCostB)) * 100).toFixed(0)}%
          </div>
        </div>
      )}

      {/* Side-by-Side Infrastructure Specification Grid */}
      <div className="bg-[#0D0F14] border border-white/10 rounded-xl p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-6 pb-3 border-b border-white/5">
          <span className="p-1 rounded bg-blue-900/40 text-blue-400 border border-blue-800">
            <Layers className="w-4 h-4" />
          </span>
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
            Infrastructure Requirements Specification Matrix
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-white/5 -ml-px"></div>

          {/* Left Column A Specs */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-1.5 border-b border-white/5">
              <div className="w-1.5 h-3 bg-blue-500 rounded-sm"></div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">{dataA.providerName} Specification</span>
            </div>

            <div className="space-y-4 text-xs">
              {/* Virtual Server */}
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500 font-mono uppercase text-[9px] font-bold">Virtual Compute</span>
                <span className="col-span-2 text-gray-300 font-sans leading-relaxed">
                  <Cpu className="w-3.5 h-3.5 inline mr-1 text-blue-400" />
                  <strong>{specA.computeService}</strong>
                  <span className="block text-[11px] text-gray-500 mt-0.5">Instance: {currentInstanceA?.type} ({currentInstanceA?.vcpu} vCPU, {currentInstanceA?.ram} RAM)</span>
                </span>
              </div>

              {/* Volume Storage */}
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500 font-mono uppercase text-[9px] font-bold">Volume Disk Storage</span>
                <span className="col-span-2 text-gray-300 font-sans leading-relaxed">
                  <HardDrive className="w-3.5 h-3.5 inline mr-1 text-blue-400" />
                  <strong>{specA.storageService}</strong>
                  <span className="block text-[11px] text-gray-500 mt-0.5">Type: Solid State Disk with GP3 IOPS optimization</span>
                </span>
              </div>

              {/* Virtual Network */}
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500 font-mono uppercase text-[9px] font-bold">VPC Network Topology</span>
                <span className="col-span-2 text-gray-300 font-sans leading-relaxed">
                  <Globe className="w-3.5 h-3.5 inline mr-1 text-blue-400" />
                  <strong>{specA.vpcName}</strong>
                  <span className="block text-[11px] text-gray-500 mt-1">{specA.netDetails}</span>
                </span>
              </div>

              {/* Network Protection */}
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500 font-mono uppercase text-[9px] font-bold">Firewall Policies</span>
                <span className="col-span-2 text-gray-300 font-sans leading-relaxed">
                  <Lock className="w-3.5 h-3.5 inline mr-1 text-blue-400" />
                  <strong>{specA.securityName}</strong>
                  <span className="block text-[11px] text-gray-500 mt-1">{specA.secDetails}</span>
                </span>
              </div>

              {/* Identity access */}
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500 font-mono uppercase text-[9px] font-bold">Identity & OIDC Auth</span>
                <span className="col-span-2 text-gray-300 font-sans leading-relaxed">
                  <UserCheck className="w-3.5 h-3.5 inline mr-1 text-blue-400" />
                  <strong>{specA.iamName}</strong>
                  <span className="block text-[10px] text-gray-500 font-semibold mt-1 uppercase font-mono">{specA.oidcName}</span>
                  <span className="block text-[11px] text-gray-500 mt-1">{specA.iamDetails}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Column B Specs */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-1.5 border-b border-white/5">
              <div className="w-1.5 h-3 bg-emerald-500 rounded-sm"></div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">{dataB.providerName} Specification</span>
            </div>

            <div className="space-y-4 text-xs">
              {/* Virtual Server */}
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500 font-mono uppercase text-[9px] font-bold">Virtual Compute</span>
                <span className="col-span-2 text-gray-300 font-sans leading-relaxed">
                  <Cpu className="w-3.5 h-3.5 inline mr-1 text-emerald-400" />
                  <strong>{specB.computeService}</strong>
                  <span className="block text-[11px] text-gray-500 mt-0.5">Instance: {currentInstanceB?.type} ({currentInstanceB?.vcpu} vCPU, {currentInstanceB?.ram} RAM)</span>
                </span>
              </div>

              {/* Volume Storage */}
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500 font-mono uppercase text-[9px] font-bold">Volume Disk Storage</span>
                <span className="col-span-2 text-gray-300 font-sans leading-relaxed">
                  <HardDrive className="w-3.5 h-3.5 inline mr-1 text-emerald-400" />
                  <strong>{specB.storageService}</strong>
                  <span className="block text-[11px] text-gray-500 mt-0.5">Type: Solid State Disk with GP3 IOPS optimization</span>
                </span>
              </div>

              {/* Virtual Network */}
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500 font-mono uppercase text-[9px] font-bold">VPC Network Topology</span>
                <span className="col-span-2 text-gray-300 font-sans leading-relaxed">
                  <Globe className="w-3.5 h-3.5 inline mr-1 text-emerald-400" />
                  <strong>{specB.vpcName}</strong>
                  <span className="block text-[11px] text-gray-500 mt-1">{specB.netDetails}</span>
                </span>
              </div>

              {/* Network Protection */}
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500 font-mono uppercase text-[9px] font-bold">Firewall Policies</span>
                <span className="col-span-2 text-gray-300 font-sans leading-relaxed">
                  <Lock className="w-3.5 h-3.5 inline mr-1 text-emerald-400" />
                  <strong>{specB.securityName}</strong>
                  <span className="block text-[11px] text-gray-500 mt-1">{specB.secDetails}</span>
                </span>
              </div>

              {/* Identity access */}
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500 font-mono uppercase text-[9px] font-bold">Identity & OIDC Auth</span>
                <span className="col-span-2 text-gray-300 font-sans leading-relaxed">
                  <UserCheck className="w-3.5 h-3.5 inline mr-1 text-emerald-400" />
                  <strong>{specB.iamName}</strong>
                  <span className="block text-[10px] text-gray-500 font-semibold mt-1 uppercase font-mono">{specB.oidcName}</span>
                  <span className="block text-[11px] text-gray-500 mt-1">{specB.iamDetails}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Terraform IaC Comparative Explorer */}
      <div className="bg-[#0D0F14] border border-white/10 rounded-xl overflow-hidden shadow-xl">
        <div className="flex border-b border-white/5 bg-black/40 px-4 pt-3 gap-2 justify-between items-center">
          <div className="flex gap-2">
            {(['main', 'variables', 'iam', 'outputs'] as const).map((sec) => (
              <button
                key={sec}
                onClick={() => setActiveCodeSection(sec)}
                className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all duration-150 border-t border-x ${
                  activeCodeSection === sec
                    ? 'bg-[#0D0F14] border-white/10 text-white font-bold'
                    : 'bg-transparent border-transparent text-gray-400 hover:text-white'
                }`}
              >
                {sec === 'main' && 'main.tf (Primary)'}
                {sec === 'variables' && 'variables.tf'}
                {sec === 'iam' && 'Identity & OIDC'}
                {sec === 'outputs' && 'outputs.tf'}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider pr-4 hidden sm:inline">
            Terraform IaC Side-by-Side Compare
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[400px] divide-y md:divide-y-0 md:divide-x divide-white/5">
          {/* Code block for side A */}
          <div className="flex flex-col bg-[#0D0F14]">
            <div className="flex justify-between items-center px-4 py-2 bg-black/20 border-b border-white/5">
              <div className="flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[11px] font-mono text-gray-300 font-bold">{getCodeFileName(providerA, activeCodeSection)} ({providerA.toUpperCase()})</span>
              </div>
              <button
                onClick={() => handleCopy('A', codeA)}
                className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-white bg-white/5 px-2.5 py-1 rounded border border-white/10 transition active:scale-95 cursor-pointer"
              >
                {copiedA ? (
                  <>
                    <Check className="w-3 h-3 text-green-400" />
                    <span className="text-green-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="flex-1 overflow-auto max-h-[400px] p-4 font-mono text-xs text-gray-300 leading-relaxed bg-black/40">
              <pre className="whitespace-pre">
                <code>{codeA}</code>
              </pre>
            </div>
          </div>

          {/* Code block for side B */}
          <div className="flex flex-col bg-[#0D0F14]">
            <div className="flex justify-between items-center px-4 py-2 bg-black/20 border-b border-white/5">
              <div className="flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-mono text-gray-300 font-bold">{getCodeFileName(providerB, activeCodeSection)} ({providerB.toUpperCase()})</span>
              </div>
              <button
                onClick={() => handleCopy('B', codeB)}
                className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-white bg-white/5 px-2.5 py-1 rounded border border-white/10 transition active:scale-95 cursor-pointer"
              >
                {copiedB ? (
                  <>
                    <Check className="w-3 h-3 text-green-400" />
                    <span className="text-green-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="flex-1 overflow-auto max-h-[400px] p-4 font-mono text-xs text-gray-300 leading-relaxed bg-black/40">
              <pre className="whitespace-pre">
                <code>{codeB}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
