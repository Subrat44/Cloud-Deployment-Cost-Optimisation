import React, { useState, useEffect, useRef } from 'react';
import { CloudProvider, PipelineStep, LogLine } from '../types';
import { Play, RotateCcw, Terminal, CheckCircle2, XCircle, Loader2, ArrowUpRight, HelpCircle } from 'lucide-react';

interface PipelineSimulatorProps {
  provider: CloudProvider;
}

export default function PipelineSimulator({ provider }: PipelineSimulatorProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [vmIp, setVmIp] = useState('54.210.142.18');
  const [repoName, setRepoName] = useState('candidate-assessment');
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Sync default VM IP with selected provider
  useEffect(() => {
    if (provider === 'aws') setVmIp('54.210.142.18');
    else if (provider === 'gcp') setVmIp('34.120.45.195');
    else setVmIp('20.40.112.82');
    handleReset();
  }, [provider]);

  // Scroll to bottom of terminal
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const steps: PipelineStep[] = [
    { id: 'trigger', name: 'Git Commit Push Event', status: 'idle', icon: 'GitBranch' },
    { id: 'checkout', name: 'Checkout Repository Code', status: 'idle', icon: 'Folder' },
    { id: 'setup', name: 'Initialize Node.js v20 Env', status: 'idle', icon: 'Cpu' },
    { id: 'test', name: 'Execute Linter & Tests', status: 'idle', icon: 'CheckSquare' },
    { id: 'auth', name: 'OIDC Federated Authentication', status: 'idle', icon: 'Shield' },
    { id: 'deploy', name: 'SSH SCP Deploy & App Bootstrap', status: 'idle', icon: 'Server' },
    { id: 'verify', name: 'Live Health Check Probe', status: 'idle', icon: 'Activity' }
  ];

  const getStepStatus = (index: number) => {
    if (currentStepIndex === -1) return 'idle';
    if (currentStepIndex > index) return 'completed';
    if (currentStepIndex === index) return 'running';
    return 'idle';
  };

  const handleReset = () => {
    setIsRunning(false);
    setCurrentStepIndex(-1);
    setLogs([
      { text: 'SYSTEM: GHA Runner initialized. Standing by for triggers.', type: 'info', timestamp: '10:34:20' }
    ]);
  };

  const addLog = (text: string, type: 'info' | 'success' | 'warning' | 'error' | 'command' = 'info') => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    setLogs(prev => [...prev, { text, type, timestamp: timeStr }]);
  };

  const runPipeline = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setLogs([]);
    
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Async handshake with Python backend API
    try {
      const response = await fetch(`/api/pipeline/simulate?provider=${provider}`);
      const serverLogs = await response.json();
      addLog(`[Python API Status] Connected to Python 3.10 pipeline socket...`, 'info');
      if (serverLogs && serverLogs.length > 0) {
        addLog(`[Python API] Handshake: ${serverLogs[0].text}`, 'success');
      }
    } catch (e) {
      console.warn('Python backend connection fallback active', e);
    }

    // STEP 1: TRIGGER
    setCurrentStepIndex(0);
    addLog(`$ git push origin main`, 'command');
    await delay(600);
    addLog(`GITHUB: Webhook received. Instantiating Workflow "deploy.yml" on ubuntu-latest...`, 'info');
    addLog(`Runner acquired. Job 'build-and-deploy' started on worker ID: gha-us-east-4122`, 'success');
    await delay(1000);

    // STEP 2: CHECKOUT
    setCurrentStepIndex(1);
    addLog(`$ actions/checkout@v4`, 'command');
    addLog(`Initializing git repository...`, 'info');
    addLog(`Cloning https://github.com/user/${repoName}.git...`, 'info');
    addLog(`Successfully checked out HEAD at commit sha: a7f8d9b13`, 'success');
    await delay(1000);

    // STEP 3: SETUP NODE
    setCurrentStepIndex(2);
    addLog(`$ actions/setup-node@v4 --version=20`, 'command');
    addLog(`Searching in system cache for Node.js 20.x...`, 'info');
    addLog(`Loaded Node.js v20.12.2 from virtual env cache.`, 'info');
    addLog(`Configured credentials for registry: registry.npmjs.org`, 'success');
    await delay(800);

    // STEP 4: DEPENDENCIES & TESTS
    setCurrentStepIndex(3);
    addLog(`$ npm ci`, 'command');
    addLog(`audit: scanned 152 packages, found 0 vulnerabilities.`, 'info');
    addLog(`added 152 packages in 1.482s. Packages successfully compiled.`, 'success');
    addLog(`$ npm run lint`, 'command');
    addLog(`ESLint checks: Passed. (0 warnings, 0 errors)`, 'success');
    addLog(`$ npm run test`, 'command');
    addLog(`PASS  src/tests/app.test.js (5.2s) - ✓ HTTP /health returns 200`, 'success');
    await delay(1200);

    // STEP 5: AUTH OIDC
    setCurrentStepIndex(4);
    if (provider === 'aws') {
      addLog(`$ aws-actions/configure-aws-credentials@v4`, 'command');
      addLog(`Requesting short-lived JWT OIDC token from GitHub identity provider...`, 'info');
      addLog(`JWT token fetched. Exchanging with AWS STS for temporary IAM session...`, 'info');
      addLog(`STS Session acquired: Role [assessment-gha-deploy-role] assumed.`, 'success');
    } else if (provider === 'gcp') {
      addLog(`$ google-github-actions/auth@v2`, 'command');
      addLog(`Acquiring OIDC assertion from GitHub runner core...`, 'info');
      addLog(`Exchanging OIDC assertion against GCP Workload Identity Pool: [github-actions-pool]`, 'info');
      addLog(`Impersonating service account: assessment-vm-sa@project.iam.gserviceaccount.com`, 'success');
    } else {
      addLog(`$ azure/login@v2`, 'command');
      addLog(`Negotiating federated identity validation with Microsoft Entra ID (Azure AD)...`, 'info');
      addLog(`Azure AD federated exchange successful. Principal context set.`, 'info');
      addLog(`Successfully logged into subscription ID: 00000000-0000-0000-0000-000000000000`, 'success');
    }
    await delay(1200);

    // STEP 6: DEPLOY
    setCurrentStepIndex(5);
    addLog(`$ appleboy/scp-action@v0.1.7`, 'command');
    addLog(`Establishing secure SSH connection to host VM at IP: ${vmIp}:22...`, 'info');
    addLog(`SSH Connection authorized using private key.`, 'info');
    addLog(`Syncing files: server.js, package.json, setup.sh -> /var/www/app...`, 'info');
    addLog(`Transferred 3 files successfully (14.2 KB total).`, 'success');
    
    addLog(`$ appleboy/ssh-action@v1.0.3`, 'command');
    addLog(`Executing boot-up automation on remote shell:`, 'info');
    addLog(`[VM-SHELL] Running /var/www/app/setup.sh...`, 'info');
    addLog(`[VM-SHELL] Updating packages and verifying Node.js installation...`, 'info');
    addLog(`[VM-SHELL] Node.js version found: v20.12.2`, 'info');
    addLog(`[VM-SHELL] pm2: stopping existing 'basic-cloud-app' process...`, 'info');
    addLog(`[VM-SHELL] pm2: starting server.js on target process pool...`, 'info');
    addLog(`[VM-SHELL] pm2: Application basic-cloud-app launched successfully on Port 80.`, 'success');
    addLog(`[VM-SHELL] Nginx configuration verified. Port forwarding online.`, 'success');
    await delay(1800);

    // STEP 7: VERIFY
    setCurrentStepIndex(6);
    addLog(`$ curl -s -w "%{http_code}" http://${vmIp}/health`, 'command');
    addLog(`Probing web app health endpoint at http://${vmIp}/health...`, 'info');
    await delay(800);
    addLog(`Response payload: {"status":"healthy","timestamp":"${new Date().toISOString()}"}`, 'success');
    addLog(`Received Status Code: 200 OK. Dynamic routing validation successful!`, 'success');
    addLog(`=========================================`, 'success');
    addLog(`SUCCESS: WORKFLOW PIPELINE RUN COMPLETED`, 'success');
    addLog(`=========================================`, 'success');
    
    setCurrentStepIndex(7); // Completed state
    setIsRunning(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6" id="simulator-section">
      {/* Visual Stepper */}
      <div className="lg:col-span-2 bg-white border border-rosegold-200/60 rounded-xl p-5 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-rosegold-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              Workflow Steps
            </h3>
            <span className="text-[10px] bg-rosegold-50 text-rosegold-700 font-mono font-bold px-2 py-0.5 rounded border border-rosegold-200">
              OIDC Secure Mode
            </span>
          </div>

          <div className="space-y-4">
            {steps.map((step, idx) => {
              const status = getStepStatus(idx);
              return (
                <div key={step.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all duration-200 border ${
                      status === 'completed'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                        : status === 'running'
                        ? 'bg-rosegold-500/15 border-rosegold-500 text-rosegold-600 animate-pulse'
                        : 'bg-rosegold-50/50 border-rosegold-100 text-slate-400'
                    }`}>
                      {status === 'completed' ? '✓' : idx + 1}
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={`w-0.5 h-6 my-1 ${
                        currentStepIndex > idx ? 'bg-emerald-500/40' : 'bg-rosegold-100'
                      }`} />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-semibold ${
                        status === 'completed'
                          ? 'text-emerald-600 font-bold'
                          : status === 'running'
                          ? 'text-rosegold-600 font-extrabold'
                          : 'text-slate-500 font-medium'
                      }`}>
                        {step.name}
                      </span>
                      {status === 'running' && (
                        <Loader2 className="w-3 h-3 text-rosegold-600 animate-spin" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 block font-mono font-bold uppercase">
                      {status === 'completed' ? 'PASS' : status === 'running' ? 'EXECUTING...' : 'QUEUED'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-rosegold-100 flex flex-col gap-3">
          {/* Inputs */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[10px] text-slate-500 font-mono font-bold uppercase block mb-1">Target Host IP</label>
              <input
                type="text"
                value={vmIp}
                onChange={(e) => setVmIp(e.target.value)}
                disabled={isRunning}
                className="w-full bg-rosegold-50/30 border border-rosegold-200 rounded px-2.5 py-1.5 font-mono text-slate-800 font-semibold focus:outline-none focus:border-rosegold-400 disabled:opacity-60"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-mono font-bold uppercase block mb-1">Repository Name</label>
              <input
                type="text"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                disabled={isRunning}
                className="w-full bg-rosegold-50/30 border border-rosegold-200 rounded px-2.5 py-1.5 font-mono text-slate-800 font-semibold focus:outline-none focus:border-rosegold-400 disabled:opacity-60"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={runPipeline}
              disabled={isRunning}
              className="flex-1 bg-rosegold-500 hover:bg-rosegold-600 disabled:bg-rosegold-100 disabled:text-slate-400 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 shadow-sm"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Deploying...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run CI/CD Pipeline</span>
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              disabled={isRunning}
              className="bg-white hover:bg-rosegold-50 text-slate-600 p-2 rounded-lg border border-rosegold-200 transition-all cursor-pointer active:scale-98 shadow-sm"
              title="Reset Simulator"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Terminal Runner Logs */}
      <div className="lg:col-span-3 bg-white border border-rosegold-200/60 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
        <div className="bg-rosegold-50/20 border-b border-rosegold-100 px-4 py-2.5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-rosegold-600" />
            <span className="text-xs text-slate-800 font-mono font-bold">runner@github-actions-vm:~</span>
          </div>
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rosegold-200"></span>
            <span className="w-2 h-2 rounded-full bg-rosegold-200"></span>
            <span className="w-2 h-2 rounded-full bg-rosegold-200"></span>
          </div>
        </div>

        <div className="flex-1 p-5 font-mono text-[11px] leading-relaxed overflow-y-auto max-h-[400px] min-h-[300px] bg-[#1E1B1C] text-rosegold-100">
          {logs.map((log, idx) => (
            <div key={idx} className="mb-1.5 flex items-start gap-2">
              <span className="text-rosegold-400/40 select-none text-[9px] pt-0.5 font-bold">{log.timestamp}</span>
              {log.type === 'command' && <span className="text-rosegold-300/60 font-bold select-none">&gt;</span>}
              <span className={`break-all ${
                log.type === 'success'
                  ? 'text-emerald-400 font-semibold'
                  : log.type === 'error'
                  ? 'text-red-400 font-bold'
                  : log.type === 'command'
                  ? 'text-sky-300 font-semibold'
                  : log.type === 'warning'
                  ? 'text-amber-400 font-semibold'
                  : 'text-rosegold-100'
              }`}>
                {log.text}
              </span>
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>

        <div className="bg-rosegold-50/10 p-3.5 border-t border-rosegold-100 text-[10px] text-slate-500 flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]'}`}></span>
            <span className="font-medium text-slate-600">Status: {isRunning ? 'Active Deployment' : currentStepIndex === 7 ? 'Finished (Pass)' : 'Idle'}</span>
          </div>
          {currentStepIndex === 7 && (
            <a 
              href={`http://${vmIp}`} 
              target="_blank" 
              rel="noreferrer"
              className="text-rosegold-600 hover:text-rosegold-700 hover:underline flex items-center gap-1 font-sans font-bold text-xs transition"
            >
              <span>Visit VM Site</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
