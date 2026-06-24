export type CloudProvider = 'aws' | 'gcp' | 'azure';

export interface TerraformFile {
  name: string;
  content: string;
  description: string;
}

export interface CloudData {
  providerName: string;
  shortDescription: string;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  accentColor: string;
  
  // App code
  appCode: {
    serverJs: string;
    packageJson: string;
    setupScript: string;
  };
  
  // Terraform
  terraform: {
    mainTf: string;
    variablesTf: string;
    outputsTf: string;
    iamTf: string;
  };
  
  // Github Actions
  githubActions: string;
  
  // Cost estimates
  instances: Array<{
    type: string;
    vcpu: string;
    ram: string;
    monthlyCost: number;
    description: string;
  }>;
  storageCostGb: number;
  dataTransferCostGb: number;
  
  // Assessment content
  readmeMarkdown: string;
}

export interface PipelineStep {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  duration?: string;
  icon: string;
}

export interface LogLine {
  text: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'command';
  timestamp: string;
}
