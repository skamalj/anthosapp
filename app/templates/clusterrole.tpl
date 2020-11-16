kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: {{ ROLE_NAME }}
  {{#if CLUSTER_SELECTOR }}
  annotations:
    configmanagement.gke.io/cluster-selector: {{ CLUSTER_SELECTOR }}
  {{/if}}  
rules:
{{#each RULES}}
- apiGroups: {{{json this.apigroups }}}
  resources: {{{json this.resources }}}
  verbs: {{{json this.permissionarray }}}        
{{/each}}