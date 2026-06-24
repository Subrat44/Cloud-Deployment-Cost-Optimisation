# server.py
# Standard Library Python Full-stack Backend Server
# Binds to Port 3000 to comply with Cloud Run constraints.

import os
import json
import mimetypes
import traceback
import urllib.request
import urllib.error
from http.server import BaseHTTPRequestHandler
from socketserver import ThreadingTCPServer
from providers_data import PROVIDERS

PORT = int(os.environ.get("PORT", 3000))

class CombinedHTTPHandler(BaseHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS for local cross-port dev proxy if needed
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        url_parsed = urllib.parse.urlparse(self.path)
        path = url_parsed.path

        # Handle API Routes
        if path.startswith('/api/'):
            self.handle_api_get(path, url_parsed)
        else:
            # Serve static files from the build directory
            self.serve_static(path)

    def do_POST(self):
        url_parsed = urllib.parse.urlparse(self.path)
        path = url_parsed.path

        if path.startswith('/api/'):
            # Parse body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else ""
            self.handle_api_post(path, body)
        else:
            self.send_error(405, "Method Not Allowed")

    def handle_api_get(self, path, url_parsed):
        if path == '/api/health':
            self.send_json({"status": "ok", "runtime": "Python 3.10", "message": "Python backend active"})
        elif path == '/api/providers':
            self.send_json(PROVIDERS)
        elif path == '/api/pipeline/simulate':
            params = urllib.parse.parse_qs(url_parsed.query)
            provider = params.get('provider', ['aws'])[0]
            self.send_json(self.generate_pipeline_simulation_logs(provider))
        else:
            self.send_error(404, "API Endpoint Not Found")

    def handle_api_post(self, path, body):
        try:
            data = json.loads(body) if body else {}
        except json.JSONDecodeError:
            self.send_error(400, "Invalid JSON Body")
            return

        if path == '/api/calculate':
            self.handle_calculate(data)
        elif path == '/api/terraform':
            self.handle_terraform(data)
        elif path == '/api/optimize':
            self.handle_optimize(data)
        else:
            self.send_error(404, "API Endpoint Not Found")

    def send_json(self, data, status=200):
        try:
            response_bytes = json.dumps(data).encode('utf-8')
            self.send_response(status)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(response_bytes)))
            self.end_headers()
            self.wfile.write(response_bytes)
        except Exception as e:
            print(f"Error sending JSON response: {e}")

    def handle_calculate(self, data):
        # Server-side Cost Calculation Logic
        provider = data.get('provider', 'aws')
        instance_type = data.get('instanceType')
        disk_gb = int(data.get('diskGb', 15))
        egress_gb = int(data.get('egressGb', 10))
        instance_count = int(data.get('instanceCount', 1))

        prov_data = PROVIDERS.get(provider)
        if not prov_data:
            self.send_json({"error": "Unknown provider"}, 400)
            return

        # Find instance specs
        instance_obj = next((inst for inst in prov_data['instances'] if inst['type'] == instance_type), prov_data['instances'][0])
        
        compute_cost = instance_obj['monthlyCost'] * instance_count
        storage_cost = disk_gb * prov_data['storageCostGb'] * instance_count
        network_cost = egress_gb * prov_data['dataTransferCostGb']
        total_monthly_cost = compute_cost + storage_cost + network_cost
        total_annual_cost = total_monthly_cost * 12

        self.send_json({
            "provider": provider,
            "instanceType": instance_obj['type'],
            "vcpu": instance_obj['vcpu'],
            "ram": instance_obj['ram'],
            "instanceCount": instance_count,
            "diskGb": disk_gb,
            "egressGb": egress_gb,
            "computeCost": compute_cost,
            "storageCost": storage_cost,
            "networkCost": network_cost,
            "totalMonthly": total_monthly_cost,
            "totalAnnual": total_annual_cost
        })

    def handle_terraform(self, data):
        provider = data.get('provider', 'aws')
        instance_type = data.get('instanceType', 't3.micro')
        disk_gb = int(data.get('diskGb', 15))
        instance_count = int(data.get('instanceCount', 1))

        tf_code = self.generate_custom_terraform(provider, instance_type, disk_gb, instance_count)
        self.send_json(tf_code)

    def handle_optimize(self, data):
        # AI Architect Cost Optimizer utilizing Gemini 3.5 Flash
        requirement = data.get('requirement', '')
        if not requirement:
            self.send_json({"error": "requirement parameter is required"}, 400)
            return

        gemini_key = os.environ.get("GEMINI_API_KEY")
        if not gemini_key:
            # Fallback to smart local rules if API key isn't provided
            self.send_json(self.local_optimizer_fallback(requirement))
            return

        # Call Gemini REST API
        prompt = f"""
You are an expert cloud architect and cost optimizer. You are helping a developer optimize their infrastructure selection between AWS, Azure, and GCP.
The available providers, instances, and pricing catalog are defined as:
{json.dumps(PROVIDERS, indent=2)}

Analyze the user's infrastructure requirement:
"{requirement}"

Provide a highly professional optimization report in JSON format.
You must strictly return ONLY a JSON object that has these exact keys:
- recommendation: (string, explanation of which provider is best and why)
- provider: (string, exactly 'aws', 'gcp', or 'azure')
- instanceType: (string, the recommended instance type from the list above)
- instanceCount: (number, the recommended VM count)
- diskGb: (number, the recommended SSD size)
- estimatedMonthlyCost: (number, calculated monthly cost using our rates)
- terraformSnippet: (string, a beautiful customized Terraform IaC snippet for this recommended deployment)

Do not wrap the JSON in ```json markdown blocks, just return the raw JSON text.
"""

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={gemini_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }

        try:
            req_data = json.dumps(payload).encode('utf-8')
            req = urllib.request.Request(
                url, 
                data=req_data, 
                headers={
                    "Content-Type": "application/json",
                    "User-Agent": "aistudio-build"
                }
            )
            with urllib.request.urlopen(req, timeout=15) as res:
                response_str = res.read().decode('utf-8')
                res_json = json.loads(response_str)
                
                # Extract text response from Gemini
                text_content = res_json['candidates'][0]['content']['parts'][0]['text']
                parsed_report = json.loads(text_content.strip())
                self.send_json(parsed_report)
        except Exception as e:
            print(f"Gemini Optimization Call Failed: {e}")
            traceback.print_exc()
            # Return smart fallback
            self.send_json(self.local_optimizer_fallback(requirement))

    def local_optimizer_fallback(self, requirement):
        # Robust rule-based fallback if Gemini key is missing or fails
        req_lower = requirement.lower()
        
        # Simple keywords parsing
        if "google" in req_lower or "gcp" in req_lower or "cost" in req_lower or "cheap" in req_lower:
            prov = "gcp"
            inst = "e2-micro"
            rec = "Recommended Google Cloud Platform (GCP) for maximum cost-efficiency. GCP provides the lowest base instance storage cost ($0.04/GB SSD) and standard shared vCPUs that are perfect for economic staging deployments."
            cost = 6.11 + 15 * 0.04 + 10 * 0.08
        elif "azure" in req_lower or "microsoft" in req_lower or "enterprise" in req_lower:
            prov = "azure"
            inst = "Standard_B1s"
            rec = "Recommended Microsoft Azure to leverage seamless Enterprise Active Directory OIDC integrations and robust Azure Resource Groups. Excellent burstable VM choices for light loads."
            cost = 7.30 + 15 * 0.05 + 10 * 0.087
        else:
            prov = "aws"
            inst = "t3.micro"
            rec = "Recommended Amazon Web Services (AWS) as the default highly robust, scalable standard VPC option. Highly versatile general-purpose micro instances with comprehensive security groups."
            cost = 7.58 + 15 * 0.08 + 10 * 0.09

        return {
            "recommendation": rec,
            "provider": prov,
            "instanceType": inst,
            "instanceCount": 1,
            "diskGb": 20,
            "estimatedMonthlyCost": round(cost + 5, 2),
            "terraformSnippet": f"""# Fallback Generated Terraform Snippet
resource "google_compute_instance" "vm" {{
  name         = "architect-optimized-vm"
  machine_type = "{inst}"
  zone         = "us-central1-a"
  # Optimized architecture config
}}""" if prov == "gcp" else f"""# Fallback AWS Terraform
resource "aws_instance" "vm" {{
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "{inst}"
}}"""
        }

    def generate_custom_terraform(self, provider, instance_type, disk_gb, instance_count):
        # Dynamically generate terraform blocks on the server side
        if provider == 'aws':
            return {
                "mainTf": f"""# Server-Side Generated Terraform main.tf for AWS
provider "aws" {{
  region = "us-east-1"
}}

resource "aws_vpc" "assessment_vpc" {{
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  tags = {{ Name = "candidate-deployment-vpc" }}
}}

resource "aws_security_group" "server_sg" {{
  name   = "web-server-security-group"
  vpc_id = aws_vpc.assessment_vpc.id

  ingress {{
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }}
}}

resource "aws_instance" "app_nodes" {{
  count                  = {instance_count}
  ami                    = "ami-0c55b159cbfafe1f0" # Amazon Linux 2023
  instance_type          = "{instance_type}"
  vpc_security_group_ids = [aws_security_group.server_sg.id]

  root_block_device {{
    volume_size           = {disk_gb}
    volume_type           = "gp3"
    encrypted             = true
  }}

  tags = {{ Name = "server-node-${{count.index}}" }}
}}""",
                "variablesTf": f"""variable "instance_count" {{
  type    = number
  default = {instance_count}
}}

variable "disk_size_gb" {{
  type    = number
  default = {disk_gb}
}}""",
                "outputsTf": """output "vpc_id" {
  value = aws_vpc.assessment_vpc.id
}

output "instance_ips" {
  value = aws_instance.app_nodes[*].public_ip
}"""
            }
        elif provider == 'gcp':
            return {
                "mainTf": f"""# Server-Side Generated Terraform main.tf for GCP
provider "google" {{
  project = "candidate-project"
  region  = "us-central1"
}}

resource "google_compute_network" "vpc_network" {{
  name                    = "candidate-vpc-network"
  auto_create_subnetworks = true
}}

resource "google_compute_firewall" "allow_http" {{
  name    = "allow-http-ingress"
  network = google_compute_network.vpc_network.name

  allow {{
    protocol = "tcp"
    ports    = ["80"]
  }}

  source_ranges = ["0.0.0.0/0"]
}}

resource "google_compute_instance" "app_nodes" {{
  count        = {instance_count}
  name         = "gcp-node-${{count.index}}"
  machine_type = "{instance_type}"
  zone         = "us-central1-a"

  boot_disk {{
    initialize_params {{
      image = "debian-cloud/debian-11"
      size  = {disk_gb}
      type  = "pd-ssd"
    }}
  }}

  network_interface {{
    network = google_compute_network.vpc_network.name
    access_config {{}} # External IP
  }}
}}""",
                "variablesTf": f"""variable "instance_count" {{
  type    = number
  default = {instance_count}
}}""",
                "outputsTf": """output "network_self_link" {
  value = google_compute_network.vpc_network.self_link
}"""
            }
        else: # azure
            return {
                "mainTf": f"""# Server-Side Generated Terraform main.tf for Azure
provider "azurerm" {{
  features {{}}
}}

resource "azurerm_resource_group" "rg" {{
  name     = "candidate-resources-rg"
  location = "East US"
}}

resource "azurerm_virtual_network" "vnet" {{
  name                = "deployment-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
}}

resource "azurerm_linux_virtual_machine" "app_vms" {{
  count               = {instance_count}
  name                = "azure-vm-${{count.index}}"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  size                = "{instance_type}"
  admin_username      = "azureuser"

  os_disk {{
    caching              = "ReadWrite"
    storage_account_type = "Premium_LRS"
    disk_size_gb         = {disk_gb}
  }}

  source_image_reference {{
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts"
    version   = "latest"
  }}
}}""",
                "variablesTf": f"""variable "vm_count" {{
  type    = number
  default = {instance_count}
}}""",
                "outputsTf": """output "resource_group_name" {
  value = azurerm_resource_group.rg.name
}"""
            }

    def generate_pipeline_simulation_logs(self, provider):
        # Provide rich, dynamic simulated CI/CD logs from the Python server
        logs = [
            {"text": "PYTHON BACKEND: Pipeline trigger received.", "type": "info", "timestamp": "11:15:20"},
            {"text": f"SYSTEM: Running deployment tests for {provider.upper()} cloud architecture configuration.", "type": "warning", "timestamp": "11:15:21"},
            {"text": "$ terraform init", "type": "command", "timestamp": "11:15:22"},
            {"text": "Initializing modules...", "type": "info", "timestamp": "11:15:23"},
            {"text": "Terraform has been successfully initialized!", "type": "success", "timestamp": "11:15:24"},
            {"text": "$ terraform validate", "type": "command", "timestamp": "11:15:25"},
            {"text": "Success! The configuration is valid.", "type": "success", "timestamp": "11:15:26"},
            {"text": f"PYTHON BACKEND: Successfully simulated pipeline execution for {provider.upper()}!", "type": "success", "timestamp": "11:15:27"}
        ]
        return logs

    def serve_static(self, path):
        # Resolve request path to ./dist directory
        dist_dir = os.path.join(os.getcwd(), 'dist')
        
        # Clean path to prevent directory traversal
        cleaned_path = os.path.normpath(path).lstrip('/')
        file_path = os.path.join(dist_dir, cleaned_path)

        # Fallback to serving index.html for single page application (SPA) paths
        if not os.path.exists(file_path) or os.path.isdir(file_path):
            file_path = os.path.join(dist_dir, 'index.html')

        # Send response
        try:
            mime_type, _ = mimetypes.guess_type(file_path)
            if not mime_type:
                if file_path.endswith('.ts') or file_path.endswith('.tsx'):
                    mime_type = 'text/javascript'
                else:
                    mime_type = 'application/octet-stream'

            with open(file_path, 'rb') as f:
                content = f.read()

            self.send_response(200)
            self.send_header('Content-Type', mime_type)
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            print(f"Error serving static file {file_path}: {e}")
            self.send_error(500, f"Internal Server Error: {e}")

def run():
    print(f"Starting Python server on port {PORT}...")
    server_address = ('0.0.0.0', PORT)
    httpd = ThreadingTCPServer(server_address, CombinedHTTPHandler)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()
        print("Server stopped.")

if __name__ == '__main__':
    run()
