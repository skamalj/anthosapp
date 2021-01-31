output "eks-vpc" {
  value = aws_vpc.eks-vpc
}

output "eks-nodes-subnets" {
  value = aws_subnet.eks-nodes-subnets
}

output "eks-internal-elb-subnets" {
  value = aws_subnet.eks-internal-elb-subnets
}

output "private-route-table" {
  value = aws_route_table.private-route-table
}