{%- from "metalk8s/map.jinja" import certificates with context %}
{%- from "metalk8s/map.jinja" import etcd with context %}

{%- set private_key_path = "/etc/kubernetes/pki/etcd/peer.key" %}

include:
  - metalk8s.internal.m2crypto

Create etcd peer private key:
  x509.private_key_managed:
    - name: {{ private_key_path }}
    - bits: 2048
    - verbose: False
    - user: root
    - group: root
    - mode: 600
    - makedirs: True
    - dir_mode: 755
    - require:
      - metalk8s_package_manager: Install m2crypto
    - unless:
      - test -f "{{ private_key_path }}"

Generate etcd peer certificate:
  x509.certificate_managed:
    - name: {{ certificates.server.files['etcd-peer'].path }}
    - public_key: {{ private_key_path }}
    - ca_server: {{ pillar['metalk8s']['ca']['minion'] }}
    - signing_policy: {{ etcd.cert.peer_signing_policy }}
    - CN: "{{ grains['fqdn'] }}"
    - subjectAltName: "DNS:{{ grains['fqdn'] }}, DNS:localhost, IP:{{ grains['metalk8s']['control_plane_ip'] }}, IP:127.0.0.1"
    - days_valid: {{
        certificates.server.files['etcd-peer'].days_valid |
        default(certificates.server.days_valid) }}
    - days_remaining: {{
        certificates.server.files['etcd-peer'].days_remaining |
        default(certificates.server.days_remaining) }}
    - user: root
    - group: root
    - mode: 644
    - makedirs: True
    - dir_mode: 755
    - require:
      - x509: Create etcd peer private key
