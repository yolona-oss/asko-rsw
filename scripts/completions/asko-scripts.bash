# shellcheck shell=bash
# ASKO scripts tab-completion for bash.
#
# Source this file (e.g. in ~/.bashrc) to get arg/flag completion for
# every script in ./scripts. The completions activate for the common
# invocation forms `./scripts/<name>.sh`, `scripts/<name>.sh`, and bare
# `<name>.sh` (when `scripts/` is on PATH).
#
#   source scripts/completions/asko-scripts.bash
#
# Completion sources (kept in sync by convention, not runtime discovery):
#   _asko_services      — services that own a Postgres DB + migrations
#   _asko_apps          — every app (gateways + services + web)
#   _asko_event_groups  — EVENT_SIGNING_GROUPS group names
#   _asko_jwt_keys      — JWT keypair names
#   _asko_env_flavors   — env flavor names

# Back-service names (singular, used as positional args to drop-/migrate-/seed-/inject-).
_ASKO_SERVICES="chat content file notification payment repair user"

# Every app path under apps/ — used by env-push.sh.
_ASKO_APPS="auth-gateway chat-service content-gateway content-service file-service media-gateway notification-service payment-service realtime-gateway repair-gateway repair-service user-service web"

# Event-signing group names (generate-event-signing-keys.sh).
_ASKO_EVENT_GROUPS="payment default repair user chat schedule certificate address user_device"

# JWT key names (generate-jwt-keys.sh).
_ASKO_JWT_KEYS="access refresh email_confirm"

# env flavors for inject-event-signing-keys.sh.
_ASKO_ENV_FLAVORS="prod dev example"

# ── Helpers ─────────────────────────────────────────────────────────

# Generic "match current word against a space-separated word list".
_asko__words_to_comp() {
    local cur="${COMP_WORDS[COMP_CWORD]}"
    # shellcheck disable=SC2207
    COMPREPLY=($(compgen -W "$1" -- "$cur"))
}

# Register one completion function against every likely invocation form.
_asko__register() {
    local fn="$1"
    local base="$2"
    complete -F "$fn" -- "./scripts/$base" "scripts/$base" "$base"
}

# ── Per-script completion functions ────────────────────────────────

_asko_build() {
    _asko__words_to_comp "--skip-install"
}

_asko_db_switch() {
    # Positional: <host> [port]. Flags: --all, --env prod,dev,...
    local cur="${COMP_WORDS[COMP_CWORD]}"
    local prev="${COMP_WORDS[COMP_CWORD-1]}"
    if [[ "$prev" == "--env" ]]; then
        # Comma-separated list of flavors.
        _asko__words_to_comp "prod dev example"
        return
    fi
    if [[ "$cur" == --* ]]; then
        _asko__words_to_comp "--all --env"
        return
    fi
    # No suggestion for <host>/<port> — user types freely.
    COMPREPLY=()
}

_asko_services_arg() {
    _asko__words_to_comp "$_ASKO_SERVICES"
}

_asko_drop_prod() {
    local cur="${COMP_WORDS[COMP_CWORD]}"
    if [[ "$cur" == --* ]] || [[ $COMP_CWORD -eq 1 ]]; then
        _asko__words_to_comp "--confirm $_ASKO_SERVICES"
    else
        _asko__words_to_comp "$_ASKO_SERVICES"
    fi
}

_asko_env_push() {
    _asko__words_to_comp "$_ASKO_APPS"
}

_asko_generate_event_signing_keys() {
    local cur="${COMP_WORDS[COMP_CWORD]}"
    if [[ "$cur" == --* ]]; then
        _asko__words_to_comp "--help"
    else
        _asko__words_to_comp "$_ASKO_EVENT_GROUPS"
    fi
}

_asko_generate_jwt_keys() {
    local cur="${COMP_WORDS[COMP_CWORD]}"
    if [[ "$cur" == --* ]]; then
        _asko__words_to_comp "--help"
    else
        _asko__words_to_comp "$_ASKO_JWT_KEYS"
    fi
}

_asko_inject_event_signing_keys() {
    local cur="${COMP_WORDS[COMP_CWORD]}"
    local prev="${COMP_WORDS[COMP_CWORD-1]}"
    if [[ "$prev" == "--env" ]]; then
        _asko__words_to_comp "$_ASKO_ENV_FLAVORS"
        return
    fi
    if [[ "$cur" == --* ]]; then
        _asko__words_to_comp "--env --dry-run --help"
        return
    fi
    _asko__words_to_comp "$_ASKO_SERVICES"
}

_asko_openapi() {
    # No positional args; env vars set before the invocation. Nothing to complete.
    COMPREPLY=()
}

_asko_noargs() {
    COMPREPLY=()
}

# ── Registration ───────────────────────────────────────────────────

_asko__register _asko_build                         build.sh
_asko__register _asko_db_switch                     db-switch.sh
_asko__register _asko_noargs                        dev.sh
_asko__register _asko_services_arg                  drop-dev.sh
_asko__register _asko_drop_prod                     drop-prod.sh
_asko__register _asko_noargs                        env-pull.sh
_asko__register _asko_env_push                      env-push.sh
_asko__register _asko_noargs                        generate-signing-keys.sh
_asko__register _asko_generate_event_signing_keys   generate-event-signing-keys.sh
_asko__register _asko_generate_jwt_keys             generate-jwt-keys.sh
_asko__register _asko_inject_event_signing_keys     inject-event-signing-keys.sh
_asko__register _asko_services_arg                  migrate-dev.sh
_asko__register _asko_drop_prod                     migrate-prod.sh  # same --confirm + services shape
_asko__register _asko_noargs                        nginx-push.sh
_asko__register _asko_openapi                       openapi.sh
_asko__register _asko_services_arg                  seed-dev.sh
_asko__register _asko_drop_prod                     seed-prod.sh     # same --confirm + services shape
_asko__register _asko_noargs                        setup-dev.sh
