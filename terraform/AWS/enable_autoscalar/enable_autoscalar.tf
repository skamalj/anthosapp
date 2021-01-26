# Create required roles and policies to enable cluster autoscalar
# https://docs.aws.amazon.com/eks/latest/userguide/cluster-autoscaler.html
# First create policy with required permissions
resource "aws_iam_policy" "AmazonEKSClusterAutoscalerPolicy" {
  name        = "AmazonEKSClusterAutoscalerPolicy"
  path        = "/"
  description = "Policy to enable EKS AutoScalar"
  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Action": [
                "autoscaling:DescribeAutoScalingGroups",
                "autoscaling:DescribeAutoScalingInstances",
                "autoscaling:DescribeLaunchConfigurations",
                "autoscaling:DescribeTags",
                "autoscaling:SetDesiredCapacity",
                "autoscaling:TerminateInstanceInAutoScalingGroup",
                "ec2:DescribeLaunchTemplateVersions"
            ],
            "Resource": "*",
            "Effect": "Allow"
        }
    ]
}
EOF
}       

# Associate autoscalar service account with IAM role
data "aws_iam_policy_document" "autoscalar-assume-role-policy" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"

    condition {
      test     = "StringEquals"
      variable = "${replace(var.eks-oidc-provider.url, "https://", "")}:sub"
      values   = ["system:serviceaccount:kube-system:cluster-autoscaler"]
    }

    principals {
      identifiers = [var.eks-oidc-provider.arn]
      type        = "Federated"
    }
  }
}

# Create role and attach required trust policy
resource "aws_iam_role" "AmazonEKSClusterAutoscalerRole" {
  assume_role_policy = data.aws_iam_policy_document.autoscalar-assume-role-policy.json
  name               = "AmazonEKSClusterAutoscalerRole"
}

# Attach permission policy with the role
resource "aws_iam_role_policy_attachment" "autoscalar-role-attach" {
  role       = aws_iam_role.AmazonEKSClusterAutoscalerRole.name
  policy_arn = aws_iam_policy.AmazonEKSClusterAutoscalerPolicy.arn
}