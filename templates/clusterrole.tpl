kind: ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: {{ ROLE_NAME }}
rules:
{{#each RULES}}
- apiGroups: {{{json this.apigroups }}}
  resources: {{{json this.resources }}}
  verbs: {{{json this.permissionarray }}}        
{{/each}}