import React, { useState } from 'react';
import { CloudProvider } from '../types';
import { ArrowRight, ShieldCheck, Database, Server, GitBranch, Terminal, Globe, HelpCircle } from 'lucide-react';

interface ArchitectureDiagramProps {
  provider: CloudProvider;
  onSelectComponent: (componentId: string) => void;
  selectedComponentId: string;
}

export default function ArchitectureDiagram({
  provider,
  onSelectComponent,
  selectedComponentId,
}: ArchitectureDiagramProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Define components for inspection
  const components = {
    github: {
      title: 'GitHub Repository & Git Trigger',
      desc: 'Developer pushes code to the main branch of the repository, triggering the GitHub Actions CI/CD pipeline workflow.',
      tf: 'No direct Terraform (Managed by Git). Integrated via OIDC connection.',
      security: 'Enforce branch protection rules and require signed commits.'
    },
    gha: {
      title: 'GitHub Actions Runner & OIDC Auth',
      desc: 'Container runs tests and authenticates securely with the cloud provider using temporary credentials via OpenID Connect (OIDC). No long-lived passwords stored.',
      tf: provider === 'aws' ? 'aws_iam_openid_connect_provider' : provider === 'gcp' ? 'google_iam_workload_identity_pool' : 'azurerm_federated_identity_credential',
      security: 'Use Workload Identity (OIDC) instead of static service account keys or AWS Access Keys.'
    },
    igw: {
      title: 'Internet Gateway / Public Endpoint',
      desc: 'Routes public traffic from external clients on port 80/443 to the VPC and VM Public IP address.',
      tf: provider === 'aws' ? 'aws_internet_gateway' : provider === 'gcp' ? 'google_compute_address (Static IP)' : 'azurerm_public_ip',
      security: 'Disable direct administrative access from the public internet. Use Load Balancers or secure bastions.'
    },
    vpc: {
      title: provider === 'aws' ? 'Amazon VPC' : provider === 'gcp' ? 'Google Cloud VPC' : 'Azure Virtual Network',
      desc: 'Isolated, virtual network environment with a custom CIDR (10.0.0.0/16) and subnets, separating development workloads from other assets.',
      tf: provider === 'aws' ? 'aws_vpc & aws_subnet' : provider === 'gcp' ? 'google_compute_network & google_compute_subnetwork' : 'azurerm_virtual_network & azurerm_subnet',
      security: 'Do not use default VPCs or subnet auto-creation. Plan strict non-overlapping CIDR configurations.'
    },
    sg: {
      title: provider === 'aws' ? 'AWS Security Group' : provider === 'gcp' ? 'GCP Firewall Rule' : 'Azure Network Security Group (NSG)',
      desc: 'Stateful virtual firewall that controls inbound and outbound traffic. Constrains HTTP (80) and HTTPS (443) globally, and restricts SSH (22).',
      tf: provider === 'aws' ? 'aws_security_group' : provider === 'gcp' ? 'google_compute_firewall' : 'azurerm_network_security_group',
      security: 'Never open SSH Port 22 to 0.0.0.0/0. Restrict to administration IPs or route through secure Bastion/SSM tunnels.'
    },
    vm: {
      title: provider === 'aws' ? 'EC2 Virtual Machine' : provider === 'gcp' ? 'Compute Engine VM' : 'Azure Linux VM',
      desc: 'Sized virtual machine running Linux OS, hosting our Node.js app. Utilizes PM2 for process persistence and Nginx for port-80 routing.',
      tf: provider === 'aws' ? 'aws_instance' : provider === 'gcp' ? 'google_compute_instance' : 'azurerm_linux_virtual_machine',
      security: 'Regularly patch OS kernel. Run application inside non-root container or restricted service user context.'
    },
    iam: {
      title: provider === 'aws' ? 'IAM Instance Profile' : provider === 'gcp' ? 'Service Account' : 'User Managed Identity',
      desc: 'Attaches a secure IAM identity to the VM instance, authorizing the code to query secrets or services securely without embedded passwords.',
      tf: provider === 'aws' ? 'aws_iam_role & aws_iam_instance_profile' : provider === 'gcp' ? 'google_service_account' : 'azurerm_user_assigned_identity',
      security: 'Avoid broad admin permissions. Grant least privilege policies (e.g. SecretAccessor, ParameterStoreRead).'
    }
  };

  const activeId = selectedComponentId || hoveredId || 'github';
  const activeComponent = components[activeId as keyof typeof components];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="architecture-section">
      {/* SVG Diagram Canvas */}
      <div className="lg:col-span-2 bg-white border border-rosegold-200/60 rounded-xl p-6 relative overflow-hidden flex flex-col justify-between shadow-sm">
        <div className="flex justify-between items-center mb-4 z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
            <span className="text-xs text-slate-800 font-bold font-sans uppercase tracking-widest">
              {provider.toUpperCase()} Interactive IaC Topology
            </span>
          </div>
          <p className="text-xs text-slate-500 font-sans font-medium">
            Hover or click components to inspect security policies
          </p>
        </div>
 
        {/* Interactive SVG Diagram */}
        <div className="w-full flex justify-center items-center py-4 bg-rosegold-50/10 rounded-lg border border-rosegold-100">
          <svg viewBox="0 0 800 480" className="w-full max-w-2xl h-auto select-none" xmlns="http://www.w3.org/2000/svg">
            {/* DEF - Patterns, gradients, arrows */}
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#85444E" />
              </marker>
              <marker id="arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#3b82f6" />
              </marker>
              <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
              </marker>
              <linearGradient id="roseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#B76E79" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#F5E1DE" stopOpacity="0.02" />
              </linearGradient>
            </defs>
 
            {/* FLOW LINES & CONNECTORS */}
            {/* GitHub -> GHA Actions Runner */}
            <path d="M 120 120 L 220 120" stroke="#CC8E87" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
            
            {/* GHA Runner -> OIDC auth exchange */}
            <path d="M 280 160 L 280 250" stroke="#3b82f6" strokeWidth="2" strokeDasharray="3 3" markerEnd="url(#arrow-blue)" />
            <path d="M 280 250 L 510 375" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arrow-blue)" />
            
            {/* Internet Request -> IGW / Static IP */}
            <path d="M 100 375 L 340 375" stroke="#10b981" strokeWidth="2" strokeDasharray="2 2" markerEnd="url(#arrow-green)" />
            
            {/* IGW -> SG / Firewall */}
            <path d="M 380 375 L 470 375" stroke="#10b981" strokeWidth="2" markerEnd="url(#arrow-green)" />
            
            {/* SG / Firewall -> VM Subnet Inbound */}
            <path d="M 530 375 L 590 375" stroke="#10b981" strokeWidth="2.5" markerEnd="url(#arrow-green)" />
 
            {/* 1. DEVELOPER GIT PUSH */}
            <g 
              className="cursor-pointer transition-all duration-200" 
              onClick={() => onSelectComponent('github')}
              onMouseEnter={() => setHoveredId('github')}
              onMouseLeave={() => setHoveredId(null)}
            >
              <rect x="20" y="80" width="100" height="80" rx="12" 
                fill={activeId === 'github' ? '#FAF1F0' : '#FFFFFF'} 
                stroke={activeId === 'github' ? '#B76E79' : '#ECD2CF'} 
                strokeWidth={activeId === 'github' ? '2' : '1'} 
              />
              <circle cx="70" cy="115" r="16" fill="#F5E1DE" />
              <path d="M 70 105 L 70 125 M 65 110 L 70 105 L 75 110" stroke="#B76E79" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <text x="70" y="152" fill="#6B353E" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Git Repository</text>
            </g>
 
            {/* 2. GITHUB ACTIONS CI/CD RUNNER */}
            <g 
              className="cursor-pointer transition-all duration-200"
              onClick={() => onSelectComponent('gha')}
              onMouseEnter={() => setHoveredId('gha')}
              onMouseLeave={() => setHoveredId(null)}
            >
              <rect x="220" y="80" width="120" height="80" rx="12" 
                fill={activeId === 'gha' ? '#F0F9FF' : '#FFFFFF'} 
                stroke={activeId === 'gha' ? '#00acdf' : '#ECD2CF'} 
                strokeWidth={activeId === 'gha' ? '2' : '1'} 
              />
              <circle cx="280" cy="115" r="16" fill="#E0F2FE" />
              <path d="M 273 111 C 273 111 278 108 281 112 C 284 116 287 112 287 112 M 274 120 L 286 120" stroke="#00acdf" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <text x="280" y="152" fill="#0369a1" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">CI/CD Pipeline</text>
            </g>
 
            {/* 3. PUBLIC ENDPOINT / PUBLIC IP */}
            <g 
              className="cursor-pointer transition-all duration-200"
              onClick={() => onSelectComponent('igw')}
              onMouseEnter={() => setHoveredId('igw')}
              onMouseLeave={() => setHoveredId(null)}
            >
              <circle cx="360" cy="375" r="24" 
                fill={activeId === 'igw' ? '#ECFDF5' : '#FFFFFF'} 
                stroke={activeId === 'igw' ? '#10b981' : '#ECD2CF'} 
                strokeWidth={activeId === 'igw' ? '2' : '1'} 
              />
              <path d="M 353 371 A 10 10 0 0 1 367 371 A 10 10 0 0 1 367 379 A 10 10 0 0 1 353 379 Z M 360 365 L 360 385 M 350 375 L 370 375" stroke="#10b981" strokeWidth="2" fill="none" />
              <text x="360" y="415" fill="#047857" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Internet Gateway</text>
            </g>
            
            {/* EXTERNAL INGRESS LABEL */}
            <g>
              <rect x="20" y="355" width="80" height="35" rx="6" fill="#ECFDF5" stroke="#10b981" strokeWidth="1" />
              <text x="60" y="371" fill="#065f46" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Client HTTP</text>
              <text x="60" y="382" fill="#047857" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Port 80/443</text>
            </g>
 
            {/* 4. VPC LOGICAL BOUNDARY BOX */}
            <g 
              className="cursor-pointer transition-all duration-200"
              onClick={() => onSelectComponent('vpc')}
              onMouseEnter={() => setHoveredId('vpc')}
              onMouseLeave={() => setHoveredId(null)}
            >
              <rect x="420" y="220" width="350" height="230" rx="16" 
                fill="url(#roseGrad)" 
                stroke={activeId === 'vpc' ? '#B76E79' : '#CC8E87'} 
                strokeWidth={activeId === 'vpc' ? '2' : '1'} 
                strokeDasharray={activeId === 'vpc' ? 'none' : '5 5'} 
              />
              <text x="435" y="242" fill="#B76E79" fontSize="11" fontWeight="bold" fontFamily="monospace">
                {provider === 'aws' ? 'AWS VPC' : provider === 'gcp' ? 'GCP VPC Network' : 'Azure VNet'} (10.0.0.0/16)
              </text>
            </g>
 
            {/* PUBLIC SUBNET BOUNDARY BOX */}
            <rect x="440" y="260" width="310" height="170" rx="12" fill="#FFFFFF" stroke="#ECD2CF" strokeWidth="1.5" />
            <text x="450" y="278" fill="#85444E" fontSize="9" fontWeight="bold" fontFamily="monospace">Public Subnet (10.0.1.0/24)</text>
 
            {/* 5. SECURITY GROUP / FIREWALL LIMITS */}
            <g 
              className="cursor-pointer transition-all duration-200"
              onClick={() => onSelectComponent('sg')}
              onMouseEnter={() => setHoveredId('sg')}
              onMouseLeave={() => setHoveredId(null)}
            >
              <rect x="470" y="320" width="60" height="90" rx="10" 
                fill={activeId === 'sg' ? '#FAF1F0' : '#FFFFFF'} 
                stroke={activeId === 'sg' ? '#B76E79' : '#ECD2CF'} 
                strokeWidth={activeId === 'sg' ? '2' : '1'} 
              />
              <path d="M 500 345 L 488 351 L 488 362 C 488 371 494 378 500 381 C 506 378 512 371 512 362 L 512 351 Z" fill="#B76E79" />
              <text x="500" y="398" fill="#85444E" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Firewall</text>
            </g>
 
            {/* 6. VIRTUAL MACHINE HOST */}
            <g 
              className="cursor-pointer transition-all duration-200"
              onClick={() => onSelectComponent('vm')}
              onMouseEnter={() => setHoveredId('vm')}
              onMouseLeave={() => setHoveredId(null)}
            >
              <rect x="590" y="290" width="130" height="120" rx="12" 
                fill={activeId === 'vm' ? '#FCFBF9' : '#FFFFFF'} 
                stroke={activeId === 'vm' ? '#B76E79' : '#ECD2CF'} 
                strokeWidth={activeId === 'vm' ? '2' : '1'} 
              />
              <rect x="600" y="300" width="110" height="50" rx="6" fill="#FDF8F7" stroke="#ECD2CF" />
              <text x="655" y="318" fill="#10b981" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Node.js Server</text>
              <text x="655" y="335" fill="#85444E" fontSize="8" textAnchor="middle" fontFamily="monospace">Port 80 (PM2)</text>
              
              {/* Little server drives visual representation */}
              <circle cx="615" cy="385" r="4" fill="#B76E79" />
              <circle cx="630" cy="385" r="4" fill="#B76E79" />
              <circle cx="645" cy="385" r="4" fill="#B76E79" />
              <text x="710" y="390" fill="#6B353E" fontSize="11" fontWeight="bold" textAnchor="end" fontFamily="monospace">VM Instance</text>
            </g>
 
            {/* 7. IAM IDENTITY PROFILE */}
            <g 
              className="cursor-pointer transition-all duration-200"
              onClick={() => onSelectComponent('iam')}
              onMouseEnter={() => setHoveredId('iam')}
              onMouseLeave={() => setHoveredId(null)}
            >
              <rect x="510" y="110" width="160" height="40" rx="8" 
                fill={activeId === 'iam' ? '#FAF1F0' : '#ECFDF5'} 
                stroke={activeId === 'iam' ? '#B76E79' : '#059669'} 
                strokeWidth={activeId === 'iam' ? '2' : '1'} 
              />
              <path d="M 525 130 C 525 124 535 124 535 130 M 530 120 C 533 120 533 125 530 125" stroke="#10b981" strokeWidth="1.5" fill="none" />
              <text x="542" y="134" fill="#047857" fontSize="9" fontWeight="bold" fontFamily="monospace">
                {provider === 'aws' ? 'IAM Instance Role' : provider === 'gcp' ? 'IAM Service Acct' : 'Managed Identity'}
              </text>
              {/* Dynamic connector line from IAM directly down to VM */}
              <path d="M 590 150 L 590 280" stroke="#059669" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arrow)" />
            </g>
          </svg>
        </div>
 
        {/* Selected Component Brief */}
        <div className="mt-4 pt-4 border-t border-rosegold-100 flex justify-between items-center text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Interactive Guide: Click any node to load code variables & rules.</span>
          </div>
          <div className="text-slate-400 font-mono text-[10px] font-semibold">
            Topology version: 1.0.2-Terraform
          </div>
        </div>
      </div>
 
      {/* Inspector Details Sidebar */}
      <div className="bg-white border border-rosegold-200/60 rounded-xl p-5 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="p-1 rounded bg-rosegold-50 text-rosegold-600 border border-rosegold-200">
              <Terminal className="w-4 h-4" />
            </span>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              Infrastructure Inspector
            </h3>
          </div>
 
          <div className="bg-rosegold-50/20 p-4 rounded-lg border border-rosegold-100 mb-4 min-h-[160px] flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest font-mono mb-1">
                {activeComponent.title}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-sans font-medium">
                {activeComponent.desc}
              </p>
            </div>
            
            <div className="mt-3 pt-3 border-t border-rosegold-100">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono font-bold">
                Terraform Resource Type
              </span>
              <span className="text-xs font-semibold text-rosegold-600 font-mono break-all">
                {activeComponent.tf}
              </span>
            </div>
          </div>
 
          <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2 text-emerald-600">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider">
                Security Policy Check
              </h4>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed font-medium">
              {activeComponent.security}
            </p>
          </div>
        </div>
 
        <div className="mt-4 pt-4 border-t border-rosegold-100 text-xs text-gray-500">
          <div className="flex justify-between items-center bg-rosegold-50/30 p-2.5 rounded border border-rosegold-100">
            <span className="font-mono text-[10px] uppercase font-bold text-slate-400">Default Status</span>
            <span className="text-emerald-600 font-bold font-mono">SECURED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
