# Create EKS Cluster IAM role and bindings for 
# AmazonEKSClusterPolicy & AmazonEKSVPCResourceController
resource "aws_iam_role" "eks-cluster-role" {
  name = "eks-cluster-role"

  assume_role_policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "eks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
POLICY
}

resource "aws_iam_role_policy_attachment" "eks-tf-AmazonEKSClusterPolicy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks-cluster-role.name
}

resource "aws_iam_role_policy_attachment" "eks-tf-AmazonEKSVPCResourceController" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
  role       = aws_iam_role.eks-cluster-role.name
}

# Create VPC and two subnets
resource "aws_vpc" "eks-vpc" {
  cidr_block = "10.1.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support = true
  tags = {
    Name = "eks-vpc"
  }
}

module "aws-eks-make-public" {
  source = "./MAKE_VPC_PUBLIC"

  eks-vpc = aws_vpc.eks-vpc
}

# Get availability zones for subnets
data "aws_availability_zones" "available" {
  state = "available"
}

# Create subnets 
resource "aws_subnet" "eks-subnets" {
  count = 2

  availability_zone = data.aws_availability_zones.available.names[count.index]
  cidr_block        = cidrsubnet(aws_vpc.eks-vpc.cidr_block, 4, count.index)
  vpc_id            = aws_vpc.eks-vpc.id

  tags = {
    "kubernetes.io/cluster/eks-private-cluster" = "shared"
  }
}

# Create security group for private end points 
resource "aws_security_group" "endpoint-sg" {
  name   = "endpoint-sg"
  vpc_id = aws_vpc.eks-vpc.id
}

resource "aws_security_group_rule" "endpoint-sg-443" {
  security_group_id = aws_security_group.endpoint-sg.id
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks = [ aws_vpc.eks-vpc.cidr_block ]
}

# Associate subnets with main route table
resource "aws_route_table_association" "main-route-table-association" {
  for_each =  zipmap(range(length(aws_subnet.eks-subnets)), aws_subnet.eks-subnets)
  subnet_id      = each.value.id
  route_table_id =module.aws-eks-make-public.private-route-table.id
  depends_on = [ aws_subnet.eks-subnets ]
}

# Get associated route tables - this is in case we plan to assciate separate route tables to subnet
data "aws_route_table" "route_tables" {
  for_each =  zipmap(range(length(aws_subnet.eks-subnets)), aws_subnet.eks-subnets)
  subnet_id = each.value.id
  depends_on = [ aws_route_table_association.main-route-table-association ]
}


# Create VPC endpoints required for private cluster - S3, ECR and EC2
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = aws_vpc.eks-vpc.id
  service_name = "com.amazonaws.eu-west-1.s3"
  route_table_ids = [for r in data.aws_route_table.route_tables : r.id ]
  depends_on = [ aws_subnet.eks-subnets ]
}

resource "aws_vpc_endpoint" "endpoint-ec2" {
  vpc_id              = aws_vpc.eks-vpc.id
  service_name        = "com.amazonaws.eu-west-1.ec2"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids = aws_subnet.eks-subnets[*].id

  security_group_ids = [
    aws_security_group.endpoint-sg.id,
  ]
}

resource "aws_vpc_endpoint" "endpoint-ecr" {
  vpc_id              = aws_vpc.eks-vpc.id
  service_name        = "com.amazonaws.eu-west-1.ecr.api"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids = aws_subnet.eks-subnets[*].id

  security_group_ids = [
    aws_security_group.endpoint-sg.id,
  ]
}

resource "aws_vpc_endpoint" "endpoint-dkr" {
  vpc_id              = aws_vpc.eks-vpc.id
  service_name        = "com.amazonaws.eu-west-1.ecr.dkr"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids = aws_subnet.eks-subnets[*].id

  security_group_ids = [
    aws_security_group.endpoint-sg.id,
  ]
}
######Endpoints Created ###############


resource "aws_eks_cluster" "eks-private-cluster" {
  name     = "eks-private-cluster"
  role_arn = aws_iam_role.eks-cluster-role.arn

  vpc_config {
    subnet_ids = aws_subnet.eks-subnets[*].id
    endpoint_private_access = true
    endpoint_public_access = true
    public_access_cidrs = [
      "0.0.0.0/0"
    ]
  }
  

  # Ensure that IAM Role permissions are created before and deleted after EKS Cluster handling.
  # Otherwise, EKS will not be able to properly delete EKS managed EC2 infrastructure such as Security Groups.
  depends_on = [
    aws_iam_role_policy_attachment.eks-tf-AmazonEKSClusterPolicy,
    aws_iam_role_policy_attachment.eks-tf-AmazonEKSVPCResourceController,
  ]
}

# Create IAM role for Nodegroup
resource "aws_iam_role" "eks-node-group-role" {
  name = "eks-node-group-role"

  assume_role_policy = jsonencode({
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
    Version = "2012-10-17"
  })
}

resource "aws_iam_role_policy_attachment" "eks-nodegroup-AmazonEKSWorkerNodePolicy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks-node-group-role.name
}

resource "aws_iam_role_policy_attachment" "eks-nodegroup-AmazonEKS_CNI_Policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks-node-group-role.name
}

resource "aws_iam_role_policy_attachment" "eks-nodegroup-AmazonEC2ContainerRegistryReadOnly" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks-node-group-role.name
}

# Create Nodegroup
resource "aws_eks_node_group" "eks-node-group-1" {
  cluster_name    = aws_eks_cluster.eks-private-cluster.name
  node_group_name = "eks-nodegroup-1"
  node_role_arn   = aws_iam_role.eks-node-group-role.arn
  subnet_ids      = aws_subnet.eks-subnets[*].id
  instance_types = ["m5.large"]

  scaling_config {
    desired_size = 2
    max_size     = 4
    min_size     = 1
  }

  # Ensure that IAM Role permissions are created before and deleted after EKS Node Group handling.
  # Otherwise, EKS will not be able to properly delete EC2 Instances and Elastic Network Interfaces.
  depends_on = [
    aws_iam_role_policy_attachment.eks-nodegroup-AmazonEKSWorkerNodePolicy,
    aws_iam_role_policy_attachment.eks-nodegroup-AmazonEKS_CNI_Policy,
    aws_iam_role_policy_attachment.eks-nodegroup-AmazonEC2ContainerRegistryReadOnly,
  ]
}

data "tls_certificate" "eks-oidc-issuer" {
  url = aws_eks_cluster.eks-private-cluster.identity[0].oidc[0].issuer
}

# Create OIDC provider for EKS in IAM, to facilitate linking serviceaccount
# with IAM role. 
# https://aws.amazon.com/blogs/opensource/introducing-fine-grained-iam-roles-service-accounts/
# https://docs.aws.amazon.com/eks/latest/userguide/enable-iam-roles-for-service-accounts.html 
resource "aws_iam_openid_connect_provider" "eks-oidc-provider" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks-oidc-issuer.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.eks-private-cluster.identity[0].oidc[0].issuer
}

data "aws_iam_policy_document" "my-serviceaccount-assume-role-policy" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"

    condition {
      test     = "StringEquals"
      variable = "${replace(aws_iam_openid_connect_provider.eks-oidc-provider.url, "https://", "")}:sub"
      values   = ["system:serviceaccount:default:my-serviceaccount"]
    }

    principals {
      identifiers = [aws_iam_openid_connect_provider.eks-oidc-provider.arn]
      type        = "Federated"
    }
  }
}

resource "aws_iam_role" "my-eks-sa-role" {
  assume_role_policy = data.aws_iam_policy_document.my-serviceaccount-assume-role-policy.json
  name               = "my-eks-sa-role"
}

resource "aws_iam_role_policy_attachment" "my-sa-role-attach" {
  role       = aws_iam_role.my-eks-sa-role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"
}

output "eks-endpoint" {
  value = aws_eks_cluster.eks-private-cluster.endpoint
}

output "eks-oidc-provider-url" {
  value = aws_eks_cluster.eks-private-cluster.identity[0].oidc[0].issuer
}