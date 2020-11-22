apiVersion: v1
kind: Secret
metadata:
  name: {{ SECRET_NAME }}
data:
{{#each DATA}}
  {{@key}}: {{{ this }}}
{{/each}}        
