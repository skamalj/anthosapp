
resource "google_compute_network" "vpc_network" {
  name = "my-private-gke-nw"
  auto_create_subnetworks = false
  routing_mode = "GLOBAL"
}

resource "google_compute_subnetwork"  "primary_subnet" {
    name = format("subnet-%s-10-1", var.gcp_region)
    ip_cidr_range = "10.1.0.0/16"
    region = var.gcp_region
    network = google_compute_network.vpc_network.id
    secondary_ip_range = [ {
      ip_cidr_range = "10.2.0.0/16"
      range_name = "pod-ips"
    },
    {
      ip_cidr_range = "10.3.0.0/16"
      range_name = "service-ips"
    } ]
}

resource "google_service_account" "gke_default" {
    account_id = "gke-serviceaccount"
    display_name = "gke-serviceaccount"
}

resource "google_container_cluster" "private_cluster" {
  name               = "gke-private"
  location           = format("%s-a", var.gcp_region)
  default_max_pods_per_node = 40
  
  network = google_compute_network.vpc_network.name
  subnetwork = google_compute_subnetwork.primary_subnet.name

  
   network_policy {
     enabled = true
   }
    
  master_authorized_networks_config  {
      cidr_blocks {
              cidr_block = "0.0.0.0/0"
              display_name = "global"
          }
  }

  remove_default_node_pool = true
  initial_node_count       = 1
  
  workload_identity_config {
    identity_namespace = format("%s.svc.id.goog", var.gcp_project)
  }
  
  ip_allocation_policy {
    cluster_secondary_range_name = "pod-ips"
    services_secondary_range_name = "service-ips"
  }

  node_config {
    service_account = google_service_account.gke_default.email
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }

  private_cluster_config {
    enable_private_nodes = true
    enable_private_endpoint = false
    master_ipv4_cidr_block = "172.16.0.0/28"

  }
}  

resource "google_container_node_pool" "node_pool_1" {
  name       = "node-pool-1"
  location   = format("%s-a", var.gcp_region)
  cluster    = google_container_cluster.private_cluster.name
  max_pods_per_node = 40
  initial_node_count = 2

  autoscaling {
      min_node_count = 2
      max_node_count = 6
  }

  node_config {
    preemptible  = false
    machine_type = "n1-standard-2"

    service_account = google_service_account.gke_default.email
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }
}

output "cluster_endpoint" {
  value = google_container_cluster.private_cluster.endpoint
}