output "eks-vpc" {
  value = aws_vpc.eks-vpc
}

output "eks-subnets" {
  value = aws_subnet.eks-subnets
}

output "private-route-table" {
  value = aws_route_table.private-route-table
}