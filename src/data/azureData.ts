import { CloudData } from '../types';

export const azureData: CloudData = {
  providerName: 'Microsoft Azure',
  shortDescription: 'Secure Resource Group, Virtual Network, Network Security Group (NSG), Linux VM with Managed Identity, and GitHub Actions OIDC Azure Login.',
  iconColor: '#0089D6',
  bgColor: 'bg-sky-50',
  borderColor: 'border-sky-200',
  accentColor: 'text-sky-600',
  
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
        h1 { color: #0078d4; margin-top: 0; }
        p { line-height: 1.6; color: #606770; }
        .badge { display: inline-block; background: #e6f2fc; color: #0078d4; padding: 6px 12px; border-radius: 20px; font-weight: bold; font-size: 0.9em; margin-bottom: 20px; }
        .meta { margin-top: 30px; font-size: 0.8em; color: #8d949e; border-top: 1px solid #e5e5e5; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="badge">AZURE DEPLOYMENT ACTIVE</div>
        <h1>Deployment Succeeded!</h1>
        <p>This simple Node.js web server is successfully running on your secure Azure Linux virtual machine instance, deployed via a fully automated GitHub Actions CI/CD workflow.</p>
        <p>Managed by Terraform IaC with custom Resource Group, VNet, Subnet, Network Security Group, and User-Assigned Managed Identity.</p>
        <div class="meta">
          Node.js version: \${process.version} | Host OS: \${process.platform}
        </div>
      </div>
    </body>
    </html>
  \`);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`Server running at http://0.0.0.0:\${PORT}/\`);
});`,
    
    packageJson: `{
  "name": "basic-cloud-app",
  "version": "1.0.0",
  "description": "Simple application for Azure VM deployment",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.21.2"
  }
}`,

    setupScript: `#!/bin/bash
# setup.sh - Shell script to bootstrap the Node.js app on Azure Ubuntu Linux
# This script is executed automatically on instance launch via Terraform's custom_data, 
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
sudo chown -R $USER:$USER /var/www/app || sudo chown -R azureuser:azureuser /var/www/app || true

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
    mainTf: `# Azure Resource Group, Virtual Network, and VM Deployment Configuration
# main.tf

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
  # Recommended for real projects: Store state in Azure Blob Storage container
  # backend "azurerm" {
  #   resource_group_name  = "tfstate-rg"
  #   storage_account_name = "tfstatestorageaccount"
  #   container_name       = "tfstate"
  #   key                  = "terraform.tfstate"
  # }
}

provider "azurerm" {
  features {}
}

# 1. Custom Resource Group (Logical organization boundary)
resource "azurerm_resource_group" "assessment_rg" {
  name     = "assessment-resources-rg"
  location = var.azure_location

  tags = {
    Environment = "production"
    ManagedBy   = "Terraform"
  }
}

# 2. Virtual Network and Subnet
resource "azurerm_virtual_network" "vnet" {
  name                = "assessment-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.assessment_rg.location
  resource_group_name = azurerm_resource_group.assessment_rg.name
}

resource "azurerm_subnet" "public_subnet" {
  name                 = "assessment-public-subnet"
  resource_group_name  = azurerm_resource_group.assessment_rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.0.1.0/24"]
}

# 3. Reserved Public Static IP Address
resource "azurerm_public_ip" "vm_ip" {
  name                = "assessment-vm-public-ip"
  location            = azurerm_resource_group.assessment_rg.location
  resource_group_name = azurerm_resource_group.assessment_rg.name
  allocation_method   = "Static"
  sku                 = "Standard"
}

# 4. Network Security Group (NSG) and Rules (Stateful Firewall)
resource "azurerm_network_security_group" "nsg" {
  name                = "assessment-vm-nsg"
  location            = azurerm_resource_group.assessment_rg.location
  resource_group_name = azurerm_resource_group.assessment_rg.name

  security_rule {
    name                       = "AllowHTTP"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "AllowHTTPS"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "AllowSSH"
    priority                   = 120
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = var.allowed_ssh_cidr
    destination_address_prefix = "*"
  }
}

# 5. Network Interface Card (NIC) with Static IP and NSG Association
resource "azurerm_network_interface" "vm_nic" {
  name                = "assessment-vm-nic"
  location            = azurerm_resource_group.assessment_rg.location
  resource_group_name = azurerm_resource_group.assessment_rg.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.public_subnet.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.vm_ip.id
  }
}

resource "azurerm_network_interface_security_group_association" "nic_nsg_assoc" {
  network_interface_id      = azurerm_network_interface.vm_nic.id
  network_security_group_id = azurerm_network_security_group.nsg.id
}

# 6. Linux Virtual Machine (Compute Resource)
resource "azurerm_linux_virtual_machine" "app_server" {
  name                = "assessment-web-server"
  resource_group_name = azurerm_resource_group.assessment_rg.name
  location            = azurerm_resource_group.assessment_rg.location
  size                = var.vm_size
  admin_username      = var.admin_username
  network_interface_ids = [
    azurerm_network_interface.vm_nic.id,
  ]

  # Attach Managed Security Identities
  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.vm_identity.id]
  }

  # SSH Authentication Key
  admin_ssh_key {
    username   = var.admin_username
    public_key = var.ssh_public_key
  }

  # Standard Ubuntu Server image
  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "StandardSSD_LRS"
    disk_size_gb         = 30
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts-gen2"
    version   = "latest"
  }

  # Startup Custom Data Script (for core basic updates)
  custom_data = base64encode(<<-EOF
                #!/bin/bash
                apt-get update -y
                apt-get install -y git
                EOF
  )
}`,

    variablesTf: `# Input Variables for Azure Infrastructure
# variables.tf

variable "azure_location" {
  type        = string
  description = "Target deployment Azure Region location"
  default     = "East US"
}

variable "vm_size" {
  type        = string
  description = "Size dimensions of Virtual Machine"
  default     = "Standard_B1s"
}

variable "admin_username" {
  type        = string
  description = "Root administrator login username"
  default     = "azureuser"
}

variable "ssh_public_key" {
  type        = string
  description = "SSH Public Key string for login"
}

variable "allowed_ssh_cidr" {
  type        = string
  description = "CIDR block permitted to establish SSH connects"
  default     = "*"
}
`,

    outputsTf: `# Azure Outputs
# outputs.tf

output "resource_group_name" {
  value       = azurerm_resource_group.assessment_rg.name
  description = "Resource Group logical container name"
}

output "instance_public_ip" {
  value       = azurerm_public_ip.vm_ip.ip_address
  description = "Public static IPv4 address"
}

output "app_url" {
  value       = "http://\${azurerm_public_ip.vm_ip.ip_address}"
  description = "Web address of the running app server"
}
`,

    iamTf: `# Managed Identities and Access Control (IAM)
# iam.tf

# 1. User-Assigned Managed Identity attached to Virtual Machine
resource "azurerm_user_assigned_identity" "vm_identity" {
  location            = azurerm_resource_group.assessment_rg.location
  resource_group_name = azurerm_resource_group.assessment_rg.name
  name                = "assessment-vm-identity"
}

# 2. Minimalist Role Assignment (e.g. read access to Azure Key Vault secrets)
resource "azurerm_role_assignment" "keyvault_reader" {
  scope                = "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/\${azurerm_resource_group.assessment_rg.name}"
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.vm_identity.principal_id
}


# --- BONUS SECURITY DESIGN: AZURE OIDC INTEGRATION FOR GITHUB ACTIONS ---
# Secure OIDC token-exchange setup so GitHub Actions authenticates without subscription password files.

resource "azurerm_user_assigned_identity" "github_deployer" {
  location            = azurerm_resource_group.assessment_rg.location
  resource_group_name = azurerm_resource_group.assessment_rg.name
  name                = "assessment-github-deployer"
}

resource "azurerm_federated_identity_credential" "github_federation" {
  name                = "github-actions-federated"
  resource_group_name = azurerm_resource_group.assessment_rg.name
  audience            = ["api://AzureADTokenExchange"]
  issuer              = "https://token.actions.githubusercontent.com"
  parent_id           = azurerm_user_assigned_identity.github_deployer.id
  subject             = "repo:my-github-username/my-cloud-assessment:ref:refs/heads/main"
}
`
  },

  githubActions: `# GitHub Actions CI/CD Pipeline Workflow
# .github/workflows/deploy-azure.yml
name: Build & Deploy Node.js App to Azure VM

on:
  push:
    branches:
      - main

permissions:
  id-token: write # Required for Azure OIDC Federated Login
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

      # SECURE AZURE OIDC FEDERATED LOGIN (Best practice - no service principal credentials files)
      - name: Azure Login via OIDC Federated Identity
        uses: azure/login@v2
        with:
          client-id: \${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: \${{ secrets.AZURE_TENANT_ID }}
          subscription-id: \${{ secrets.AZURE_SUBSCRIPTION_ID }}

      # SSH DEPLOYMENT via secure SSH Private Key stored in GitHub Secrets
      - name: Copy App Files to Azure VM
        uses: appleboy/scp-action@v0.1.7
        with:
          host: \${{ secrets.VM_PUBLIC_IP }}
          username: azureuser
          key: \${{ secrets.SSH_PRIVATE_KEY }}
          port: 22
          source: "server.js,package.json,package-lock.json,setup.sh"
          target: "/var/www/app"

      - name: Execute Setup & PM2 Boot Script
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: \${{ secrets.VM_PUBLIC_IP }}
          username: azureuser
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
          STATUS=$(curl -o /dev/null -s -w "%{http_code}" http://\${{ secrets.VM_PUBLIC_IP }}/health)
          if [ "$STATUS" -eq 200 ]; then
            echo "SUCCESS: Microsoft Azure virtual machine application is online & healthy!"
          else
            echo "ERROR: Received HTTP status $STATUS. Deployment marked as FAILED."
            exit 1
          fi
`,

  instances: [
    { type: 'Standard_B1s', vcpu: '1', ram: '1.0 GB', monthlyCost: 7.59, description: 'Azure Free tier eligible (under 12 months free plan). Excellent for light developer sandbox tests.' },
    { type: 'Standard_B1ms', vcpu: '1', ram: '2.0 GB', monthlyCost: 15.18, description: 'Double memory profile, useful for larger Express applications.' },
    { type: 'Standard_B2s', vcpu: '2', ram: '4.0 GB', monthlyCost: 30.36, description: 'Substantial memory and dual cores, good for multi-process Node scripts.' }
  ],
  storageCostGb: 0.08, // Standard SSD storage cost per GB
  dataTransferCostGb: 0.08, // Internet outbound egress cost per GB (after free tier)

  readmeMarkdown: `# Cloud Infrastructure Assessment Submission (Azure Target)

This repository contains the infrastructure configuration, deployment automation workflows, and simple application scripts required to deploy a basic web application onto Microsoft Azure.

---

## 1. Architectural Decisions & Design Rationale

This setup is built on Azure-native patterns, focusing on maximum resource isolation, high security, and minimal monthly costs.

### Logical Isolation via Resource Group (RG)
* **Decision**: Grouping all provisioned resources under a specific dedicated Resource Group (\`assessment-resources-rg\`).
* **Reasoning**: Azure Resource Groups represent logical boundaries. Placing all components (VNet, NIC, Public IP, NSG, VM) within one group permits atomic management, simple audit logs, and clean bulk deletions during teardown, preventing "ghost" resources from leaking billing fees.

### Custom Virtual Network & Subnet Security
* **Decision**: Deployed inside a custom Virtual Network (VNet) with a CIDR of \`10.0.0.0/16\` and associated the subnet explicitly with a regional Network Security Group (NSG) restricting inbound traffic.
* **Reasoning**: A custom VNet provides full control over DNS routing and network access. Associating the Network Security Group (NSG) at the NIC/subnet level guarantees stateful firewall traffic checks are performed before packets reach the VM kernel. 

### User-Assigned Managed Identity (IAM Boundary)
* **Decision**: Attaching an explicit User-Assigned Managed Identity (\`assessment-vm-identity\`) to the Virtual Machine rather than broad admin roles.
* **Reasoning**: In cloud computing, VMs should never store static database passwords or subscription secrets in plaintext configuration files. Attaching a Managed Identity (which is backed by an Azure AD service principal) permits the VM to securely fetch secrets from **Azure Key Vault** using temporary local OAuth tokens, satisfying the security principle of least privilege.

---

## 2. CI/CD Deployment Pipeline (GitHub Actions)

Our automated CI/CD pipeline triggers immediately on push events to the \`main\` branch.

### Integrated Security: Azure Federated Identity (OIDC)
* **Best Practice**: No broad Service Principal credentials files or subscription passwords are saved in GitHub Secrets.
* **Implementation**: We establish an Azure Active Directory Federated Identity Credential that trusts GitHub's secure token issuer. The GitHub Actions worker utilizes OIDC to log in, establishing short-lived, subscription-scoped sessions without any shared passwords.
* **Process Flow**:
  1. **Source Validation**: Evaluates syntax correctness and structural tests.
  2. **Federated Login**: Standard runner negotiates dynamic access directly with Azure AD.
  3. **File Transport**: SCP moves code, \`package.json\`, and the bootstrap script to the target folder (\`/var/www/app\`).
  4. **System Bootstrap**: Run-commands execute the \`setup.sh\` script, which upgrades Ubuntu dependencies, mounts the app, configures public Nginx listeners, and boots the process in a persistent **PM2** context.
  5. **Probe Check**: Verifies active server responses via standard health curls.

---

## 3. Cost Awareness & Architectural Trade-offs

### Compute VM & Storage Sizing
* **Selected Size**: \`Standard_B1s\` (1 vCPU, 1 GB RAM). This size is highly affordable and falls directly under Azure's **12-month Free services list**, allowing testing without billing charges.
* **OS Disk Storage**: 30 GB **Standard SSD (StandardSSD_LRS)** locally redundant storage. Standard SSDs offer a sweet spot of consistent low-latency IOPS ($0.08/GB) at a lower cost than Premium SSDs ($0.15/GB).

| Cost Component | Monthly Pricing (USD) | Annual Estimation (USD) |
| :--- | :--- | :--- |
| **Standard_B1s Compute** | $7.59 (or $0.00 Free Tier) | $91.08 (or $0.00 Free Tier) |
| **Standard SSD (30GB)** | $2.40 | $28.80 |
| **Data Transfer (10GB egress)** | $0.80 | $9.60 |
| **Total Estimate** | **$10.79** | **$129.48** |

### Trade-offs: Virtual Machine vs. Azure App Service
1. **Azure Virtual Machine**:
   * *Pros*: Zero architectural lock-in, complete administrative host access, lets us customize filesystem caching, runs standard system processes (Nginx, PM2), and has simple local debugging.
   * *Cons*: Requires regular Linux operating system security upgrades, and must be configured with manual failovers/scaling rules.
2. **Azure App Service (PaaS)**:
   * *Pros*: Fully managed OS patching, automatic TLS certificate renewals, built-in scaling sliders, and direct deployment from Git.
   * *Cons*: Costs scale higher than B-series VMs under 24/7 continuous loads, and file system boundaries are completely restricted.
3. *Final Decision*: An Azure VM (\`Standard_B1s\`) is preferred for this assessment to highlight hands-on familiarity with networking architectures (VNets, NIC configurations, security groups), and terminal-level web server setups (Nginx, pm2).
`
};
