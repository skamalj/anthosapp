# Install Instructions

## Anthos Connect Pre-req

### Create service accounts

Create service account "connect-sa" for application pod.  This is connected to IAM service account using workload identity. This is non-intrusive way to attach permissions to application to enable Anthos connect functionality.
This service account name is specified in deployment.yaml. If you change the name, then change it in deployment.yaml as well.

```bash
kubectl create serviceaccount --namespace anthosapp connect-sa
gcloud iam service-accounts create connect-sa
gcloud iam service-accounts add-iam-policy-binding   --role roles/iam.workloadIdentityUser   --member "serviceAccount:<project_id>.svc.id.goog[anthosapp/connect-sa]"   connect-sa@<project_id>.iam.gserviceaccount.com
kubectl annotate serviceaccount   --namespace anthosapp   connect-sa   iam.gke.io/gcp-service-account=connect-sa@<project_id>.iam.gserviceaccount.com
```

### Grant GCP IAM permissions

Grant below roles to "connect-sa" service acoount

```bash
--role=roles/gkehub.admin \
 --role=roles/iam.serviceAccountAdmin \
 --role=roles/iam.serviceAccountKeyAdmin \
 --role=roles/resourcemanager.projectIamAdmin
 ```

 [Read here for details on pre-requisites](https://cloud.google.com/anthos/multicluster-management/connect/prerequisites "Anthos Connect Pre-requisites")

## Config Connect Pre-requisites

### Enable config connector on GKE cluster

Do this on the same cluster where this application is deployed. Follow instructions on this page -  [Enable config connector](https://cloud.google.com/config-connector/docs/how-to/install-upgrade-uninstall#setting_up_a_cluster)

### Create workload identity

```bash
gcloud iam service-accounts create config-connect-sa
gcloud projects add-iam-policy-binding <project-id>  --member="serviceAccount:config-connect-sa@<project_id>.gserviceaccount.com"  --role="roles/owner"
gcloud iam service-accounts add-iam-policy-binding config-connect-sa@<project_id>.iam.gserviceaccount.com     --member="serviceAccount:<project_id>.svc.id.goog[cnrm-system/cnrm-controller-manager]"  --role="roles/iam.workloadIdentityUser"
```

### Configure connector

[Configure the connector](https://cloud.google.com/config-connector/docs/how-to/install-upgrade-uninstall#addon-configuring). Only step is to create configconnector.yaml and deploy to cluster.

## Deploy application

Install the application by running deployment.yaml against the cluster

```bash
kubectl deploy -f deployment.yaml
```
