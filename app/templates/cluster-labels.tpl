kind: Cluster
apiVersion: clusterregistry.k8s.io/v1alpha1
metadata:
  name: {{ CLUSTER_NAME }}
  labels:
  {{#each LABELS}}
  {{#each this}}
    {{@key}}: {{this}}
  {{/each}}        
  {{/each}}