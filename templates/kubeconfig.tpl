apiVersion: v1
kind: Config
clusters:
- cluster:
    insecure-skip-tls-verify: true
    server: {{ CLUSTER_ENDPOINT }} 
  name: {{ CLUSTER_NAME }}
users:
- name: {{ SERVICE_ACCOUNT }}
  user:
    token: {{ TOKEN }}
contexts:
- context:
    cluster: {{ CLUSTER_NAME }}
    user: {{ SERVICE_ACCOUNT }}
  name: {{ CLUSTER_NAME }}
current-context:  {{ CLUSTER_NAME }}