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

# This role is required for creating security groups fior pods
resource "aws_iam_role_policy_attachment" "eks-tf-AmazonEKSVPCResourceController" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
  role       = aws_iam_role.eks-cluster-role.name
}

### Create cluster role complete ###

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
### IAM role for node groups created ###

# Create Policy and Role  to enable adding user to EKS cluster
# https://docs.aws.amazon.com/eks/latest/userguide/add-user-role.html
data "aws_caller_identity" "current" {}

resource "aws_iam_policy" "EKSViewRolePolicy" {
  name        = "EKSViewRolePolicy"
  path        = "/"
  description = "Policy to enable EKS view privileges"

  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "eks:DescribeNodegroup",
                "eks:ListNodegroups",
                "eks:DescribeCluster",
                "eks:ListClusters",
                "eks:AccessKubernetesApi",
                "ssm:GetParameter",
                "eks:ListUpdates",
                "eks:ListFargateProfiles"
            ],
            "Resource": "*"
        }
    ]
}  
EOF
}       

# Create different roles for different applications(same policy), these roles can be used to assign user
# different RBAC permissions in EKS
resource "aws_iam_role" "EKSViewRoleAppA" {
  name = "s3-list-role"
  assume_role_policy = <<POLICY
{
    "Version" : "2012-10-17",
    "Statement" : [
        {
        "Effect"    : "Allow",
        "Action"    : "sts:AssumeRole",
        "Principal" : { "AWS" : "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root" }
    }]
}
POLICY  
}


resource "aws_iam_role_policy_attachment" "eks-appa-user-role" {
  policy_arn = aws_iam_policy.EKSViewRolePolicy.arn
  role       = aws_iam_role.EKSViewRoleAppA.name
}

### Role can be attached to any user to provide access to appa ###