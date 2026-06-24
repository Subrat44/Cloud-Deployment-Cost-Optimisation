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
      <div className="lg:col-span-2 bg-[#0D0F14] border border-white/10 rounded-xl p-6 relative overflow-hidden flex flex-col justify-between shadow-xl">
        <div className="flex justify-between items-center mb-4 z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]"></span>
            <span className="text-xs text-white font-medium font-sans uppercase tracking-widest">
              {provider.toUpperCase()} Interactive IaC Topology
            </span>
          </div>
          <p className="text-xs text-gray-500 font-sans">
            Hover or click components to inspect security policies
          </p>
        </div>

        {/* Interactive SVG Diagram */}
        <div className="w-full flex justify-center items-center py-4 bg-black/40 rounded-lg border border-white/5">
          <svg viewBox="0 0 800 480" className="w-full max-w-2xl h-auto select-none" xmlns="http://www.w3.org/2000/svg">
            {/* DEF - Patterns, gradients, arrows */}
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#4b5563" />
              </marker>
              <marker id="arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#60a5fa" />
              </marker>
              <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#4ade80" />
              </marker>
              <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* FLOW LINES & CONNECTORS */}
            {/* GitHub -> GHA Actions Runner */}
            <path d="M 120 120 L 220 120" stroke="#374151" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" />
            
            {/* GHA Runner -> OIDC auth exchange */}
            <path d="M 280 160 L 280 250" stroke="#60a5fa" strokeWidth="2" strokeDasharray="3 3" markerEnd="url(#arrow-blue)" />
            <path d="M 280 250 L 510 375" stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arrow-blue)" />
            
            {/* Internet Request -> IGW / Static IP */}
            <path d="M 100 375 L 340 375" stroke="#4ade80" strokeWidth="2" strokeDasharray="2 2" markerEnd="url(#arrow-green)" />
            
            {/* IGW -> SG / Firewall */}
            <path d="M 380 375 L 470 375" stroke="#4ade80" strokeWidth="2" markerEnd="url(#arrow-green)" />
            
            {/* SG / Firewall -> VM Subnet Inbound */}
            <path d="M 530 375 L 590 375" stroke="#4ade80" strokeWidth="2.5" markerEnd="url(#arrow-green)" />

            {/* 1. DEVELOPER GIT PUSH */}
            <g 
              className="cursor-pointer transition-all duration-200" 
              onClick={() => onSelectComponent('github')}
              onMouseEnter={() => setHoveredId('github')}
              onMouseLeave={() => setHoveredId(null)}
            >
              <rect x="20" y="80" width="100" height="80" rx="12" 
                fill={activeId === 'github' ? '#0F1117' : '#0A0B0E'} 
                stroke={activeId === 'github' ? '#60a5fa' : '#1f2937'} 
                strokeWidth={activeId === 'github' ? '2' : '1'} 
              />
              <circle cx="70" cy="115" r="16" fill="#1e1b4b" />
              <path d="M 70 105 L 70 125 M 65 110 L 70 105 L 75 110" stroke="#818cf8" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <text x="70" y="152" fill="#9ca3af" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Git Repository</text>
            </g>

            {/* 2. GITHUB ACTIONS CI/CD RUNNER */}
            <g 
              className="cursor-pointer transition-all duration-200"
              onClick={() => onSelectComponent('gha')}
              onMouseEnter={() => setHoveredId('gha')}
              onMouseLeave={() => setHoveredId(null)}
            >
              <rect x="220" y="80" width="120" height="80" rx="12" 
                fill={activeId === 'gha' ? '#0F1117' : '#0A0B0E'} 
                stroke={activeId === 'gha' ? '#60a5fa' : '#1f2937'} 
                strokeWidth={activeId === 'gha' ? '2' : '1'} 
              />
              <circle cx="280" cy="115" r="16" fill="#062f4f" />
              <path d="M 273 111 C 273 111 278 108 281 112 C 284 116 287 112 287 112 M 274 120 L 286 120" stroke="#00acdf" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <text x="280" y="152" fill="#9ca3af" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">CI/CD Pipeline</text>
            </g>

            {/* 3. PUBLIC ENDPOINT / PUBLIC IP */}
            <g 
              className="cursor-pointer transition-all duration-200"
              onClick={() => onSelectComponent('igw')}
              onMouseEnter={() => setHoveredId('igw')}
              onMouseLeave={() => setHoveredId(null)}
            >
              <circle cx="360" cy="375" r="24" 
                fill={activeId === 'igw' ? '#0F1117' : '#0A0B0E'} 
                stroke={activeId === 'igw' ? '#60a5fa' : '#1f2937'} 
                strokeWidth={activeId === 'igw' ? '2' : '1'} 
              />
              <path d="M 353 371 A 10 10 0 0 1 367 371 A 10 10 0 0 1 367 379 A 10 10 0 0 1 353 379 Z M 360 365 L 360 385 M 350 375 L 370 375" stroke="#4ade80" strokeWidth="2" fill="none" />
              <text x="360" y="415" fill="#9ca3af" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Internet Gateway</text>
            </g>
            
            {/* EXTERNAL INGRESS LABEL */}
            <g>
              <rect x="20" y="355" width="80" height="35" rx="6" fill="#042f2e" stroke="#0d9488" strokeWidth="1" />
              <text x="60" y="371" fill="#2dd4bf" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Client HTTP</text>
              <text x="60" y="382" fill="#0d9488" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Port 80/443</text>
            </g>

            {/* 4. VPC LOGICAL BOUNDARY BOX */}
            <g 
              className="cursor-pointer transition-all duration-200"
              onClick={() => onSelectComponent('vpc')}
              onMouseEnter={() => setHoveredId('vpc')}
              onMouseLeave={() => setHoveredId(null)}
            >
              <rect x="420" y="220" width="350" height="230" rx="16" 
                fill="url(#blueGrad)" 
                stroke={activeId === 'vpc' ? '#60a5fa' : '#1e40af'} 
                strokeWidth={activeId === 'vpc' ? '2' : '1'} 
                strokeDasharray={activeId === 'vpc' ? 'none' : '5 5'} 
              />
              <text x="435" y="242" fill="#60a5fa" fontSize="11" fontWeight="bold" fontFamily="monospace">
                {provider === 'aws' ? 'AWS VPC' : provider === 'gcp' ? 'GCP VPC Network' : 'Azure VNet'} (10.0.0.0/16)
              </text>
            </g>

            {/* PUBLIC SUBNET BOUNDARY BOX */}
            <rect x="440" y="260" width="310" height="170" rx="12" fill="#0A0B0E" stroke="#1f2937" strokeWidth="1.5" />
            <text x="450" y="278" fill="#6b7280" fontSize="9" fontWeight="bold" fontFamily="monospace">Public Subnet (10.0.1.0/24)</text>

            {/* 5. SECURITY GROUP / FIREWALL LIMITS */}
            <g 
              className="cursor-pointer transition-all duration-200"
              onClick={() => onSelectComponent('sg')}
              onMouseEnter={() => setHoveredId('sg')}
              onMouseLeave={() => setHoveredId(null)}
            >
              <rect x="470" y="320" width="60" height="90" rx="10" 
                fill={activeId === 'sg' ? '#1e1b4b' : '#0F1117'} 
                stroke={activeId === 'sg' ? '#60a5fa' : '#312e81'} 
                strokeWidth={activeId === 'sg' ? '2' : '1'} 
              />
              <path d="M 500 345 L 488 351 L 488 362 C 488 371 494 378 500 381 C 506 378 512 371 512 362 L 512 351 Z" fill="#818cf8" />
              <text x="500" y="398" fill="#c7d2fe" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Firewall</text>
            </g>

            {/* 6. VIRTUAL MACHINE HOST */}
            <g 
              className="cursor-pointer transition-all duration-200"
              onClick={() => onSelectComponent('vm')}
              onMouseEnter={() => setHoveredId('vm')}
              onMouseLeave={() => setHoveredId(null)}
            >
              <rect x="590" y="290" width="130" height="120" rx="12" 
                fill={activeId === 'vm' ? '#0F1117' : '#0A0B0E'} 
                stroke={activeId === 'vm' ? '#60a5fa' : '#1f2937'} 
                strokeWidth={activeId === 'vm' ? '2' : '1'} 
              />
              <rect x="600" y="300" width="110" height="50" rx="6" fill="#0A0B0E" stroke="#1f2937" />
              <text x="655" y="318" fill="#4ade80" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Node.js Server</text>
              <text x="655" y="335" fill="#4b5563" fontSize="8" textAnchor="middle" fontFamily="monospace">Port 80 (PM2)</text>
              
              {/* Little server drives visual representation */}
              <circle cx="615" cy="385" r="4" fill="#3b82f6" />
              <circle cx="630" cy="385" r="4" fill="#3b82f6" />
              <circle cx="645" cy="385" r="4" fill="#3b82f6" />
              <text x="710" y="390" fill="#9ca3af" fontSize="11" fontWeight="bold" textAnchor="end" fontFamily="monospace">VM Instance</text>
            </g>

            {/* 7. IAM IDENTITY PROFILE */}
            <g 
              className="cursor-pointer transition-all duration-200"
              onClick={() => onSelectComponent('iam')}
              onMouseEnter={() => setHoveredId('iam')}
              onMouseLeave={() => setHoveredId(null)}
            >
              <rect x="510" y="110" width="160" height="40" rx="8" 
                fill={activeId === 'iam' ? '#0A0B0E' : '#022c22'} 
                stroke={activeId === 'iam' ? '#60a5fa' : '#065f46'} 
                strokeWidth={activeId === 'iam' ? '2' : '1'} 
              />
              <path d="M 525 130 C 525 124 535 124 535 130 M 530 120 C 533 120 533 125 530 125" stroke="#4ade80" strokeWidth="1.5" fill="none" />
              <text x="542" y="134" fill="#4ade80" fontSize="9" fontWeight="bold" fontFamily="monospace">
                {provider === 'aws' ? 'IAM Instance Role' : provider === 'gcp' ? 'IAM Service Acct' : 'Managed Identity'}
              </text>
              {/* Dynamic connector line from IAM directly down to VM */}
              <path d="M 590 150 L 590 280" stroke="#047857" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arrow)" />
            </g>
          </svg>
        </div>

        {/* Selected Component Brief */}
        <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-xs">
          <div className="flex items-center gap-2 text-gray-400">
            <ShieldCheck className="w-4 h-4 text-green-400" />
            <span>Interactive Guide: Click any node to load code variables & rules.</span>
          </div>
          <div className="text-gray-500 font-mono text-[10px]">
            Topology version: 1.0.2-Terraform
          </div>
        </div>
      </div>

      {/* Inspector Details Sidebar */}
      <div className="bg-[#0D0F14] border border-white/10 rounded-xl p-5 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="p-1 rounded bg-blue-900/40 text-blue-400 border border-blue-800">
              <Terminal className="w-4 h-4" />
            </span>
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
              Infrastructure Inspector
            </h3>
          </div>

          <div className="bg-black/40 p-4 rounded-lg border border-white/5 mb-4 min-h-[160px] flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-gray-300 uppercase tracking-widest font-mono mb-1">
                {activeComponent.title}
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                {activeComponent.desc}
              </p>
            </div>
            
            <div className="mt-3 pt-3 border-t border-white/5">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-mono">
                Terraform Resource Type
              </span>
              <span className="text-xs font-semibold text-blue-400 font-mono break-all">
                {activeComponent.tf}
              </span>
            </div>
          </div>

          <div className="bg-green-400/5 border border-green-400/10 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2 text-green-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider">
                Security Policy Check
              </h4>
            </div>
            <p className="text-xs text-green-500/90 leading-relaxed">
              {activeComponent.security}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/5 text-xs text-gray-400">
          <div className="flex justify-between items-center bg-black/40 p-2.5 rounded border border-white/5">
            <span className="font-mono text-[10px] uppercase">Default Status</span>
            <span className="text-green-400 font-bold font-mono">SECURED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
