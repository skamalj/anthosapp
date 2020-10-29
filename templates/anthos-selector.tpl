kind: {{ KIND }}
apiVersion: {{ APIVERSION }}
metadata:
  name: {{ SELECTOR_NAME }}
spec:
  selector:
    matchLabels:  
    {{#each LABELS}}
    {{#each this}}
      {{@key}}: {{this}}
    {{/each}}        
    {{/each}}