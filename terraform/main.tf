module "gcp-anthos-iam" {
  source = "./GCP/IAM"
}

module "gcp-anthos-gke" {
  source = "./GCP/GKE"
}