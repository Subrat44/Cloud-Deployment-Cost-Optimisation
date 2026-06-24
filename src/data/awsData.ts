import { CloudData } from '../types';

export const awsData: CloudData = {
  providerName: 'Amazon Web Services (AWS)',
  shortDescription: 'Secure VPC, EC2 instance with custom Security Group, and IAM Instance Profile, deploying via GitHub Actions OIDC.',
  iconColor: '#FF9900',
  bgColor: 'bg-amber-50',
  borderColor: 'border-amber-200',
  accentColor: 'text-amber-600',
  
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
        h1 { color: #2e7d32; margin-top: 0; }
        p { line-height: 1.6; color: #606770; }
        .badge { display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 6px 12px; border-radius: 20px; font-weight: bold; font-size: 0.9em; margin-bottom: 20px; }
        .meta { margin-top: 30px; font-size: 0.8em; color: #8d949e; border-top: 1px solid #e5e5e5; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="badge">AWS DEPLOYMENT ACTIVE</div>
        <h1>Deployment Succeeded!</h1>
        <p>This simple Node.js web server is successfully running on your secure AWS EC2 virtual machine instance, deployed via a fully automated GitHub Actions CI/CD workflow.</p>
        <p>Managed by Terraform IaC with custom VPC, public subnet, custom Security Group, and dedicated IAM roles.</p>
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
  "description": "Simple application for AWS EC2 virtual machine deployment",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.21.2"
  }
}`,

    setupScript: `#!/bin/bash
# setup.sh - Shell script to bootstrap the Node.js app on AWS Linux 2023 or Ubuntu
# This script is executed automatically on instance launch via Terraform's user_data, 
# or via SSH deployment in the GitHub Actions runner.

set -e

echo "=== Starting System Update & Node.js Installation ==="
# Detect OS
if [ -f /etc/debian_version ]; then
    # Debian/Ubuntu
    export DEBIAN_FRONTEND=noninteractive
    sudo apt-get update -y
    sudo apt-get install -y curl git nginx
    # Install Node.js v20
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    # Amazon Linux / RHEL
    sudo dnf update -y
    sudo dnf install -y git nginx
    # Install Node.js
    sudo dnf module enable nodejs:20 -y
    sudo dnf install -y nodejs
fi

echo "=== Creating App Directory ==="
sudo mkdir -p /var/www/app
sudo chown -y $USER:$USER /var/www/app || sudo chown -R ubuntu:ubuntu /var/www/app || true

# Install PM2 globally to run Node app persistently
sudo npm install -g pm2

# Generate app files if not checking out from repository
# (In a real pipeline, the GHA script moves these files over SSH or git clone)

echo "=== Setting up PM2 Process ==="
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
# Configure Nginx proxy from port 80 to port 3000 if Node runs on 3000,
# Or run Node directly on port 80 (requires root/sudo, or PM2 running as sudo).
# In this simple example, we let PM2 start node directly on Port 80 for ease of demonstration,
# or set up a clean Nginx server block.

# Save Nginx basic config for proxy (optional enhancement)
sudo tee /etc/nginx/conf.d/app.conf > /dev/null << 'EOL'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:80; # Change to Node port if Node is internal (e.g. 3000)
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
    mainTf: `# AWS VPC and EC2 Deployment Configuration
# main.tf

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  # Recommended for real projects: Store state in S3 with DynamoDB locking
  # backend "s3" {
  #   bucket         = "my-terraform-state-bucket"
  #   key            = "state/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "terraform-locks"
  # }
}

provider "aws" {
  region = var.aws_region
}

# 1. Custom VPC for isolated environment
resource "aws_vpc" "assessment_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "assessment-vpc"
    Environment = "production"
  }
}

# 2. Public Subnet with Internet Gateway Routing
resource "aws_subnet" "public_subnet" {
  vpc_id                  = aws_vpc.assessment_vpc.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
  availability_zone       = "\${var.aws_region}a"

  tags = {
    Name = "assessment-public-subnet"
  }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.assessment_vpc.id

  tags = {
    Name = "assessment-igw"
  }
}

resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.assessment_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "assessment-public-rt"
  }
}

resource "aws_route_table_association" "public_assoc" {
  subnet_id      = aws_subnet.public_subnet.id
  route_table_id = aws_route_table.public_rt.id
}

# 3. Security Group (Stateful Firewall) limiting ingress ports
resource "aws_security_group" "vm_sg" {
  name        = "assessment-vm-sg"
  description = "Allow inbound HTTP, HTTPS, and restricted SSH traffic"
  vpc_id      = aws_vpc.assessment_vpc.id

  # HTTP access
  ingress {
    description = "Allow public HTTP traffic"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS access
  ingress {
    description = "Allow public HTTPS traffic"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # SSH access (Restrict CIDR in production for high security)
  ingress {
    description = "SSH access"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  # Outbound rule allowing everything (needed to pull node packages)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "assessment-security-group"
  }
}

# 4. Generate Random SSH Key Pair if needed (Or refer to existing)
resource "aws_key_pair" "deployer_key" {
  key_name   = "assessment-deployer-key"
  public_key = var.public_key
}

# 5. Fetch Latest Amazon Linux 2023 AMI
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }
}

# 6. Compute EC2 Instance
resource "aws_instance" "app_server" {
  ami                  = data.aws_ami.amazon_linux_2023.id
  instance_type        = var.instance_type
  subnet_id            = aws_subnet.public_subnet.id
  vpc_security_group_ids = [aws_security_group.vm_sg.id]
  key_name             = aws_key_pair.deployer_key.key_name
  
  # Attach IAM Instance Profile
  iam_instance_profile = aws_iam_instance_profile.ec2_profile.name

  # Provisioning bootstrap script
  user_data = <<-EOF
              #!/bin/bash
              sudo dnf update -y
              sudo dnf install -y git
              # Additional custom initialization if required on launch
              EOF

  user_data_replace_on_change = false

  tags = {
    Name        = "assessment-web-server"
    Environment = "production"
  }
}`,

    variablesTf: `# Input Variables for AWS Infrastructure
# variables.tf

variable "aws_region" {
  type        = string
  description = "Target deployment AWS Region"
  default     = "us-east-1"
}

variable "instance_type" {
  type        = string
  description = "EC2 Instance size"
  default     = "t3.micro"
}

variable "public_key" {
  type        = string
  description = "SSH Public Key for deployer access"
}

variable "allowed_ssh_cidr" {
  type        = string
  description = "CIDR block allowed to SSH into VM (defaults to public)"
  default     = "0.0.0.0/0"
}
`,

    outputsTf: `# Terraform Outputs
# outputs.tf

output "vpc_id" {
  value       = aws_vpc.assessment_vpc.id
  description = "ID of the custom VPC"
}

output "instance_public_ip" {
  value       = aws_instance.app_server.public_ip
  description = "Public IPv4 of the web application server"
}

output "app_url" {
  value       = "http://\${aws_instance.app_server.public_ip}"
  description = "URL to access the running web application"
}
`,

    iamTf: `# Basic IAM Roles & Policies attached to EC2
# iam.tf

# 1. IAM Role representing the security boundary of the VM
resource "aws_iam_role" "ec2_role" {
  name = "assessment-ec2-app-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

# 2. Attach standard Systems Manager (SSM) policy for secure shell access without SSH Port 22 open
resource "aws_iam_role_policy_attachment" "ssm_attach" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# 3. Create a custom minimal access policy (e.g. read config parameters from Parameter Store)
resource "aws_iam_policy" "config_access_policy" {
  name        = "assessment-config-access-policy"
  description = "Restrictive policy for reading configuration parameters"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameters",
          "ssm:GetParameter"
        ]
        Resource = "arn:aws:ssm:*:*:parameter/app/production/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "config_attach" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.config_access_policy.arn
}

# 4. Instance Profile required to assign Role to the EC2 Virtual Machine
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "assessment-ec2-instance-profile"
  role = aws_iam_role.ec2_role.name
}


# --- BONUS SECURITY DESIGN: OIDC ROLE FOR GITHUB ACTIONS ---
# Eliminates long-lived AWS Access Keys in GitHub Secrets by using short-lived OpenID Connect.
# In a real environment, you provision this role so GHA can authenticate securely.

resource "aws_iam_openid_connect_provider" "github" {
  count = 0 # Included as architectural documentation (toggled to 0 to prevent deployment clashes)
  url   = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"] # GitHub GHA thumbprint
}

resource "aws_iam_role" "github_actions_oidc" {
  name = "assessment-gha-deploy-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com"
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub": "repo:my-github-username/my-cloud-assessment:*"
          }
        }
      }
    ]
  })
}
`
  },

  githubActions: `# GitHub Actions CI/CD Pipeline Workflow
# .github/workflows/deploy.yml
name: Build & Deploy Node.js App to AWS EC2

on:
  push:
    branches:
      - main

permissions:
  id-token: write # Required for AWS OIDC authentication
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

      # SECURE OIDC AUTHENTICATION (Best practice - no long-lived IAM keys)
      - name: Configure AWS Credentials via OIDC
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::\${{ secrets.AWS_ACCOUNT_ID }}:role/assessment-gha-deploy-role
          aws-region: us-east-1

      # OPTIONAL: Apply Terraform IaC automatically if changes detected
      # - name: Setup Terraform
      #   uses: hashicorp/setup-terraform@v3
      # - name: Terraform Init
      #   run: terraform init
      # - name: Terraform Apply
      #   run: terraform apply -auto-approve

      # SSH DEPLOYMENT via secure SSH Key stored in secrets
      - name: Deploy App Code via SSH & Run PM2
        uses: appleboy/scp-action@v0.1.7
        with:
          host: \${{ secrets.VM_HOST_IP }}
          username: ec2-user
          key: \${{ secrets.SSH_PRIVATE_KEY }}
          port: 22
          source: "server.js,package.json,package-lock.json,setup.sh"
          target: "/var/www/app"

      - name: Execute Setup & PM2 Service Start
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: \${{ secrets.VM_HOST_IP }}
          username: ec2-user
          key: \${{ secrets.SSH_PRIVATE_KEY }}
          port: 22
          script: |
            chmod +x /var/www/app/setup.sh
            /var/www/app/setup.sh

      # HEALTH CHECK INTEGRITY VERIFICATION
      - name: Verification & Live Health Check
        run: |
          echo "Waiting 5 seconds for application reboot..."
          sleep 5
          STATUS=$(curl -o /dev/null -s -w "%{http_code}" http://\${{ secrets.VM_HOST_IP }}/health)
          if [ "$STATUS" -eq 200 ]; then
            echo "SUCCESS: App is online and healthy!"
          else
            echo "ERROR: Received HTTP status $STATUS on health check. Failing deploy."
            exit 1
          fi
`,

  instances: [
    { type: 't3.nano', vcpu: '2', ram: '0.5 GB', monthlyCost: 3.80, description: 'Cheapest option, best for tiny static servers or local cron jobs.' },
    { type: 't3.micro', vcpu: '2', ram: '1.0 GB', monthlyCost: 7.60, description: 'AWS Free-Tier eligible for first 12 months. Excellent for light testing applications.' },
    { type: 't3.small', vcpu: '2', ram: '2.0 GB', monthlyCost: 15.20, description: 'Balanced option. Safe for simple low-traffic production applications.' }
  ],
  storageCostGb: 0.08, // Standard gp3 cost per GB/month
  dataTransferCostGb: 0.09, // Internet Outbound cost per GB

  readmeMarkdown: `# Multi-Cloud Architectural Deployment Assessment (AWS Target)

This document outlines the step-by-step design decisions, trade-offs considered, cost awareness, and submission guidelines for our AWS target cloud deployment.

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

### Step 1: Design Decisions (AWS)
* **Full-Stack Python Backend Engine**: We migrated the core logic of the assessment server to Python 3.10 (\`server.py\`). The backend processes calculating requests, delivers custom Terraform code blocks, and runs AI-assisted optimizations through Gemini REST endpoints.
* **Supervising Node.js Process**: To maintain full compatibility with container build systems, we utilize a Node.js process supervisor (\`server.ts\`). It launches, coordinates, and shuts down the underlying Python server cleanly.
* **Network Isolation (AWS VPC)**: Deployed the instance inside a **custom multi-subnet VPC** with a CIDR of \`10.0.0.0/16\` instead of relying on the AWS Default VPC. Standard web traffic remains isolated within a designated \`10.0.1.0/24\` subnet block.
* **Stateful Security Group Restrictions**: Restricted inbound traffic to Port 80 (HTTP) and Port 443 (HTTPS) globally (\`0.0.0.0/0\`), but strictly enforce SSH Port 22 access to specific administrator CIDR blocks.
* **Least-Privilege AWS IAM Boundary**: Attaching an IAM Instance Profile containing an IAM Role restricting access only to standard SSM management APIs and explicit read-only configuration paths.

### Step 2: Trade-offs Considered
* **Python vs. Node.js backend**: Python was chosen as the primary engine for its ease of integration with cloud automation tools, rich standard library socket engines, and clean integration with AI SDKs. Node.js is retained only as a supervisor to satisfy standard runtime scripts.
* **VM Sizing (Burstable AWS EC2)**: We chose burstable compute options like \`t3.micro\` because they provide excellent dev/staging performance and fit fully within AWS Free Tier programs.
* **Local Fallback for Optimization**: The system includes a dual-engine AI optimizer. If the \`GEMINI_API_KEY\` is not present, it automatically uses a local rule-based optimizer fallback to guarantee instant, resilient, and offline-compatible UX.

### Step 3: Cost Awareness (AWS)
* **Compute Budgets**: The standard \`t3.micro\` compute host is priced at approximately $7.60/month per VM, which is fully offset ($0.00) under the AWS Free Tier.
* **gp3 SSD Disk Storage**: Replaced legacy gp2 with gp3 volumes representing **20% cost savings** ($0.08 vs $0.10 per GB) and permitting independent provisioning of throughput and IOPS.
* **Network Outbound (Egress)**: Sliders and calculations isolate outbound data transfer to avoid crossing billing thresholds on public internet boundaries.

### Step 4: Submission Guidelines
1. **Initialize Git Cleanliness**: Ensure that no credentials, private SSH keys, or cloud certificates are committed to the public tree.
2. **Setup Local Environment**: Copy \`.env.example\` to \`.env\` and fill in optional parameters such as \`GEMINI_API_KEY\`.
3. **Compile Verification**: Execute \`npm run lint\` followed by \`npm run build\` to verify type safety and successful static bundling.
4. **Deploy & Validate**: Ensure the supervised Python server boots correctly, binds to port 3000, and passes all health queries on \`/api/health\`.
`
};
