FROM centos:7

ARG BUILDBOT_VERSION=2.0.1

WORKDIR /home/eve/workspace

RUN yum install -y --setopt=skip_missing_names_on_install=False \
    epel-release \
    && yum-config-manager --add-repo \
    https://download.docker.com/linux/centos/docker-ce.repo \
    && yum install -y --setopt=skip_missing_names_on_install=False \
    sudo \
    gcc \
    hardlink \
    make \
    python36 \
    python36-devel \
    python36-pip \
    genisoimage \
    git \
    skopeo \
    yum-utils \
    docker-ce-cli-18.09.6 \
    && adduser -u 1042 --home /home/eve eve --groups docker \
    && chown eve:eve /home/eve/workspace \
    && python3.6 -m pip install buildbot-worker==${BUILDBOT_VERSION}

# Add eve to sudoers.
RUN echo "eve ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/eve

USER eve
