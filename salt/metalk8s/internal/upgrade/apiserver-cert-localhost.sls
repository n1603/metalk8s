{%- from "metalk8s/map.jinja" import certificates with context %}
{%- from "metalk8s/map.jinja" import kube_api with context %}

{%- set cert_path = certificates.client.files.apiserver.path %}
{# Figure out the (new) SAN for the cert, now including 127.0.0.1
   Can't 'simply' set it to certSANs as found in
   metalk8s.kubernetes.apiserver.certs.server because that doesn't include the
   (former) `apiServer.host` value, and at this point, the cert must still be
   valid for said address.
#}
{%- set origCertSANs =
        salt['x509.read_certificate'](cert_path)['X509v3 Extensions']['subjectAltName'] %}

{% if "IP Address:127.0.0.1" not in origCertSANs %}
{%     set certSANs = origCertSANs + ",IP Address:127.0.0.1" %}
{% else %}
{%     set certSANs = origCertSANs %}
{% endif %}

{# From metalk8s.kubernetes.apiserver.certs.server #}
Generate kube-apiserver certificate including '127.0.0.1':
  x509.certificate_managed:
    - name: {{ cert_path }}
    - public_key: /etc/kubernetes/pki/apiserver.key
    - ca_server: {{ pillar['metalk8s']['ca']['minion'] }}
    - signing_policy: {{ kube_api.cert.server_signing_policy }}
    - CN: kube-apiserver
    - subjectAltName: "{{ certSANs }}"
    - days_valid: {{
        certificates.client.files.apiserver.days_valid |
        default(certificates.client.days_valid) }}
    - days_remaining: {{
        certificates.client.files.apiserver.days_remaining |
        default(certificates.client.days_remaining) }}
    - user: root
    - group: root
    - mode: 644
    - makedirs: True
    - dir_mode: 755

{# Note: we kill the process instead of re-generating the static manifest,
   because the latter would also *upgrade* the version of kube-apiserver in
   said manifest. #}
Kill kube-apiserver:
  module.run:
    - ps.pkill:
      - pattern: kube-apiserver
    - onchanges:
      - x509: Generate kube-apiserver certificate including '127.0.0.1'

Wait for kube-apiserver to be running:
  http.wait_for_successful_query:
    - name: https://127.0.0.1:6443/healthz
    - verify_ssl: True
    - ca_bundle: /etc/kubernetes/pki/ca.crt
    - status: 200
    - match: 'ok'
    - require:
      - module: Kill kube-apiserver
