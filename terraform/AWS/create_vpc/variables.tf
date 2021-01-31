variable "cidr_block" {
    type = string
    default = "10.1.0.0/16"
    description = "Provide CIDR block for cluster nodes VPC, preferrably /16 as subnets are created using +4"
}

variable "secondary_cidr" {
    type = string
    default = "10.2.0.0/24"
    description = "Provide CIDR block for use as internal ELB"
}