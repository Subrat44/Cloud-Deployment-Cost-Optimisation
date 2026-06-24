# providers_data.py
# Python representation of Cloud Providers and VM specifications / costs.

PROVIDERS = {
    "aws": {
        "providerName": "Amazon Web Services (AWS)",
        "shortDescription": "Secure VPC, EC2 instance with custom Security Group, and IAM Instance Profile, deploying via GitHub Actions OIDC.",
        "iconColor": "#FF9900",
        "bgColor": "bg-amber-50",
        "borderColor": "border-amber-200",
        "accentColor": "text-amber-600",
        "storageCostGb": 0.08,
        "dataTransferCostGb": 0.09,
        "instances": [
            {
                "type": "t3.micro",
                "vcpu": "2 vCPU",
                "ram": "1 GB",
                "monthlyCost": 7.58,
                "description": "General Purpose burstable instance. Suitable for light microservices and test environments."
            },
            {
                "type": "t3.small",
                "vcpu": "2 vCPU",
                "ram": "2 GB",
                "monthlyCost": 15.16,
                "description": "Burstable performance instance. Good for low-to-medium traffic web applications."
            },
            {
                "type": "t3.medium",
                "vcpu": "2 vCPU",
                "ram": "4 GB",
                "monthlyCost": 30.32,
                "description": "Balanced performance. Ideal for standard web applications and small databases."
            },
            {
                "type": "t3.large",
                "vcpu": "2 vCPU",
                "ram": "8 GB",
                "monthlyCost": 60.64,
                "description": "Production scale. Ideal for memory-intensive backend APIs and container tasks."
            }
        ]
    },
    "gcp": {
        "providerName": "Google Cloud Platform (GCP)",
        "shortDescription": "Secure VPC Network, Compute Engine VM with custom Firewall Rules, IAM Service Account, and GitHub Actions OIDC Workload Identity Federation.",
        "iconColor": "#4285F4",
        "bgColor": "bg-blue-50",
        "borderColor": "border-blue-200",
        "accentColor": "text-blue-600",
        "storageCostGb": 0.04,
        "dataTransferCostGb": 0.08,
        "instances": [
            {
                "type": "e2-micro",
                "vcpu": "2 vCPU (shared)",
                "ram": "1 GB",
                "monthlyCost": 6.11,
                "description": "Cost-optimized shared-core machine. Best for background cron jobs and lightweight APIs."
            },
            {
                "type": "e2-small",
                "vcpu": "2 vCPU (shared)",
                "ram": "2 GB",
                "monthlyCost": 12.21,
                "description": "Shared-core with moderate memory. Suitable for microservices and small staging deployments."
            },
            {
                "type": "e2-medium",
                "vcpu": "2 vCPU",
                "ram": "4 GB",
                "monthlyCost": 24.42,
                "description": "Dedicated dual-core performance. Great for responsive standard APIs and Redis stores."
            },
            {
                "type": "e2-standard-2",
                "vcpu": "2 vCPU",
                "ram": "8 GB",
                "monthlyCost": 48.84,
                "description": "Production standard VM. Tailored for enterprise-grade backend engines."
            }
        ]
    },
    "azure": {
        "providerName": "Microsoft Azure",
        "shortDescription": "Secure Resource Group, Virtual Network, Network Security Group (NSG), Linux VM with Managed Identity, and GitHub Actions OIDC Azure Login.",
        "iconColor": "#0089D6",
        "bgColor": "bg-sky-50",
        "borderColor": "border-sky-200",
        "accentColor": "text-sky-600",
        "storageCostGb": 0.05,
        "dataTransferCostGb": 0.087,
        "instances": [
            {
                "type": "Standard_B1s",
                "vcpu": "1 vCPU",
                "ram": "1 GB",
                "monthlyCost": 7.30,
                "description": "Burstable VM sizing. Perfect for small dev-test benches and low-duty timers."
            },
            {
                "type": "Standard_B1ms",
                "vcpu": "1 vCPU",
                "ram": "2 GB",
                "monthlyCost": 14.60,
                "description": "Economic burstable VM with extra RAM. Good for moderate microservices."
            },
            {
                "type": "Standard_B2s",
                "vcpu": "2 vCPU",
                "ram": "4 GB",
                "monthlyCost": 29.20,
                "description": "Highly responsive dual-core burstable VM. Great for mid-tier app hosting."
            },
            {
                "type": "Standard_B2ms",
                "vcpu": "2 vCPU",
                "ram": "8 GB",
                "monthlyCost": 58.40,
                "description": "High RAM burstable option. Solid choice for heavy runtime environments."
            }
        ]
    }
}
