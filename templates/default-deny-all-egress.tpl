apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-egress
  {{#if SELECTORS}}
  annotations:
  {{/if}}
  {{#each SELECTORS}}
      configmanagement.gke.io/{{ this.CLUSTER_TYPE }}: {{ this.CLUSTER_SELECTOR }}
  {{/each}}  
spec:
  podSelector: {}
  policyTypes:
  - Egress