import React, { useState } from 'react';
import { CloudData, CloudProvider } from '../types';
import { FileText, ClipboardList, CheckSquare, Square, Copy, Check, Download, AlertTriangle, ShieldAlert } from 'lucide-react';

interface ReadmeViewerProps {
  provider: CloudProvider;
  data: CloudData;
}

export default function ReadmeViewer({ provider, data }: ReadmeViewerProps) {
  const [copied, setCopied] = useState(false);
  const [checklist, setChecklist] = useState({
    repo: true,
    terraform: true,
    vm: false,
    gha: false,
    cost: true,
    iam: true
  });

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopyReadme = () => {
    navigator.clipboard.writeText(data.readmeMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Structured rendering sections to avoid package issues and ensure clean UI
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="readme-section">
      {/* Interactive Submission Checklist & Tools */}
      <div className="lg:col-span-1 space-y-6">
        {/* Checklist */}
        <div className="bg-[#0D0F14] border border-white/10 rounded-xl p-5 shadow-xl">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
            <span className="p-1 rounded bg-blue-900/40 text-blue-400 border border-blue-800">
              <ClipboardList className="w-4 h-4" />
            </span>
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
              Submission Checklist
            </h3>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed mb-4 font-sans">
            Track your assessment completion. Cross-reference your real GitHub repository with the criteria below:
          </p>

          <div className="space-y-3">
            {[
              { key: 'repo', label: 'Git Repository initialized' },
              { key: 'terraform', label: 'Terraform IaC files complete' },
              { key: 'iam', label: 'Least-Privilege IAM boundaries added' },
              { key: 'gha', label: 'GitHub Actions workflow OIDC configured' },
              { key: 'vm', label: 'VM deployed with public HTTP access' },
              { key: 'cost', label: 'Cost & Trade-offs README formatted' }
            ].map((item) => {
              const isChecked = checklist[item.key as keyof typeof checklist];
              return (
                <button
                  key={item.key}
                  onClick={() => toggleCheck(item.key as keyof typeof checklist)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                      : 'bg-black/40 border-white/5 text-gray-400 hover:border-white/10'
                  }`}
                >
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-blue-400 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-600 shrink-0" />
                  )}
                  <span className="text-xs font-medium font-sans">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-white/5">
            <div className="flex justify-between items-center text-xs font-mono text-gray-400 bg-black/40 p-2.5 rounded border border-white/5">
              <span>Overall Completion</span>
              <span className="text-blue-400 font-bold">
                {Math.round((Object.values(checklist).filter(Boolean).length / Object.values(checklist).length) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Security / DevOps Warnings Box */}
        <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-xl shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-amber-400">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider">DevOps Security Advisory</h4>
          </div>
          <p className="text-[11px] text-amber-500/90 leading-relaxed font-sans">
            <strong>CRITICAL ASSESSMENT ADVICE:</strong> When submitting, never commit your SSH private keys or cloud provider service account credential files to your public Git repository. 
            Assessors check for this instantly. Utilize OIDC and Workload Identity for all runner environments.
          </p>
        </div>
      </div>

      {/* Structured Document Content */}
      <div className="lg:col-span-2 bg-[#0D0F14] border border-white/10 rounded-xl overflow-hidden shadow-xl flex flex-col">
        {/* Document Header */}
        <div className="bg-black/30 border-b border-white/5 px-5 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-mono font-bold text-gray-300">README_SUBMISSION.md</span>
          </div>

          <button
            onClick={handleCopyReadme}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 transition-all active:scale-95 cursor-pointer font-sans"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-400" />
                <span className="text-green-400 font-medium">Copied README!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Raw Markdown</span>
              </>
            )}
          </button>
        </div>

        {/* Formatted Document Body */}
        <div className="p-6 overflow-y-auto max-h-[600px] text-gray-300 font-sans text-xs leading-relaxed space-y-6 bg-black/20">
          {/* Top Title Block */}
          <div className="pb-4 border-b border-white/5">
            <span className="text-[10px] text-blue-400 font-mono font-semibold uppercase tracking-widest block mb-1">
              {provider.toUpperCase()} Target Architecture
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Cloud Infrastructure Deployment Assessment Submission
            </h1>
            <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
              This document covers architectural choices, CI/CD mechanisms, and granular cost estimates compiling the complete deliverables of the Cloud Deployment Assessment.
            </p>
          </div>

          {/* Section 1: Design Rationale */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              1. Architectural Decisions & Network Isolation
            </h2>
            <div className="bg-black/40 p-4 rounded-lg border border-white/5 space-y-3 text-gray-400">
              <p>
                <strong>Network Boundary Protection:</strong> Rather than spinning instances inside the default public network pool, we construct a fully custom Virtual Network (VPC) with a specialized IP partition (10.0.0.0/16).
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-gray-300">Custom Subnet Segmentation:</strong> Standard web traffic remains isolated within a designated 10.0.1.0/24 subnet block, protecting internal server sockets from automatic peer communication.
                </li>
                <li>
                  <strong className="text-gray-300">Explicit Port Access:</strong> Traffic filtering rules (Security Group / NSG) operate statefully. Only HTTP (80) and HTTPS (443) are open to public requests. SSH (22) is blocked entirely or locked down to specified administrator hosts.
                </li>
                <li>
                  <strong className="text-gray-300">Least-Privilege VM Credentials:</strong> Instead of embedding API passwords or static AWS/GCP/Azure access keys inside app code, the virtual machine is launched with a secure native Identity attached (IAM profile, Service Account, or Managed Identity).
                </li>
              </ul>
            </div>
          </div>

          {/* Section 2: CI/CD Execution */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              2. CI/CD Deployment Mechanics
            </h2>
            <div className="bg-black/40 p-4 rounded-lg border border-white/5 space-y-3 text-gray-400">
              <p>
                The integration flow leverages a secure, modern, multi-stage pipeline configuration in GitHub Actions.
              </p>
              <ol className="list-decimal pl-5 space-y-2.5">
                <li>
                  <strong className="text-gray-300">Pre-Deployment Verification:</strong> Every code push to the main branch initiates dependency assembly (<code className="bg-black/50 px-1 rounded font-mono text-[10px] border border-white/5">npm ci</code>), static linter scanning, and automated route health verification. If any test fails, deployment stops instantly.
                </li>
                <li>
                  <strong className="text-gray-300">Workload Identity (OIDC):</strong> In line with industry standards, we utilize secure **OpenID Connect (OIDC)** token federation. GHA runner processes request temporary authentication sessions dynamically, ensuring zero passwords or cloud keys are stored inside Github environment variables.
                </li>
                <li>
                  <strong className="text-gray-300">Remote Bootstrap Orchestration:</strong> SCP securely transmits active repository blocks, where an automated boot script (<code className="bg-black/50 px-1 rounded font-mono text-[10px] border border-white/5">setup.sh</code>) coordinates the process updates on the host VM, including updating systems dependencies, proxying with Nginx, and starting process management via PM2.
                </li>
              </ol>
            </div>
          </div>

          {/* Section 3: Cost Awareness table */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              3. Cloud Resource Cost Estimates
            </h2>
            <p className="text-xs text-gray-400 font-sans">
              A detailed budget layout shows that the assessment operates with high cost efficiency.
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[10px] border-collapse bg-black/40 rounded-lg overflow-hidden border border-white/5">
                <thead>
                  <tr className="bg-[#0D0F14] text-gray-400 border-b border-white/5">
                    <th className="p-2.5 font-bold uppercase tracking-wider">Resource Component</th>
                    <th className="p-2.5 text-center font-bold uppercase tracking-wider">Standard Size</th>
                    <th className="p-2.5 text-right font-bold uppercase tracking-wider">Monthly Cost</th>
                    <th className="p-2.5 text-right font-bold uppercase tracking-wider">Annual Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-300">
                  <tr>
                    <td className="p-2.5 font-sans font-medium text-gray-300">Virtual Compute Host</td>
                    <td className="p-2.5 text-center text-gray-400">{provider === 'aws' ? 't3.micro' : provider === 'gcp' ? 'e2-micro' : 'Standard_B1s'}</td>
                    <td className="p-2.5 text-right text-gray-400">${provider === 'aws' ? '7.60' : provider === 'gcp' ? '7.11' : '7.59'}*</td>
                    <td className="p-2.5 text-right text-gray-400">${provider === 'aws' ? '91.20' : provider === 'gcp' ? '85.32' : '91.08'}*</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans font-medium text-gray-300">Boot Drive Storage (SSD)</td>
                    <td className="p-2.5 text-center text-gray-400">15 GB Volume</td>
                    <td className="p-2.5 text-right text-gray-400">${(15 * data.storageCostGb).toFixed(2)}</td>
                    <td className="p-2.5 text-right text-gray-400">${(15 * data.storageCostGb * 12).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-sans font-medium text-gray-300">Network Data Outbound (Egress)</td>
                    <td className="p-2.5 text-center text-gray-400">10 GB Allowance</td>
                    <td className="p-2.5 text-right text-gray-400">${(10 * data.dataTransferCostGb).toFixed(2)}</td>
                    <td className="p-2.5 text-right text-gray-400">${(10 * data.dataTransferCostGb * 12).toFixed(2)}</td>
                  </tr>
                  <tr className="bg-black/50 font-bold text-white border-t border-white/10">
                    <td className="p-2.5 font-sans font-semibold">Total Estimated Cost</td>
                    <td className="p-2.5 text-center font-normal text-gray-400">Standard Stack</td>
                    <td className="p-2.5 text-right text-blue-400 font-bold">${( (provider === 'aws' ? 7.60 : provider === 'gcp' ? 7.11 : 7.59) + (15 * data.storageCostGb) + (10 * data.dataTransferCostGb) ).toFixed(2)}</td>
                    <td className="p-2.5 text-right text-blue-400 font-bold">${( ((provider === 'aws' ? 7.60 : provider === 'gcp' ? 7.11 : 7.59) + (15 * data.storageCostGb) + (10 * data.dataTransferCostGb)) * 12 ).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <p className="text-[10px] text-gray-500 italic font-sans">
              * Note: Compute cost is fully offset ($0.00) under cloud provider Free Tier programs for the initial test terms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
