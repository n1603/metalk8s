certificates:
  client:
    files:
      etcd-healthcheck:
        path: /etc/kubernetes/pki/etcd/healthcheck-client.crt
        regen_sls:
          - metalk8s.kubernetes.etcd
  server:
    files:
      etcd-peer:
        path: /etc/kubernetes/pki/etcd/peer.crt
        regen_sls:
          - metalk8s.kubernetes.etcd
      etcd:
        path: /etc/kubernetes/pki/etcd/server.crt
        regen_sls:
          - metalk8s.kubernetes.etcd
