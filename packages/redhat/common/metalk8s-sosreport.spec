Name:		metalk8s-sosreport
Version:	_VERSION_
Release:	2%{?dist}
Summary: 	Metalk8s SOS report custom plugins

BuildRequires: /usr/bin/pathfix.py

Requires: python3 >= 3.6
Requires: sos >= 3.1
# NameError on FileNotFoundError in sos 3.5 python2.7
Conflicts: sos = 3.5

ExclusiveArch:  x86_64
ExclusiveOS:    Linux

License:        GPL+
Source0:        ../../common/metalk8s-sosreport/metalk8s.py
Source1:        ../../common/metalk8s-sosreport/containerd.py

%description
%{Summary}

%install
install -m 755 -d %{buildroot}/%{python3_sitelib}/sos/plugins
install -p -m 755 %{_topdir}/SOURCES/metalk8s.py %{buildroot}%{python3_sitelib}/sos/plugins/metalk8s.py
install -p -m 755 %{_topdir}/SOURCES/containerd.py %{buildroot}%{python3_sitelib}/sos/plugins/containerd.py
pathfix.py -pni "%{__python3} %{py3_shbang_opts}" %{buildroot}%{python3_sitelib}

%files
%defattr(-,root,root)
%{python3_sitelib}/sos/plugins/containerd.py
%{python3_sitelib}/sos/plugins/metalk8s.py
%{python3_sitelib}/sos/plugins/__pycache__/containerd.cpython-%{python3_version_nodots}.pyc
%{python3_sitelib}/sos/plugins/__pycache__/containerd.cpython-%{python3_version_nodots}.opt-?.pyc
%{python3_sitelib}/sos/plugins/__pycache__/metalk8s.cpython-%{python3_version_nodots}.pyc
%{python3_sitelib}/sos/plugins/__pycache__/metalk8s.cpython-%{python3_version_nodots}.opt-?.pyc

%changelog
* Tue Dec 08 2020 Alexandre Allard <alexandre.allard@scality.com> - 1.0.0-2
- Build for Python3

* Fri Jul 05 2019 SayfEddine Hammemi <sayf-eddine.hammemi@scality.com> - 1.0.0-1
- Initial build
