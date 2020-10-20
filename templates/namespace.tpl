kind: Namespace
apiVersion: v1
metadata:
  name: {{ NAMESPACE }}
  annotations:
     configmanagement.gke.io/cluster-selector: {{ CLUSTER_SELECTOR }}
  labels:
  {{#each LABELS}}
  {{#each this}}
    {{@key}}: {{this}}
  {{/each}}        
  {{/each}}