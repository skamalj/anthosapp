terraform {
  required_providers {
    google = {
      source = "hashicorp/google"
      version = "~> 3.10"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.0"
    }
  }
}

# Configure the AWS Provider
provider "aws" {
  region = "eu-west-1"
}

# Configure the GCP Provider
provider "google" {
  project = var.gcp_project
  region  = var.gcp_region
}

module "gcp-anthos-iam" {
  source = "./GCP/IAM"

  gcp_project = var.gcp_project
}

module "gcp-anthos-gke" {
  count = var.gke == "Y" ? 1 : 0
  source = "./GCP/GKE"

  gcp_project = var.gcp_project
  gcp_region = var.gcp_region
}

module "gcp-anthos-kubeadm" {
  count = var.kubeadm == "Y" ? 1 : 0

  source = "./KUBEADM-K8S"

  gcp_project=var.gcp_project
  gvisor=var.gvisor
  num_of_workers= var.num_of_workers
  cni_provider= var.cni_provider
}

module "aws-eks" {
  source = "./AWS"
}