data "tls_certificate" "eks-oidc-issuer" {
  url = var.eks-cluster.identity[0].oidc[0].issuer
}

# Create OIDC provider for EKS in IAM, to facilitate linking serviceaccount
# with IAM role. 
# https://aws.amazon.com/blogs/opensource/introducing-fine-grained-iam-roles-service-accounts/
# https://docs.aws.amazon.com/eks/latest/userguide/enable-iam-roles-for-service-accounts.html 
resource "aws_iam_openid_connect_provider" "eks-oidc-provider" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks-oidc-issuer.certificates[0].sha1_fingerprint]
  url             = var.eks-cluster.identity[0].oidc[0].issuer
}

# Below is an example of how to attach "my-serviceaccount" in EKS to 
# "my-eks-sa-role" in IAM
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

### Sample role attached to my-serviceaccount in EKS, you still need to create role and rolebinding ###

# Below is an example of how to attach "my-serviceaccount" in EKS to 
# "my-eks-sa-role" in IAM
data "aws_iam_policy_document" "cwagent-assume-role-policy" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"

    condition {
      test     = "StringEquals"
      variable = "${replace(aws_iam_openid_connect_provider.eks-oidc-provider.url, "https://", "")}:sub"
      values   = ["system:serviceaccount:amazon-cloudwatch:cloudwatch-agent"]
    }

    principals {
      identifiers = [aws_iam_openid_connect_provider.eks-oidc-provider.arn]
      type        = "Federated"
    }
  }
}

resource "aws_iam_role" "eks-cwagent-sa-role" {
  assume_role_policy = data.aws_iam_policy_document.cwagent-assume-role-policy.json
  name               = "eks-cwagent-sa-role"
}

resource "aws_iam_role_policy_attachment" "eks-cwagent-sa-role-attach" {
  role       = aws_iam_role.eks-cwagent-sa-role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

### Attach IAM role with cwagent sercviceaccount ###

# Below is an example of how to attach "my-serviceaccount" in EKS to 
# "my-eks-sa-role" in IAM
data "aws_iam_policy_document" "fluentbit-assume-role-policy" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"

    condition {
      test     = "StringEquals"
      variable = "${replace(aws_iam_openid_connect_provider.eks-oidc-provider.url, "https://", "")}:sub"
      values   = ["system:serviceaccount:amazon-cloudwatch:fluent-bit"]
    }

    principals {
      identifiers = [aws_iam_openid_connect_provider.eks-oidc-provider.arn]
      type        = "Federated"
    }
  }
}

resource "aws_iam_role" "eks-fluentbit-sa-role" {
  assume_role_policy = data.aws_iam_policy_document.fluentbit-assume-role-policy.json
  name               = "eks-fluentbit-sa-role"
}

resource "aws_iam_role_policy_attachment" "eks-fluentbit-sa-role-attach" {
  role       = aws_iam_role.eks-fluentbit-sa-role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

### Attach IAM role with cwagent sercviceaccount ###