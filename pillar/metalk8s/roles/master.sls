certificates:
  client:
    files:
      apiserver-etcd:
        path: /etc/kubernetes/pki/apiserver-etcd-client.crt
        regen_sls:
          - metalk8s.kubernetes.apiserver
      front-proxy:
        path: /etc/kubernetes/pki/front-proxy-client.crt
        regen_sls:
          - metalk8s.kubernetes.apiserver
      apiserver-kubelet:
        path: /etc/kubernetes/pki/apiserver-kubelet-client.crt
        regen_sls:
          - metalk8s.kubernetes.apiserver
  kubeconfig:
    files:
      admin:
        path: /etc/kubernetes/admin.conf
        cn: kubernetes-admin
        regen_sls:
          - metalk8s.kubernetes.apiserver.kubeconfig
      scheduler:
        path: /etc/kubernetes/scheduler.conf
        cn: system:kube-scheduler
        regen_sls:
          - metalk8s.kubernetes.scheduler.kubeconfig
      controller-manager:
        path: /etc/kubernetes/controller-manager.conf
        cn: system:kube-controller-manager
        regen_sls:
          - metalk8s.kubernetes.controller-manager.kubeconfig
  server:
    files:
      apiserver:
        path: /etc/kubernetes/pki/apiserver.crt
        regen_sls:
          - metalk8s.kubernetes.apiserver
