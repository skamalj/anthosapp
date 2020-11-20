apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: {{ ROLE_BINDING }}
  {{#if NAMESPACE_SELECTOR }}
  annotations:
    configmanagement.gke.io/namespace-selector: {{ NAMESPACE_SELECTOR }}
  {{/if}}
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
  kind: Role
  name: {{ ROLE }}
  apiGroup: rbac.authorization.k8s.io