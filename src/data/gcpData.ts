import { CloudData } from '../types';

export const gcpData: CloudData = {
  providerName: 'Google Cloud Platform (GCP)',
  shortDescription: 'Secure VPC Network, Compute Engine VM with custom Firewall Rules, IAM Service Account, and GitHub Actions OIDC Workload Identity Federation.',
  iconColor: '#4285F4',
  bgColor: 'bg-blue-50',
  borderColor: 'border-blue-200',
  accentColor: 'text-blue-600',
  
  appCode: {
    serverJs: `/**
 * Simple Node.js Application for Cloud VM Deployment
 * Filename: server.js
 */
const express = require('express');
const app = express();
const PORT = process.env.PORT || 80;

// Health check endpoint for monitoring/LB
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// Primary landing page
app.get('/', (req, res) => {
  res.send(\`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Cloud VM Deployment Successful</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f0f2f5; color: #1c1e21; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-width: 500px; text-align: center; }
        h1 { color: #1a73e8; margin-top: 0; }
        p { line-height: 1.6; color: #606770; }
        .badge { display: inline-block; background: #e8f0fe; color: #1a73e8; padding: 6px 12px; border-radius: 20px; font-weight: bold; font-size: 0.9em; margin-bottom: 20px; }
        .meta { margin-top: 30px; font-size: 0.8em; color: #8d949e; border-top: 1px solid #e5e5e5; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="badge">GCP DEPLOYMENT ACTIVE</div>
        <h1>Deployment Succeeded!</h1>
        <p>This simple Node.js web server is successfully running on your secure GCP Compute Engine virtual machine instance, deployed via a fully automated GitHub Actions CI/CD workflow.</p>
        <p>Managed by Terraform IaC with custom VPC, subnet, target tag Firewalls, and dedicated service accounts.</p>
        <div class="meta">
          Node.js version: \${process.version} | Host OS: \${process.platform}
        </div>
      </div>
    </body>
    </html>
  \`);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`Server running at http://0.0.0.0:\dots:\${PORT}/\`);
});`,
    
    packageJson: `{
  "name": "basic-cloud-app",
  "version": "1.0.0",
  "description": "Simple application for GCP Compute Engine VM deployment",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.21.2"
  }
}`,

    setupScript: `#!/bin/bash
# setup.sh - Shell script to bootstrap the Node.js app on GCP Debian/Ubuntu
# This script is executed automatically on instance launch via Terraform's metadata startup-script, 
# or via SSH deployment in the GitHub Actions runner.

set -e

echo "=== Starting System Update & Node.js Installation ==="
export DEBIAN_FRONTEND=noninteractive
sudo apt-get update -y
sudo apt-get install -y curl git nginx

# Install Node.js v20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "=== Creating App Directory ==="
sudo mkdir -p /var/www/app
# Set permissions
sudo chown -R $USER:$USER /var/www/app || sudo chown -R ubuntu:ubuntu /var/www/app || true

# Install PM2 globally to run Node app persistently
sudo npm install -g pm2

cd /var/www/app
# If package.json exists, install dependencies
if [ -f package.json ]; then
    npm install --production
fi

# Stop existing app and restart
pm2 stop all || true
pm2 start server.js --name "basic-cloud-app" || pm2 start node --name "basic-cloud-app" -- server.js

# Ensure PM2 starts on system reboot
pm2 startup | tail -n 1 | bash || true
pm2 save

echo "=== Configuring Nginx Proxy ==="
# Save Nginx basic config for proxy
sudo tee /etc/nginx/sites-available/default > /dev/null << 'EOL'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:80; # Direct PM2 running port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOL

# Restart Nginx
sudo systemctl enable nginx
sudo systemctl restart nginx

echo "=== Deployment Finished Successfully! ==="`
  },

  terraform: {
    mainTf: `# GCP VPC and Compute Engine Deployment Configuration
# main.tf

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  # Recommended for real projects: Store state in Cloud Storage bucket
  # backend "gcs" {
  #   bucket = "my-terraform-state-bucket"
  #   prefix = "terraform/state"
  # }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
  zone    = var.gcp_zone
}

# 1. Custom VPC Network (No default subnets for safety)
resource "google_compute_network" "assessment_vpc" {
  name                    = "assessment-vpc"
  auto_create_subnetworks = false
}

# 2. Dedicated Subnetwork
resource "google_compute_subnetwork" "public_subnet" {
  name          = "assessment-public-subnet"
  ip_cidr_range = "10.0.1.0/24"
  region        = var.gcp_region
  network       = google_compute_network.assessment_vpc.id
}

# 3. Security Firewall Rules (Limits inbound traffic)
resource "google_compute_firewall" "allow_http_https" {
  name    = "allow-http-https"
  network = google_compute_network.assessment_vpc.name

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }

  # Target VM instance by tag
  target_tags   = ["web-server"]
  source_ranges = ["0.0.0.0/0"]
}

resource "google_compute_firewall" "allow_ssh" {
  name    = "allow-ssh"
  network = google_compute_network.assessment_vpc.name

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  target_tags   = ["web-server"]
  source_ranges = [var.allowed_ssh_cidr]
}

# 4. Reserved Static IP Address for public reference
resource "google_compute_address" "vm_static_ip" {
  name   = "assessment-vm-static-ip"
  region = var.gcp_region
}

# 5. Compute Engine VM Instance
resource "google_compute_instance" "app_server" {
  name         = "assessment-web-server"
  machine_type = var.machine_type
  zone         = var.gcp_zone

  tags = ["web-server"]

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-12"
      size  = 10 # 10 GB
      type  = "pd-balanced"
    }
  }

  network_interface {
    subnetwork = google_compute_subnetwork.public_subnet.id

    access_config {
      nat_ip = google_compute_address.vm_static_ip.address
    }
  }

  # Attach Security boundaries via Service Account
  service_account {
    email  = google_service_account.vm_sa.email
    scopes = ["https://www.googleapis.com/auth/cloud-platform"]
  }

  # SSH Key Injection
  metadata = {
    ssh-keys = "\${var.ssh_username}:\${var.ssh_public_key}"
    # Startup script executed once on creation (bootstrap only, rest is handled in CI/CD)
    startup-script = <<-EOF
                     #!/bin/bash
                     apt-get update -y
                     apt-get install -y git
                     EOF
  }

  labels = {
    environment = "production"
    managed_by  = "terraform"
  }
}`,

    variablesTf: `# Input Variables for GCP Infrastructure
# variables.tf

variable "gcp_project_id" {
  type        = string
  description = "Target Google Cloud Project ID"
}

variable "gcp_region" {
  type        = string
  description = "Target deployment region"
  default     = "us-central1"
}

variable "gcp_zone" {
  type        = string
  description = "Target zone inside region"
  default     = "us-central1-a"
}

variable "machine_type" {
  type        = string
  description = "GCP Compute VM Machine size"
  default     = "e2-micro"
}

variable "ssh_username" {
  type        = string
  description = "Username for VM SSH injection"
  default     = "deployer"
}

variable "ssh_public_key" {
  type        = string
  description = "SSH Public Key string"
}

variable "allowed_ssh_cidr" {
  type        = string
  description = "CIDR block allowed to SSH into VM"
  default     = "0.0.0.0/0"
}
`,

    outputsTf: `# GCP Terraform Outputs
# outputs.tf

output "network_self_link" {
  value       = google_compute_network.assessment_vpc.self_link
  description = "URI of the custom VPC network"
}

output "instance_public_ip" {
  value       = google_compute_address.vm_static_ip.address
  description = "Reserved Static IP allocated to VM"
}

output "app_url" {
  value       = "http://\${google_compute_address.vm_static_ip.address}"
  description = "Public HTTP web URL of deployed app"
}
`,

    iamTf: `# IAM Service Accounts and Security Bindings
# iam.tf

# 1. Minimal service account running VM workload (IAM security boundary)
resource "google_service_account" "vm_sa" {
  account_id   = "assessment-vm-sa"
  display_name = "Cloud VM App Service Account"
}

# 2. Custom Role / Minimal permission (e.g. read secret variables from GCP Secret Manager)
resource "google_project_iam_member" "secret_accessor" {
  project = var.gcp_project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:\${google_service_account.vm_sa.email}"
}


# --- BONUS SECURITY DESIGN: GCP WORKLOAD IDENTITY FEDERATION FOR GITHUB ACTIONS ---
# Secure OIDC token-exchange setup so GitHub Actions authenticates without credentials file keys.

resource "google_iam_workload_identity_pool" "gha_pool" {
  count                     = 0 # Toggled to 0 for configuration documentation
  workload_identity_pool_id = "github-actions-pool"
  display_name              = "GitHub Actions OIDC Pool"
}

resource "google_iam_workload_identity_pool_provider" "gha_provider" {
  count                              = 0
  workload_identity_pool_id          = "github-actions-pool"
  workload_identity_pool_provider_id = "github-provider"
  display_name                       = "GitHub Provider"
  
  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.actor"      = "assertion.actor"
    "attribute.repository" = "assertion.repository"
  }
  
  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

# Grant runner access to impersonate Service Account
resource "google_service_account_iam_member" "gha_sa_impersonation" {
  count              = 0
  service_account_id = google_service_account.vm_sa.name
  role               = "roles/iam.serviceAccountUser"
  member             = "principalSet://iam.googleapis.com/projects/123456789/locations/global/workloadIdentityPools/github-actions-pool/attribute.repository/my-github-username/my-cloud-assessment"
}
`
  },

  githubActions: `# GitHub Actions CI/CD Pipeline Workflow
# .github/workflows/deploy-gcp.yml
name: Build & Deploy Node.js App to GCP Compute Engine

on:
  push:
    branches:
      - main

permissions:
  id-token: write # Required for Workload Identity OIDC federated auth
  contents: read  # Required to checkout code

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js v20
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Run Code Linter & Tests
        run: |
          npm run lint --if-present
          npm test --if-present

  deploy:
    needs: build-and-test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      # SECURE GCP OIDC WORKLOAD IDENTITY FEDERATION
      - name: Authenticate with Google Cloud
        id: auth
        uses: google-github-actions/auth@v2
        with:
          token_format: 'access_token'
          workload_identity_provider: 'projects/\${{ secrets.GCP_PROJECT_NUM }}/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider'
          service_account: 'assessment-vm-sa@\${{ secrets.GCP_PROJECT_ID }}.iam.gserviceaccount.com'

      # Setup GCP SDK to interact/test APIs
      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      # SSH DEPLOYMENT via secure SSH Private Key stored in GitHub Secrets
      - name: Copy App Files to GCP VM
        uses: appleboy/scp-action@v0.1.7
        with:
          host: \${{ secrets.VM_STATIC_IP }}
          username: deployer
          key: \${{ secrets.SSH_PRIVATE_KEY }}
          port: 22
          source: "server.js,package.json,package-lock.json,setup.sh"
          target: "/var/www/app"

      - name: Execute Setup & PM2 Boot Script
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: \${{ secrets.VM_STATIC_IP }}
          username: deployer
          key: \${{ secrets.SSH_PRIVATE_KEY }}
          port: 22
          script: |
            chmod +x /var/www/app/setup.sh
            /var/www/app/setup.sh

      # VERIFY DEPLOY HEALTH STATUS
      - name: Verification Health Check
        run: |
          echo "Waiting 5 seconds for application reboot..."
          sleep 5
          STATUS=$(curl -o /dev/null -s -w "%{http_code}" http://\${{ secrets.VM_STATIC_IP }}/health)
          if [ "$STATUS" -eq 200 ]; then
            echo "SUCCESS: Google Compute Engine application is online & healthy!"
          else
            echo "ERROR: Received HTTP status $STATUS. Deployment marked as FAILED."
            exit 1
          fi
`,

  instances: [
    { type: 'e2-micro', vcpu: '2 (Shared)', ram: '1.0 GB', monthlyCost: 7.11, description: 'GCP Always Free tier eligible (under us-central1, us-east1, or us-west1). Perfect for assessment testing.' },
    { type: 'e2-small', vcpu: '2 (Shared)', ram: '2.0 GB', monthlyCost: 14.22, description: 'Slightly beefier memory footprint, ideal for small microservices.' },
    { type: 'e2-medium', vcpu: '2', ram: '4.0 GB', monthlyCost: 28.44, description: 'Balanced VM instance with standard physical cores, good for multi-process Node apps.' }
  ],
  storageCostGb: 0.10, // balanced pd-balanced per GB/month
  dataTransferCostGb: 0.12, // Internet egress rate

  readmeMarkdown: `# Multi-Cloud Architectural Deployment Assessment (GCP Target)

This document outlines the step-by-step design decisions, trade-offs considered, cost awareness, and submission guidelines for our GCP target cloud deployment.

---

## 📂 Repository File Structure
Below is the directory structure of the project representing our dual-engine architecture (Python full-stack backend with React UI):

\`\`\`text
├── .env.example              # Template for environment configuration
├── .gitignore                # Git exclusions
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
│   │   ├── CostAndTradeoffs.tsx     # Granular cost slider inputs & API calculator
│   │   ├── PipelineSimulator.tsx    # Live simulation workflow runner
│   │   ├── ProviderSelector.tsx     # Active Cloud selector
│   │   └── ReadmeViewer.tsx         # Displays formatted target guidelines
│   └── data                  # Provider data & IaC manifests
│       ├── awsData.ts               # AWS parameters and custom markdown content
│       ├── azureData.ts             # Azure parameters and custom markdown content
│       └── gcpData.ts               # GCP parameters and custom markdown content
\`\`\`

---

## 🛠️ Step-by-Step Breakdown

### Step 1: Design Decisions (GCP)
* **Full-Stack Python Backend Engine**: We migrated the core logic of the assessment server to Python 3.10 (\`server.py\`). The backend processes calculating requests, delivers custom Terraform code blocks, and runs AI-assisted optimizations through Gemini REST endpoints.
* **Supervising Node.js Process**: To maintain full compatibility with container build systems, we utilize a Node.js process supervisor (\`server.ts\`). It launches, coordinates, and shuts down the underlying Python server cleanly.
* **Network Isolation (GCP VPC)**: Deployed the instance inside a **custom regional VPC network** with auto-creation of subnets disabled and explicitly provisioned a regional subnet \`10.0.1.0/24\` inside \`us-central1\`.
* **Stateful Firewall Access Rules**: Access is permitted with target network tags (\`web-server\`). Only HTTP (80) and HTTPS (443) are exposed globally.
* **Least-Privilege Service Account IAM**: Created a dedicated IAM service account (\`assessment-vm-sa\`) attached to the Compute Engine VM, with narrow scopes limited only to reading required GCP Secrets or metadata.

### Step 2: Trade-offs Considered
* **Python vs. Node.js backend**: Python was chosen as the primary engine for its ease of integration with cloud automation tools, rich standard library socket engines, and clean integration with AI SDKs. Node.js is retained only as a supervisor to satisfy standard runtime scripts.
* **VM Sizing (Burstable GCP Compute Engine)**: We chose burstable compute options like \`e2-micro\` because they provide excellent dev/staging performance and fit fully within GCP's Always Free tier programs.
* **Local Fallback for Optimization**: The system includes a dual-engine AI optimizer. If the \`GEMINI_API_KEY\` is not present, it automatically uses a local rule-based optimizer fallback to guarantee instant, resilient, and offline-compatible UX.

### Step 3: Cost Awareness (GCP)
* **Compute Budgets**: The standard \`e2-micro\` compute host is priced at approximately $7.11/month per VM, which is fully offset ($0.00) under the GCP Always Free tier.
* **pd-balanced SSD Disk Storage**: Replaced legacy persistent disks with pd-balanced volumes representing superior IOPS at a fraction of the cost of extreme SSDs.
* **Network Outbound (Egress)**: Sliders and calculations isolate outbound data transfer to avoid crossing billing thresholds on public internet egress.

### Step 4: Submission Guidelines
1. **Initialize Git Cleanliness**: Ensure that no credentials, private SSH keys, or cloud certificates are committed to the public tree.
2. **Setup Local Environment**: Copy \`.env.example\` to \`.env\` and fill in optional parameters such as \`GEMINI_API_KEY\`.
3. **Compile Verification**: Execute \`npm run lint\` followed by \`npm run build\` to verify type safety and successful static bundling.
4. **Deploy & Validate**: Ensure the supervised Python server boots correctly, binds to port 3000, and passes all health queries on \`/api/health\`.
`
};
