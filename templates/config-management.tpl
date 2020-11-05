apiVersion: configmanagement.gke.io/v1
kind: ConfigManagement
metadata:
  name: config-management
spec:
  # clusterName is required and must be unique among all managed clusters
  clusterName: {{ CLUSTER_NAME }}
  git:
    syncRepo: {{ REPO_NAME }}
    syncBranch: master
    secretType: ssh
    policyDir: "/"
  policyController:
    enabled: true  