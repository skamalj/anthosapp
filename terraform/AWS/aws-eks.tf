# Create IAM roles for EKS
module "eks-iam-roles" {
  source = "./create_iam_roles"
}

# Create VPC with privte subnets only
module "eks-vpc" {
  source = "./create_vpc"

  cidr_block = "10.2.0.0/16"
}

# Update VPC wuth public subnets , NAT gateway and IGW
# Can be disabled //todo
module "aws-eks-make-public" {
  source = "./make_vpc_public"

  eks-vpc = module.eks-vpc.eks-vpc
  eks-private-route-table = module.eks-vpc.private-route-table
}

# Create EKS cluster, only private subnets are used for cluster creation
resource "aws_eks_cluster" "eks-private-cluster" {
  name     = "eks-private-cluster"
  role_arn = module.eks-iam-roles.eks-cluster-role.arn

  vpc_config {
    subnet_ids = module.eks-vpc.eks-subnets[*].id
    endpoint_private_access = true
    endpoint_public_access = true
    public_access_cidrs = [
      "0.0.0.0/0"
    ]
  }
  
  # Ensure that IAM Role permissions are created before and deleted after EKS Cluster handling.
  # Otherwise, EKS will not be able to properly delete EKS managed EC2 infrastructure such as Security Groups.
  depends_on = [ module.eks-iam-roles ]
}

# Create Nodegroup. Nodes are created only in private subnets
resource "aws_eks_node_group" "eks-node-group-1" {
  cluster_name    = aws_eks_cluster.eks-private-cluster.name
  node_group_name = "eks-nodegroup-1"
  node_role_arn   = module.eks-iam-roles.eks-node-group-role.arn
  subnet_ids      = module.eks-vpc.eks-subnets[*].id
  instance_types = ["m5.large"]

  scaling_config {
    desired_size = 1
    max_size     = 4
    min_size     = 1
  }

  # Ensure that IAM Role permissions are created before and deleted after EKS Node Group handling.
  # Otherwise, EKS will not be able to properly delete EC2 Instances and Elastic Network Interfaces.
  depends_on = [ module.eks-iam-roles  ]
}

# Enable IAM role for service accounts 
module "enable-irsa" {
  source = "./enable_iam_role_for_ser_account"

  eks-cluster = aws_eks_cluster.eks-private-cluster
}

# Enable IAM role for service accounts 
module "enable-autoscalar" {
  source = "./enable_autoscalar"

  eks-oidc-provider = module.enable-irsa.eks-oidc-provider
}

# Outputs Endpoint and OIDC provider url
output "eks-endpoint" {
  value = aws_eks_cluster.eks-private-cluster.endpoint
}

output "eks-oidc-provider-url" {
  value = aws_eks_cluster.eks-private-cluster.identity[0].oidc[0].issuer
}

output "autoscalar-iam-role-arn" {
  value = module.enable-autoscalar.autoscalar-iam-role-arn
}