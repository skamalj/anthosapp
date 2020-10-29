apiVersion: v1
  kind: ResourceQuota
  metadata:
    name: {{ QUOTA_NAME }}
  spec:
    hard:
      {{#if CPU_QUOTA}}
      cpu: {{ CPU_QUOTA }}
      {{/if}}
      {{#if MEM_QUOTA}}
      memory: {{ MEM_QUOTA }}
      {{/if}}
      {{#if PODS_QUOTA }}
      pods: {{ PODS_QUOTA }}
      {{/if}}