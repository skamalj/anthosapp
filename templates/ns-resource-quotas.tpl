apiVersion: v1
kind: ResourceQuota
metadata:
  name: {{ RESOURCE_QUOTAS_NAME}}
spec:
  hard:
    {{#if CPU_LIMIT }}
    cpu: {{ CPU_LIMIT }}
    {{/if}}
    {{#if MEMORY_LIMIT }}
    memory: {{ MEMORY_LIMIT }}
    {{/if}}
    {{#if NO_OF_PODS }}
    pods: {{ NO_OF_PODS }}
    {{/if}}
    {{#if NO_OF_JOBS }}
    count/jobs.batch: {{ NO_OF_JOBS }}
    {{/if}}
    