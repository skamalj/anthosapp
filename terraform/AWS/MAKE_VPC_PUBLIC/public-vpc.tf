resource "aws_internet_gateway" "vpc-igw" {
  vpc_id = var.eks-vpc.id

  tags = {
    Name = "vpc-igw"
  }
}

# Get availability zones for subnets
data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_eip" "nat-ip" {
  vpc = true
}


# Create public subnets 
resource "aws_subnet" "eks-public-subnets" {
  count = 2

  availability_zone = data.aws_availability_zones.available.names[count.index]
  cidr_block        = cidrsubnet(var.eks-vpc.cidr_block, 4, count.index+2)
  vpc_id            = var.eks-vpc.id
  map_public_ip_on_launch = true

  tags = {
    "kubernetes.io/cluster/eks-private-cluster" = "shared"
  }
}

# Create NAT Gateway in public subnet
resource "aws_nat_gateway" "nat-gw" {
  allocation_id = aws_eip.nat-ip.id
  subnet_id     = aws_subnet.eks-public-subnets[0].id
}

# Associate IGW with route table
resource "aws_route_table" "public-route-table" {
  vpc_id = var.eks-vpc.id

  route  {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.vpc-igw.id
  }
}  

# Associate public route table with public subnets
resource "aws_route_table_association" "public-subnets-route-table" {
  for_each =   zipmap(range(length(aws_subnet.eks-public-subnets)), aws_subnet.eks-public-subnets)
  subnet_id      = each.value.id
  route_table_id = aws_route_table.public-route-table.id
}

# Create route table with route to NAT Gateway
resource "aws_route_table" "private-route-table" {
  vpc_id = var.eks-vpc.id

  route  {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_nat_gateway.nat-gw.id
  }
}  

# Output private route table, which can be associated with private subnets
output "private-route-table" {
    value = aws_route_table.private-route-table
}