apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sContainerLimits
metadata:
  name: {{ POLICY_NAME }}
  {{#if CLUSTER_SELECTOR}}
  annotations:
     configmanagement.gke.io/cluster-selector: {{ CLUSTER_SELECTOR }}
  {{/if}} 
spec:
  match:
    kinds:
      - apiGroups: {{{json API_GROUPS }}}
        kinds: {{{json KIND }}}
  parameters:
    cpu: {{ CPU_LIMIT }}
    memory: {{ MEMORY_LIMIT }}