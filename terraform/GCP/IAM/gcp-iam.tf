
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
    format("serviceAccount:%s.svc.id.goog[anthosapp/connect-sa]", var.gcp_project),
  ]
}

resource "google_project_iam_binding" "connectHubAdmin" {
  project = "gcdeveloper"
  role    = "roles/gkehub.admin"
  members = [
    format("serviceAccount:connect-sa@%s.iam.gserviceaccount.com", var.gcp_project),
  ]
}

resource "google_project_iam_binding" "connectSaAdmin" {
  project = "gcdeveloper"
  role    = "roles/iam.serviceAccountAdmin"
  members = [
    format("serviceAccount:connect-sa@%s.iam.gserviceaccount.com", var.gcp_project),
  ]
}

resource "google_project_iam_binding" "connectProjectIAMAdmin" {
  project = "gcdeveloper"
  role    = "roles/resourcemanager.projectIamAdmin"
  members = [
    format("serviceAccount:connect-sa@%s.iam.gserviceaccount.com", var.gcp_project)
  ]
}

resource "google_project_iam_binding" "connectSaKeyAdmin" {
  project = "gcdeveloper"
  role    = "roles/iam.serviceAccountKeyAdmin"
  members = [
    format("serviceAccount:connect-sa@%s.iam.gserviceaccount.com", var.gcp_project)
  ]
}

