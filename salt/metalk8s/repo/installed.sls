{%- from "metalk8s/repo/macro.sls" import build_image_name with context %}
{%- from "metalk8s/map.jinja" import metalk8s with context %}
{%- from "metalk8s/map.jinja" import repo with context %}

{%- set package_repositories_name = 'package-repositories' %}
{%- set package_repositories_version = '1.0.0' %}
{%- set package_repositories_image = build_image_name('nginx', '1.15.8') %}

{%- set nginx_conf_root = '/var/lib/metalk8s/package-repositories/' %}
{%- set nginx_main_conf = nginx_conf_root ~ 'nginx.conf' %}
{%- set nginx_confd     = nginx_conf_root ~ 'conf.d/' %}
{%- set nginx_registry        = '99-' ~ saltenv ~ '-registry.conf' %}
{%- set nginx_registry_config = '90-' ~ saltenv ~ '-registry-config.conf' %}
{%- set nginx_registry_path        = nginx_confd ~ nginx_registry %}
{%- set nginx_registry_config_path = nginx_confd ~ nginx_registry_config %}

Generate package repositories nginx configuration:
  file.managed:
    - name: {{ nginx_main_conf }}
    - source: salt://{{ slspath }}/files/nginx.conf.j2
    - template: jinja
    - user: root
    - group: root
    - mode: '0644'
    - makedirs: true
    - backup: false
    - defaults:
        listening_port: {{ repo.port }}

Deploy container registry nginx configuration:
  file.managed:
    - name: {{ nginx_registry_path }}
    - source: salt://{{ slspath }}/files/{{ nginx_registry }}
    - user: root
    - group: root
    - mode: '0644'
    - makedirs: true
    - backup: false

Generate container registry configuration:
  file.managed:
    - name: {{ nginx_registry_config_path }}
    - source: salt://{{ slspath }}/files/90-metalk8s-registry-config.conf.j2
    - template: jinja
    - user: root
    - group: root
    - mode: '0644'
    - makedirs: true
    - backup: false
    - defaults:
        var_prefix: {{ saltenv | replace('.', '_') | replace('-', '_') }}
        images_path: {{ metalk8s.iso_root_path }}/images/

Inject nginx image:
  containerd.image_managed:
    - name: docker.io/library/nginx:1.15.8
    - archive_path: {{ metalk8s.iso_root_path }}/images/nginx-1.15.8.tar

Install package repositories manifest:
  metalk8s.static_pod_managed:
    - name: /etc/kubernetes/manifests/package-repositories.yaml
    - source: salt://{{ slspath }}/files/package-repositories-manifest.yaml.j2
    - config_files:
      - {{ nginx_main_conf }}
      - {{ nginx_registry_path }}
      - {{ nginx_registry_config_path }}
    - context:
        container_port: {{ repo.port }}
        image: docker.io/library/nginx:1.15.8
        name: {{ package_repositories_name }}
        version: {{ package_repositories_version }}
        packages_path: {{ metalk8s.iso_root_path }}/{{ repo.relative_path }}
        nginx_configuration_path: {{ nginx_main_conf }}
    - onchanges:
      - containerd: Inject nginx image
      - file: Generate package repositories nginx configuration
      - file: Deploy container registry nginx configuration
      - file: Generate container registry configuration

Ensure package repositories container is up:
  module.wait:
    - cri.wait_container:
      - name: {{ package_repositories_name }}
      - state: running
    - require:
      - metalk8s: Install package repositories manifest
