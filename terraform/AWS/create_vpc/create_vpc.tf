# Create VPC and two subnets
# Subnets are associated with main VPC route table
resource "aws_vpc" "eks-vpc" {
  cidr_block = var.cidr_block
  enable_dns_hostnames = true
  enable_dns_support = true
  tags = {
    Name = "eks-vpc"
  }
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

# Create route table for private subnets 
resource "aws_route_table" "private-route-table" {
  vpc_id = aws_vpc.eks-vpc.id
}  

# Associate subnets with main route table
resource "aws_route_table_association" "main-route-table-association" {
  for_each =  zipmap(range(length(aws_subnet.eks-subnets)), aws_subnet.eks-subnets)
  subnet_id      = each.value.id
  route_table_id = aws_route_table.private-route-table.id
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

