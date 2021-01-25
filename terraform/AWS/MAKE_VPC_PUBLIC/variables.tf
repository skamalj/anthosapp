variable "eks-vpc" {
  type = object({
      id = string
      cidr_block = string
  })
}