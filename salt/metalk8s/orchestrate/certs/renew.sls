{%- set target_pillar = salt.saltutil.runner(
  'pillar.show_pillar', kwarg={'minion': pillar.orchestrate.target}
) %}
{%- set sls = [] %}
{%- set clients = target_pillar.certificates.client.files.values() %}
{%- set kubeconfigs = target_pillar.certificates.kubeconfig.files.values() %}
{%- set servers = target_pillar.certificates.server.files.values() %}

{%- for cert in clients + kubeconfigs + servers %}
  {%- if cert['path'] in pillar.orchestrate.certificates %}
    {%- do sls.extend(cert.get('regen_sls', [])) %}
  {%- endif %}
{%- endfor %}

Renew expired certificates:
  salt.state:
    - tgt: {{ pillar.orchestrate.target }}
    - sls: {{ sls | unique | json }}
