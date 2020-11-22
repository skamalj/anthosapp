apiVersion: v1
kind: Secret
metadata:
  name: {{ SECRET_NAME }}
type: kubernetes.io/dockerconfigjson
data:
  .dockerconfigjson: |
    {{{json DOCKER_CONFIG }}}