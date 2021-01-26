output "eks-cluster-role" {
  value = aws_iam_role.eks-cluster-role
}

output "eks-node-group-role" {
  value = aws_iam_role.eks-node-group-role
}

