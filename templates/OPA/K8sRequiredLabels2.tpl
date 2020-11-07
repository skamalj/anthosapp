apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequiredLabels
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
    message: "All namespaces must have an {{ LABEL_KEY }} label"
    labels:
      - key: {{ LABEL_KEY }}
        allowedRegex: {{ LABEL_REGEX }}