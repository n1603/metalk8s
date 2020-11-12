{%- from "metalk8s/macro.sls" import pkg_installed with context %}
{%- from "metalk8s/map.jinja" import certificates with context %}

include:
  - metalk8s.repo

Install pyOpenSSL:
  {{ pkg_installed('pyOpenSSL') }}
    - require:
      - test: Repositories configured

{%- if certificates.client.files or certificates.server.files %}
Add beacon for certificates expiration:
  beacon.present:
    - name: watch_certificates_expiry
    - save: True
    - beacon_module: cert_info
    - interval: {{ certificates.beacon.interval }}
    - disable_during_state_run: True
    - notify_days: {{ certificates.beacon.notify_days }}
    - files: {{ (
          certificates.client.files.values() +
          certificates.server.files.values()
        ) | map(attribute='path') | list | json }}
{%- endif %}

{%- if certificates.kubeconfig.files %}
Add beacon for kubeconfig expiration:
  beacon.present:
    - name: watch_kubeconfig_expiry
    - save: True
    - beacon_module: metalk8s_kubeconfig_info
    - interval: {{ certificates.beacon.interval }}
    - disable_during_state_run: True
    - notify_days: {{ certificates.beacon.notify_days }}
    - files: {{
        certificates.kubeconfig.files.values() |
        map(attribute='path') | list | json }}
{%- endif %}

{%- if not (
    certificates.client.files or
    certificates.kubeconfig.files or
    certificates.server.files
) %}
No certificate or kubeconfig to watch for this node:
  test.nop
{%- endif %}
