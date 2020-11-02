apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-egress
  {{#if CLUSTER_SELECTOR }}
  annotations:
    configmanagement.gke.io/cluster-selector: {{ CLUSTER_SELECTOR }}
  {{/if}} 
spec:
  podSelector: {}
  policyTypes:
  - Egress