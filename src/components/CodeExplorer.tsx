import React, { useState } from 'react';
import { CloudData } from '../types';
import { Copy, Check, FileCode, Folder, ChevronRight, File } from 'lucide-react';

interface CodeExplorerProps {
  data: CloudData;
}

export default function CodeExplorer({ data }: CodeExplorerProps) {
  const [activeCategory, setActiveCategory] = useState<'terraform' | 'app' | 'pipeline'>('terraform');
  const [activeFile, setActiveFile] = useState<string>('main.tf');
  const [copied, setCopied] = useState(false);

  // Define files structure dynamically
  const categories = {
    terraform: {
      label: 'Terraform IaC',
      files: [
        { name: 'main.tf', content: data.terraform.mainTf, desc: 'Primary resources declaration: VPC, subnets, routing, firewall rules, and compute VM.' },
        { name: 'variables.tf', content: data.terraform.variablesTf, desc: 'Input variables permitting configuration adjustments (Region, Machine Sizes, SSH keys).' },
        { name: 'outputs.tf', content: data.terraform.outputsTf, desc: 'Exported parameters (allocated Public IP, Endpoint URLs) available upon deployment completion.' },
        { name: 'iam.tf', content: data.terraform.iamTf, desc: 'Least-privilege security roles, permissions attachments, and federated OIDC resource declarations.' }
      ]
    },
    app: {
      label: 'Application Code',
      files: [
        { name: 'server.js', content: data.appCode.serverJs, desc: 'Lightweight Node.js Express server defining a health probe endpoint and main landing view.' },
        { name: 'package.json', content: data.appCode.packageJson, desc: 'Standard manifest declaration containing app dependencies and launch parameters.' },
        { name: 'setup.sh', content: data.appCode.setupScript, desc: 'Bootstrap shell script automating the installation of system updates, Node.js, PM2, and Nginx proxy configs.' }
      ]
    },
    pipeline: {
      label: 'CI/CD Pipeline',
      files: [
        { name: '.github/workflows/deploy.yml', content: data.githubActions, desc: 'GitHub Actions workflow triggering on push events to build, test, and deploy securely via OIDC.' }
      ]
    }
  };

  const filesInActiveCategory = categories[activeCategory].files;
  const currentFileObject = filesInActiveCategory.find(f => f.name === activeFile) || filesInActiveCategory[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFileObject.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectCategory = (category: 'terraform' | 'app' | 'pipeline') => {
    setActiveCategory(category);
    setActiveFile(categories[category].files[0].name);
  };

  return (
    <div className="bg-[#0D0F14] border border-white/10 rounded-xl overflow-hidden shadow-xl" id="code-section">
      {/* Category Tabs */}
      <div className="flex border-b border-white/5 bg-black/40 px-4 pt-3 gap-2">
        {(Object.keys(categories) as Array<keyof typeof categories>).map((cat) => (
          <button
            key={cat}
            onClick={() => selectCategory(cat)}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all duration-150 border-t border-x ${
              activeCategory === cat
                ? 'bg-[#0D0F14] border-white/10 text-white font-bold'
                : 'bg-transparent border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {categories[cat].label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 min-h-[500px]">
        {/* Left Side File Tree */}
        <div className="md:col-span-1 bg-black/20 border-r border-white/5 p-4">
          <div className="flex items-center gap-1.5 text-gray-400 text-xs font-bold font-mono mb-3 uppercase tracking-wider">
            <Folder className="w-3.5 h-3.5 text-blue-400" />
            <span>Repository Workspace</span>
          </div>

          <div className="space-y-1">
            {filesInActiveCategory.map((file) => (
              <button
                key={file.name}
                onClick={() => setActiveFile(file.name)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center gap-2 transition-all duration-150 ${
                  activeFile === file.name
                    ? 'bg-white/5 text-white border border-white/10 font-semibold shadow-sm'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <FileCode className={`w-3.5 h-3.5 ${activeFile === file.name ? 'text-green-400' : 'text-gray-500'}`} />
                <span className="truncate">{file.name}</span>
              </button>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 text-[11px] text-gray-400 leading-relaxed font-sans">
            <p className="font-semibold text-gray-300 font-sans uppercase tracking-widest text-[9px] mb-1.5">File Explanation</p>
            {currentFileObject.desc}
          </div>
        </div>

        {/* Right Side Code Viewer */}
        <div className="md:col-span-3 flex flex-col bg-[#0D0F14]">
          {/* Code Header bar */}
          <div className="flex justify-between items-center bg-[#0D0F14] px-5 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500/80"></span>
              <span className="w-2 h-2 rounded-full bg-yellow-500/80"></span>
              <span className="w-2 h-2 rounded-full bg-green-500/80"></span>
              <span className="text-xs font-mono text-gray-400 ml-2">{currentFileObject.name}</span>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 transition-all active:scale-95 cursor-pointer font-sans"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-green-400 font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Actual Code Viewer block */}
          <div className="flex-1 overflow-auto max-h-[480px] p-5 font-mono text-xs text-gray-300 leading-relaxed select-text bg-black/40">
            <pre className="whitespace-pre">
              <code>
                {currentFileObject.content.split('\n').map((line, idx) => (
                  <div key={idx} className="table-row hover:bg-white/5">
                    <span className="table-cell pr-4 text-right text-gray-600 select-none text-[10px] w-8">
                      {idx + 1}
                    </span>
                    <span className="table-cell break-all">
                      {line}
                    </span>
                  </div>
                ))}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
