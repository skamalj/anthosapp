apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: grafana-vol
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: {{ STORAGE_SIZE }}
---
apiVersion: v1
kind: Secret
metadata:
  name: grafana
type: Opaque
data:
  admin-user: {{{ BASE64_USER }}}
  admin-password: {{ BASE64_PASSWORD }}
  ldap-toml: ""
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana
data:
  grafana.ini: |
    [analytics]
    check_for_updates = true
    [grafana_net]
    url = https://grafana.net
    [log]
    mode = console
    [paths]
    data = /var/lib/grafana/data
    logs = /var/log/grafana
    plugins = /var/lib/grafana/plugins
    provisioning = /etc/grafana/provisioning
---
apiVersion: v1
kind: Service
metadata:
  name: grafana
  labels:
    name: grafana
spec:
  type: ClusterIP
  ports:
    - name: service
      port: {{ SERVICE_PORT }}
      protocol: TCP
      targetPort: 3000
  selector:
    name: grafana
    app: grafana
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  labels:
    name: grafana
    app: grafana
spec:
  replicas: 1
  revisionHistoryLimit: 10
  selector:
    matchLabels:
      name: grafana
      app: grafana
  strategy:
    type: RollingUpdate
  template:
    metadata:
      labels:
        name: grafana
        app: grafana
    spec:
      securityContext:
        fsGroup: {{ RUN_AS_USER_ID  }}
        runAsGroup: {{ RUN_AS_USER_ID  }}
        runAsUser: {{ RUN_AS_USER_ID  }}
      initContainers:
        - name: init-chown-data
          image: "busybox:1.31.1"
          imagePullPolicy: IfNotPresent
          securityContext:
            runAsNonRoot: false
            runAsUser: 0
          command: ["chown", "-R", "{{ RUN_AS_USER_ID  }}:{{ RUN_AS_USER_ID  }}", "/var/lib/grafana"]
          resources:
            {}
          volumeMounts:
            - name: storage
              mountPath: "/var/lib/grafana"
      containers:
        - name: grafana
          image: "grafana/grafana:7.3.3"
          imagePullPolicy: IfNotPresent
          resources:
            requests:
              memory: {{ MEMORY_LIMIT }}
              cpu: {{ CPU_LIMIT }}
            limits:
              memory: {{ MEMORY_LIMIT }}
              cpu: {{ CPU_LIMIT }}
          volumeMounts:
            - name: config
              mountPath: "/etc/grafana/grafana.ini"
              subPath: grafana.ini
            - name: storage
              mountPath: "/var/lib/grafana"
          ports:
            - name: service
              containerPort: 80
              protocol: TCP
            - name: grafana
              containerPort: 3000
              protocol: TCP
          env:
            - name: GF_SECURITY_ADMIN_USER
              valueFrom:
                secretKeyRef:
                  name: grafana
                  key: admin-user
            - name: GF_SECURITY_ADMIN_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: grafana
                  key: admin-password
          livenessProbe:
            failureThreshold: 10
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 60
            timeoutSeconds: 30
          readinessProbe:
            httpGet:
              path: /api/health
              port: 3000
          resources:
            {}
      volumes:
        - name: config
          configMap:
            name: grafana
        - name: storage
          persistentVolumeClaim:
            claimName: grafana-vol

