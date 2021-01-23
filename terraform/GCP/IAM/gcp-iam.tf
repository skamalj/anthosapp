terraform {
  required_providers {
    google = {
      source = "hashicorp/google"
      version = "~> 3.10"
    }
  }
}

provider "google" {
  project = "gcdeveloper"
  region  = "us-central1"
  zone    = "us-central1-a"
}

resource "google_service_account" "connect-sa" {
  account_id   = "connect-sa"
  display_name = "connect-sa"
}

resource "google_service_account" "config-connect-sa" {
  account_id   = "config-connect-sa"
  display_name = "config-connect-sa"
}

resource "google_service_account_iam_binding" "anthosSAWorkloadIdentityBind" {
  service_account_id = google_service_account.connect-sa.name
  role               = "roles/iam.workloadIdentityUser"
  members = [
    "serviceAccount:gcdeveloper.svc.id.goog[anthosapp/connect-sa]",
  ]
}

resource "google_project_iam_binding" "connectHubAdmin" {
  project = "gcdeveloper"
  role    = "roles/gkehub.admin"
  members = [
    "serviceAccount:connect-sa@gcdeveloper.iam.gserviceaccount.com",
  ]
}

resource "google_project_iam_binding" "connectSaAdmin" {
  project = "gcdeveloper"
  role    = "roles/iam.serviceAccountAdmin"
  members = [
    "serviceAccount:connect-sa@gcdeveloper.iam.gserviceaccount.com",
  ]
}

resource "google_project_iam_binding" "connectProjectIAMAdmin" {
  project = "gcdeveloper"
  role    = "roles/resourcemanager.projectIamAdmin"
  members = [
    "serviceAccount:connect-sa@gcdeveloper.iam.gserviceaccount.com",
  ]
}

resource "google_project_iam_binding" "connectSaKeyAdmin" {
  project = "gcdeveloper"
  role    = "roles/iam.serviceAccountKeyAdmin"
  members = [
    "serviceAccount:connect-sa@gcdeveloper.iam.gserviceaccount.com",
  ]
}

