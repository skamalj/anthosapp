output "cluster_endpoint_gke" {
  value = module.gcp-anthos-gke[*].cluster_endpoint
}

output "cluster_endpoint_kubeadm" {
  value = module.gcp-anthos-kubeadm[*].instance_ips
}

output "eks-endpoint" {
  value = module.aws-eks.eks-endpoint
}

output "eks-oidc-provider-url" {
  value = module.aws-eks.eks-oidc-provider-url
}