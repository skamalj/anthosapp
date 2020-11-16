apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ NAME }}-deployment
  labels:
    app: {{ NAME }}
spec:
  replicas: {{ REPLICAS }}
  selector:
    matchLabels:
      app: {{ NAME }}
  template:
    metadata:
      labels:
        app: {{ NAME }}
    spec:
      containers:
      - name: {{ NAME }}
        image: {{ IMAGE }}
        ports:
        - containerPort: {{ PORT }}
{{#if SERVICE_PORT }}        
---
apiVersion: v1
kind: Service
metadata:
  name: {{ NAME }}-service
spec:
  selector:
    app: {{ NAME }}
  ports:
    - protocol: TCP
      port: {{ SERVICE_PORT }}
      targetPort: {{ PORT }} 
{{/if}}             