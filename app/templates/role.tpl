kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: {{ ROLE_NAME }}
  {{#if SELECTORS}}
  annotations:
  {{/if}}
  {{#each SELECTORS}}
      configmanagement.gke.io/{{ this.CLUSTER_TYPE }}: {{{json this.CLUSTER_SELECTOR }}}
  {{/each}} 
rules:
{{#each RULES}}
- apiGroups: {{{json this.apigroups }}}
  resources: {{{json this.resources }}}
  verbs: {{{json this.permissionarray }}}        
{{/each}}