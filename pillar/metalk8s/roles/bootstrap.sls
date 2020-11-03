certificates:
  client:
    files:
      salt-master-etcd:
        path: /etc/kubernetes/pki/etcd/salt-master-etcd-client.crt
        regen_sls:
          - metalk8s.salt.master.certs.etcd-client
  kubeconfig:
    files:
      salt-master:
        path: /etc/salt/master-kubeconfig.conf
        cn: salt-master-{{ grains.id }}
        regen_sls:
          - metalk8s.salt.master.kubeconfig
  server:
    files:
      control-plane-ingress:
        path: /etc/metalk8s/pki/nginx-ingress/control-plane-server.crt
        regen_sls:
          - metalk8s.addons.nginx-ingress-control-plane.certs
      workload-plane-ingress:
        path: /etc/metalk8s/pki/nginx-ingress/workload-plane-server.crt
        regen_sls:
          - metalk8s.addons.nginx-ingress.certs
      dex:
        path: /etc/metalk8s/pki/dex/server.crt
        regen_sls:
          - metalk8s.addons.dex.certs
      salt-api:
        path: /etc/salt/pki/api/salt-api.crt
        regen_sls:
          - metalk8s.salt.master.certs.salt-api
