#!/bin/bash

declare OS OS_FAMILY

declare -A GPGCHECK_YUM_REPOSITORIES=(
    [metalk8s-epel]=1
    [metalk8s-kubernetes]=1
    [metalk8s-saltstack]=1
    [metalk8s-scality]=0
)

declare -A GPGCHECK_APT_REPOSITORIES=(
    [metalk8s-bionic]=no
    [metalk8s-bionic-backports]=no
    [metalk8s-bionic-updates]=no
    [metalk8s-kubernetes-xenial]=no
    [metalk8s-salt_ubuntu1804]=no
    [metalk8s-scality]=no
)

RPM=${RPM:-$(command -v rpm || true)}
DPKG=${DPKG:-$(command -v dpkg || true)}
YUM=${YUM:-$(command -v yum || true)}
APT=${APT:-$(command -v apt || true)}
SYSTEMCTL=${SYSTEMCTL:-$(command -v systemctl)}

determine_os() {
    # We rely on /etc/os-release to discover the OS because its present on all
    # recent Linux distributions
    if [ -f /etc/os-release ]; then
        # shellcheck disable=SC1091
        . /etc/os-release
        OS=$ID
        [[ $OS = rhel ]] && OS=redhat
        if [[ $OS =~ ^(redhat|centos)$ ]]; then
            OS_FAMILY=redhat
        elif [[ $OS =~ ^(debian|ubuntu)$ ]]; then
            OS_FAMILY=debian
        fi
    else
        die "Impossible to determine the OS"
    fi
}

configure_repositories() {
    case "$OS_FAMILY" in
        redhat)
            configure_yum_repositories
            ;;
        debian)
            configure_apt_repositories
            ;;
        *)
            die "OS $OS not supported";;
    esac
}

configure_yum_repositories() {
    configure_yum_local_repositories

    "$YUM" clean all
}

configure_apt_repositories() {
    configure_apt_local_repositories

    "$APT" clean all
}

configure_yum_local_repositories() {
    for repository in "${!GPGCHECK_YUM_REPOSITORIES[@]}"; do
        configure_yum_local_repository "$repository" \
            "${GPGCHECK_YUM_REPOSITORIES[$repository]}"
    done
}

configure_apt_local_repositories() {
    for repository in "${!GPGCHECK_APT_REPOSITORIES[@]}"; do
        configure_apt_local_repository "$repository"
    done
}

configure_yum_local_repository() {
    local -r repo_name=$1 gpgcheck=${2:-0}
    local -r repo_path="$BASE_DIR/packages/redhat/$repo_name-el7"
    local gpg_keys

    gpg_keys=$(
        find "$repo_path" -maxdepth 1 -name "RPM-GPG-KEY-*" \
            -printf "file://%p "
    )

    cat > /etc/yum.repos.d/"$repo_name".repo << EOF
[$repo_name]
name=$repo_name
baseurl=file://$repo_path
enabled=1
priority=1
gpgcheck=$gpgcheck
${gpg_keys:+gpgkey=${gpg_keys%?}}
EOF
}

configure_apt_local_repository() {
    local -r repo_name=$1
    local -r repo_path="$BASE_DIR/packages/debian/$repo_name"
    echo "deb [trusted=yes] file://$repo_path bionic $repo_name" \
        > /etc/apt/sources.list.d/"$repo_name".list
}

get_packages_list() {
    python -c "
import json

with open('$BASE_DIR/salt/metalk8s/versions.json', 'r') as fd:
    versions = json.load(fd)

packages = versions.get('packages', {}).get('$OS', {})
for pkg, pkg_info in packages.items():
    print('{0}{1}'.format(
        pkg, '-' + pkg_info['version'] if pkg_info.get('version') else '')
    )
"
}

check_packages_presence() {
    local -a packages
    local -a pkg_manager_opts=()

    case "$OS_FAMILY" in
        redhat)
            pkg_manager_opts=(
                "$YUM"
                install
                --assumeyes
                --setopt 'tsflags=test'
                --setopt 'skip_missing_names_on_install=False'
            )
            ;;
        debian)
            pkg_manager_opts=(
                "$APT"
                install
                --dry-run
            )
            ;;
    esac

    if read -ra packages < <(get_packages_list); then
        "${pkg_manager_opts[@]}" "${packages[@]}" || \
            die "some packages or dependencies are missing in the configured" \
                "repositories"
    fi
}

install_packages() {
    local -ra packages=("$@")
    local -a repo_list=(/etc/apt/sources.list)

    case "$OS_FAMILY" in
        redhat)
            local -a yum_opts=(
                '--assumeyes'
                --setopt 'skip_missing_names_on_install=False'
            )
            "$YUM" install "${yum_opts[@]}" "${packages[@]}"
            ;;
        debian)
            mapfile -O 1 -t repo_list < <(find \
                /etc/apt/sources.list.d/ \
                ! -name 'metalk8s-*' -a -name '*.list')

            for source_list in "${repo_list[@]}"; do
                mv "$source_list"{,.disabled}
            done
            "$APT" update
            DEBIAN_FRONTEND=noninteractive "$APT" -y install "${packages[@]}" \
                || exit_code=$?

            for source_list in "${repo_list[@]}"; do
                mv "$source_list"{.disabled,}
            done

            return ${exit_code:-0}
            ;;
        *)
            die "OS $OS not supported";;
    esac
}

pre_minion_checks() {
    test "x$(whoami)" = "xroot" || die "Script must run as root"
    test -n "${RPM}" || die "rpm not found"
    test -x "${RPM}" || die "rpm at '${RPM}' is not executable"
    test -n "${SYSTEMCTL}" || die "systemctl not found"
    test -x "${SYSTEMCTL}" || die "systemctl at '${SYSTEMCTL}' is not executable"
    test -n "${YUM}" || die "yum not found"
    test -x "${YUM}" || die "yum at '${YUM}' is not executable"
}

disable_salt_minion_service() {
    ${SYSTEMCTL} disable salt-minion.service 2>/dev/null || true
}

stop_salt_minion_service() {
    ${SYSTEMCTL} stop salt-minion.service 2>/dev/null || true
}

run_quiet() {
    local name=$1
    shift 1

    echo -n "> ${name}..."
    local start
    start=$(date +%s)
    set +e
    "$@" > >(tee -ia "${LOGFILE}" > "${TMPFILES}/out") 2>&1
    local RC=$?
    set -e
    local end
    end=$(date +%s)

    local duration=$(( end - start ))

    if [ $RC -eq 0 ]; then
        echo " done [${duration}s]"
    else
        echo " fail [${duration}s]"
        cat >/dev/stderr << EOM

Failure while running step '${name}'

Command: $@

Output:

<< BEGIN >>
EOM
        cat "${TMPFILES}/out" > /dev/stderr

        cat >/dev/stderr << EOM
<< END >>

This script will now exit

EOM

        exit 1
    fi
}

run_verbose() {
    local name=$1
    shift 1

    echo "> ${name}..."
    "$@"
}

run() {
    if [ "$VERBOSE" -eq 1 ]; then
        run_verbose "${@}"
    else
        run_quiet "${@}"
    fi
}

die() {
    echo 1>&2 "$@"
    return 1
}

check_package_manager_yum() {
    test -n "$RPM" || die "rpm not found"
    test -x "$RPM" || die "rpm at '$RPM' is not executable"
    test -n "$YUM" || die "yum not found"
    test -x "$YUM" || die "yum at '$YUM' is not executable"
}

check_package_manager_apt() {
    test -n "$DPKG" || die "dpkg not found"
    test -x "$DPKG" || die "dpkg at '$DPKG' is not executable"
    test -n "$APT" || die "apt not found"
    test -x "$APT" || die "apt '$APT' is not executable"
}

check_dist_centos() {
    check_package_manager_yum
}

check_dist_redhat() {
    check_package_manager_yum
    command -v subscription-manager || die "subscription-manager not found"
    subscription-manager status || \
        echo "Warning: system does not seem to be registered to any" \
             "subscription management service" >&2
}

check_dist_ubuntu() {
    check_package_manager_apt
}

pre_minion_checks() {
    if declare -f "check_dist_$OS" &> /dev/null; then
        "check_dist_$OS"
    else
        die "OS $OS not supported"
    fi

    test "x$(whoami)" = "xroot" || die "Script must run as root"
    test -n "$SYSTEMCTL" || die "systemctl not found"
    test -x "$SYSTEMCTL" || die "systemctl at '$SYSTEMCTL' is not executable"
}

get_salt_container() {
    local -r max_retries=10
    local salt_container='' attempts=0
    local -a found_containers=()

    while [[ $attempts -lt $max_retries ]]; do
        IFS=$'\n' read -r -d '' -a found_containers < <(crictl ps -q \
            --label io.kubernetes.pod.namespace=kube-system \
            --label io.kubernetes.container.name=salt-master \
            --state Running && printf '\0')

        if [[ "${#found_containers[@]}" -eq 1 ]]; then
            salt_container=${found_containers[0]}
            break
        fi
        echo "Invalid number of candidates: ${#found_containers[@]}" >&2
        (( attempts++ ))
        sleep 3
    done

    if [ -z "$salt_container" ]; then
        echo "Failed to find a running 'salt-master' container" >&2
        exit 1
    fi

    echo "$salt_container"
}

configure_salt_minion_local_mode() {
    local -r file_root="$BASE_DIR/salt"

    "$SALT_CALL" --file-root="$file_root" \
        --local --retcode-passthrough saltutil.sync_all saltenv=base
    "$SALT_CALL" --file-root="$file_root" \
        --local --retcode-passthrough state.sls metalk8s.salt.minion.local \
        pillar="{'metalk8s': {'archives': '$BASE_DIR'}}" saltenv=base
}

get_salt_env() {
    "$SALT_CALL" --out txt slsutil.renderer \
        string="metalk8s-{{ pillar.metalk8s.nodes[grains.id].version }}" \
        | cut -c 8-
}

get_salt_minion_id() {
    "$SALT_CALL" --out txt grains.get id | cut -c 8-
}

get_salt_minion_ids() {
    local salt_container

    salt_container=$(get_salt_container)

    (
        set -o pipefail
        retry 5 10 crictl exec -i "$salt_container" \
            salt \* grains.get id --out txt | \
            cut -d ' ' -f 2
    )
}

retry() {
    local stdout
    local -i try=0 exit_code=0
    local -ri retries=$1 sleep_time=$2
    shift 2

    until stdout=$("$@"); do
        exit_code=$?
        (( ++try ))
        if [ $try -gt "$retries" ]; then
            echo "Failed to run '$*' after $retries retries." >&2
            return $exit_code
        fi
        sleep "$sleep_time"
    done

    echo "$stdout"
}
