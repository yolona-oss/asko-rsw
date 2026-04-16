# ASKO scripts tab-completion for fish.
#
# Source this file to get arg/flag completion for every script in
# ./scripts. The completions activate for the common invocation forms
# `./scripts/<name>.sh`, `scripts/<name>.sh`, and bare `<name>.sh` (when
# `scripts/` is on PATH).
#
#   source scripts/completions/asko-scripts.fish
#
# Fish registers completions by command name; we register each script
# three times so all invocation shapes are covered.

# ── Source lists ───────────────────────────────────────────────────
set -l __asko_services       chat content file notification payment repair user
set -l __asko_apps           auth-gateway chat-service content-gateway content-service file-service media-gateway notification-service payment-service realtime-gateway repair-gateway repair-service user-service web
set -l __asko_event_groups   payment default repair user chat schedule certificate address user_device
set -l __asko_jwt_keys       access refresh email_confirm
set -l __asko_env_flavors    prod dev example

# ── Helper: register the same completion against three command forms ──
function __asko_register --argument-names base
    set -l fn $argv[2..-1]
    for cmd in "./scripts/$base" "scripts/$base" "$base"
        # Re-expand $fn in the new command context.
        eval "complete -c '$cmd' $fn"
    end
end

# ── build.sh ───────────────────────────────────────────────────────
__asko_register build.sh "-l skip-install -d 'Skip package install (pnpm install)'"

# ── db-switch.sh ───────────────────────────────────────────────────
__asko_register db-switch.sh "-l all -d 'Update all env flavors (prod, dev, .env)'"
__asko_register db-switch.sh "-l env -r -d 'Comma-separated env flavors (e.g. prod,dev)'"

# ── dev.sh ─────────────────────────────────────────────────────────
# No args.

# ── drop-dev.sh, migrate-dev.sh, seed-dev.sh ──────────────────────
# Positional service names.
for s in $__asko_services
    __asko_register drop-dev.sh    "-f -a $s -d service"
    __asko_register migrate-dev.sh "-f -a $s -d service"
    __asko_register seed-dev.sh    "-f -a $s -d service"
end

# ── drop-prod.sh, migrate-prod.sh, seed-prod.sh ───────────────────
# Require --confirm + optional service list.
for prod_cmd in drop-prod.sh migrate-prod.sh seed-prod.sh
    __asko_register $prod_cmd "-l confirm -d 'Acknowledge destructive prod operation'"
    for s in $__asko_services
        __asko_register $prod_cmd "-f -a $s -d service"
    end
end

# ── env-pull.sh ────────────────────────────────────────────────────
# No args.

# ── env-push.sh ────────────────────────────────────────────────────
# Positional app names.
for a in $__asko_apps
    __asko_register env-push.sh "-f -a $a -d app"
end

# ── generate-event-signing-keys.sh ─────────────────────────────────
__asko_register generate-event-signing-keys.sh "-l help -d 'Show usage'"
for g in $__asko_event_groups
    __asko_register generate-event-signing-keys.sh "-f -a $g -d 'signing group'"
end

# ── generate-jwt-keys.sh ───────────────────────────────────────────
__asko_register generate-jwt-keys.sh "-l help -d 'Show usage'"
for k in $__asko_jwt_keys
    __asko_register generate-jwt-keys.sh "-f -a $k -d 'jwt key'"
end

# ── generate-signing-keys.sh ───────────────────────────────────────
# No args (outputs a single EC keypair to stdout).

# ── inject-event-signing-keys.sh ───────────────────────────────────
__asko_register inject-event-signing-keys.sh "-l env -r -a '$__asko_env_flavors' -d 'env flavor (prod|dev|example)'"
__asko_register inject-event-signing-keys.sh "-l dry-run -d 'Print changes without writing'"
__asko_register inject-event-signing-keys.sh "-l help -d 'Show usage'"
for s in $__asko_services
    __asko_register inject-event-signing-keys.sh "-f -a $s -d service"
end

# ── nginx-push.sh ──────────────────────────────────────────────────
# No args.

# ── openapi.sh ─────────────────────────────────────────────────────
# No positional args; env var overrides happen BEFORE the command so we
# don't attempt to complete them here.

# ── setup-dev.sh ───────────────────────────────────────────────────
# No args.

# Clean up the helper so it doesn't live in the user's function namespace
# once sourcing finishes.
functions -e __asko_register
