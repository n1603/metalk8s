#!/bin/bash
# This script force regeneration of all certificates (including kubeconfig)
# on a MetalK8s platform. This is only for tests purposes and should not
# be run on a production platform.

ARCHIVE_MOUNTPOINT=$1
DAYS_VALID=370
# DAYS_REMAINING must be lower than DAYS_VALID to avoid
# renewing certificates on every Salt highstate run
DAYS_REMAINING=365
# BEACON_NOTIFY_DAYS must be greater or equal than DAYS_REMAINING
# in order to trigger a certificate renewal. It should also be lower
# than DAYS_VALID to avoid firing an event on every beacon run.
BEACON_NOTIFY_DAYS=365
BEACON_INTERVAL=60
ARCHIVE_PRODUCT_INFO=$ARCHIVE_MOUNTPOINT/product.txt
OVERRIDE_ROOT_CONF=/etc/salt/master.d/90-metalk8s-root-override.conf
OVERRIDE_PILLAR_DEST=/etc/salt/pillar-override

# shellcheck disable=SC1090
. "$ARCHIVE_PRODUCT_INFO"
# shellcheck disable=SC1090
. "$ARCHIVE_MOUNTPOINT/common.sh"

override_pillar_conf() {
    local -r certs_pillar_match="\ \ '*':\n    - match: compound\n    - certificates\n"

    mkdir -p "${OVERRIDE_ROOT_CONF%/*}" "${OVERRIDE_PILLAR_DEST%/*}"

    cp -rp "$ARCHIVE_MOUNTPOINT/pillar" "$OVERRIDE_PILLAR_DEST"

    cat > "$OVERRIDE_ROOT_CONF" << EOF
pillar_roots:
  metalk8s-$VERSION:
    - "$OVERRIDE_PILLAR_DEST"
EOF

    cat > "$OVERRIDE_PILLAR_DEST/certificates.sls" << EOF
certificates:
  client:
    days_remaining: $DAYS_REMAINING
    days_valid: $DAYS_VALID
  kubeconfig:
    days_remaining: $DAYS_REMAINING
    days_valid: $DAYS_VALID
  server:
    days_remaining: $DAYS_REMAINING
    days_valid: $DAYS_VALID
EOF

    sed -i "/^metalk8s-{{ version }}:$/a $certs_pillar_match" \
        "$OVERRIDE_PILLAR_DEST/top.sls"

    crictl stop "$(get_salt_container)"

    echo "Wait for Salt master to be ready..."
    sleep 30
}

apply_new_beacon_conf() {
    local salt_container
    local -ra pillar=(
        "{"
        "    'certificates': {"
        "        'beacon': {"
        "            'notify_days': $BEACON_NOTIFY_DAYS,"
        "            'interval': $BEACON_INTERVAL"
        "        }"
        "    }"
        "}"
    )

    salt_container=$(get_salt_container)

    crictl exec -i "$salt_container" \
        salt \* state.apply metalk8s.beacon.certificates \
        pillar="${pillar[*]}"
}

check_certificates_renewal() {
    local -i return_code=0
    local -a minions certificates
    local salt_container

    salt_container=$(get_salt_container)

    readarray -t minions < <(
        crictl exec -i "$salt_container" \
            salt \* grains.get id --out txt | \
            cut -d ' ' -f 2
    )

    for minion in "${minions[@]}"; do
        echo "Checking certificates for $minion..."
        readarray -t certificates < <(
            crictl exec -i "$salt_container" \
                salt "$minion" pillar.get certificates --out yaml | \
                awk '/path:/{ print $2 }'
        )

        for certificate in "${certificates[@]}"; do
            ctime=$(
                crictl exec -i "$salt_container" \
                    salt "$minion" file.stats "$certificate" --out yaml | \
                    awk '/ctime:/{ printf "%.0f", $2 }'
            )
            if (( ctime > TIMESTAMP )); then
                echo "- OK: $certificate successfully regenerated at $ctime."
            else
                echo "- FAILED: $certificate not regenerated."
                return_code=1
            fi
        done
    done

    return $return_code
}

reset_pillar_conf() {
    rm -rf "$OVERRIDE_ROOT_CONF" "$OVERRIDE_PILLAR_DEST"

    crictl stop "$(get_salt_container)"

    salt_container=$(get_salt_container)
}

TIMESTAMP=$(date +%s)

echo "Tests start at $TIMESTAMP."

# Update Salt configuration to trigger certificates renewal
override_pillar_conf
apply_new_beacon_conf

SLEEP_TIME=$(( BEACON_INTERVAL + 240 ))
echo "Waiting ${SLEEP_TIME}s for certificates to be regenerated..."
sleep $SLEEP_TIME

check_certificates_renewal

EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    echo "Waiting for debugging purposes..."
    sleep 7200
fi

reset_pillar_conf

exit $EXIT_CODE
