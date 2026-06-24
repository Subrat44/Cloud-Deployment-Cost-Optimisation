# Multi-Cloud Architectural Deployment Assessment

This document outlines the step-by-step design decisions, trade-offs considered, cost awareness, and submission guidelines for our multi-cloud deployment (AWS, GCP, Azure).

---

## 📂 Repository File Structure
Below is the directory structure of the project representing our dual-engine architecture (Python full-stack backend with React UI):

```text
├── .env.example              # Template for environment configuration
├── .gitignore                # Git exclusions
├── Dockerfile                # Production multi-stage Node/Python container configuration
├── .github
│   └── workflows
│       └── ci-cd.yml         # GitHub Actions CI/CD Pipeline workflow script
├── providers_data.py         # Python representation of Cloud Providers & VM catalogs
├── server.py                 # Standard Library Python Server (port 3000)
├── server.ts                 # Node.js supervisor (bridges to Python server.py)
├── package.json              # Main workspace dependency definition
├── package-lock.json         # Pinned packages
├── tsconfig.json             # TypeScript rules
├── vite.config.ts            # Vite proxy and asset server configuration
├── src
│   ├── App.tsx               # Main UI Dashboard Core
│   ├── index.css             # Unified Tailwind theme rules
│   ├── main.tsx              # React mounting root
│   ├── types.ts              # Global TS model declarations
│   ├── components            # Reusable UI component modules
│   │   ├── ArchitectureDiagram.tsx  # Dynamic interactive network topology map
│   │   ├── CodeExplorer.tsx         # Tabbed Terraform configuration reader
│   │   ├── CompareProviders.tsx     # Cost slide and comparative tables
│   │   ├── CostAndTradeoffs.tsx     # Grandular cost slider inputs & API calculator
│   │   ├── PipelineSimulator.tsx    # Live simulation workflow runner
│   │   ├── ProviderSelector.tsx     # Active Cloud selector
│   │   └── ReadmeViewer.tsx         # Displays formatted target guidelines
│   └── data                  # Provider data & IaC manifests
│       ├── awsData.ts               # AWS parameters and custom markdown content
│       ├── azureData.ts             # Azure parameters and custom markdown content
│       └── gcpData.ts               # GCP parameters and custom markdown content
```

---

## 🛠️ Step-by-Step Breakdown

### Step 1: Design Decisions
* **Full-Stack Python Backend Engine**: We migrated the core logic of the assessment server to Python 3.10 (`server.py`). The backend processes calculating requests, delivers custom Terraform code blocks, and runs AI-assisted optimizations through Gemini REST endpoints.
* **Supervising Node.js Process**: To maintain full compatibility with container build systems, we utilize a Node.js process supervisor (`server.ts`). It launches, coordinates, and shuts down the underlying Python server cleanly.
* **Network Isolation**: By default, virtual machines are deployed inside custom, fully isolated Virtual Networks (VPCs) rather than default routing tables to secure internal systems.
* **Identity and OIDC Access**: We employ cryptographically signed Workload Identity Federation (OIDC) through GitHub Actions workflows, ensuring zero persistent cloud credentials or SSH keys are saved in GitHub secrets.

### Step 2: Trade-offs Considered
* **Python vs. Node.js backend**: Python was chosen as the primary engine for its ease of integration with cloud automation tools, rich standard library socket engines, and clean integration with AI SDKs. Node.js is retained only as a supervisor to satisfy standard runtime scripts.
* **Burstable VM Sizing**: We chose burstable compute options (`t3.micro`, `e2-micro`, `Standard_B1s`) because they provide excellent dev/staging performance and fit fully within cloud providers' Free Tier programs.
* **Local Fallback for Optimization**: The system includes a dual-engine AI optimizer. If the `GEMINI_API_KEY` is not present, it automatically uses a local rule-based optimizer fallback to guarantee instant, resilient, and offline-compatible UX.

### Step 3: Cost Awareness
* **Compute Budgets**: All standard virtual compute instances are selected to run within $6.00 to $7.60/month per VM, satisfying budget optimization.
* **SSD Disk Storage**: We use modern SSD specifications (like AWS `gp3`, GCP `pd-ssd`, and Azure `Premium_LRS`) that provide independent tuning of IOPS and throughput, representing a 20% cost saving over legacy options.
* **Network Outbound (Egress)**: Sliders and calculations isolate outbound data transfer to avoid crossing billing thresholds on public internet boundaries.

### Step 4: Submission Guidelines
1. **Initialize Git Cleanliness**: Ensure that no credentials, private SSH keys, or cloud certificates are committed to the public tree.
2. **Setup Local Environment**: Copy `.env.example` to `.env` and fill in optional parameters such as `GEMINI_API_KEY`.
3. **Compile Verification**: Execute `npm run lint` followed by `npm run build` to verify type safety and successful static bundling.
4. **Deploy & Validate**: Ensure the supervised Python server boots correctly, binds to port 3000, and passes all health queries on `/api/health`.
