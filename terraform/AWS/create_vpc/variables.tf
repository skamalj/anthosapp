variable "cidr_block" {
    type = string
    default = "10.1.0.0/16"
    description = "Provide CIDR block for cluster VPC, preferrably /16 as subnets are created using +4"
}