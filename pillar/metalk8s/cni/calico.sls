certificates:
  kubeconfig:
    files:
      calico:
        path: /etc/kubernetes/calico.conf
        cn: "{{ grains.id }}"
        regen_sls:
          - metalk8s.kubernetes.cni.calico
