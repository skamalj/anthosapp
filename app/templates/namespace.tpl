kind: Namespace
apiVersion: v1
metadata:
  name: {{ NAMESPACE }}
  {{#if CLUSTER_SELECTOR}}
  annotations:
     configmanagement.gke.io/cluster-selector: {{ CLUSTER_SELECTOR }}
  {{/if}} 
  {{#if LABELS}}  
  labels:
  {{/if}}
  {{#each LABELS}}
  {{#each this}}
    {{@key}}: {{this}}
  {{/each}}        
  {{/each}}