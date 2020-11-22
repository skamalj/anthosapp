apiVersion: v1
kind: Secret
metadata:
  name: {{ SECRET_NAME }}
type: kubernetes.io/tls
data:
  tls.crt: |
    {{{ CRT_FILE }}}
  tls.key: |
    {{{ KEY_FILE }}}