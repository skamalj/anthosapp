apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: {{ CLUSTER_ROLE_BINDING }}
  {{#if CLUSTER_SELECTOR }}
  annotations:
    configmanagement.gke.io/cluster-selector: {{ CLUSTER_SELECTOR }}
  {{/if}} 
subjects:
{{#each SUBJECTS}}
- kind: {{ this.KIND }}
  name: {{ this.NAME }}
  {{#if this.API_GROUP}}
  apiGroup: {{ this.API_GROUP }}
  {{/if}}
{{/each}}  
roleRef:
  kind: ClusterRole
  name: {{ CLUSTER_ROLE }}
  apiGroup: rbac.authorization.k8s.io