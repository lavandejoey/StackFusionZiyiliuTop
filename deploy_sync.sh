#!/usr/bin/env bash
set -euo pipefail

# Lightweight rsync deploy script
# Sync only compiled `dist` folders, `config` (backend) and `package.json` files
# Usage: ./deploy_sync.sh [--dry-run] [--ssh-opts="-i /path/to/key -o StrictHostKeyChecking=no"]

REMOTE="zliu@ionosAllemagneUbuntu:~/StackFusionZiyiliuTop"
DRY_RUN=0
SSH_OPTS=""

while [[ $# -gt 0 ]]; do
	case "$1" in
	--dry-run)
		DRY_RUN=1
		shift
		;;
	--ssh-opts)
		SSH_OPTS="$2"
		shift 2
		;;
	--help | -h)
		echo "Usage: $0 [--dry-run] [--ssh-opts '...']"
		exit 0
		;;
	*)
		echo "Unknown arg: $1"
		exit 1
		;;
	esac
done

RSYNC_OPTS=(--archive --compress --delete --prune-empty-dirs --links --partial)
if [[ $DRY_RUN -eq 1 ]]; then
	RSYNC_OPTS+=(--dry-run)
	echo "Running in dry-run mode"
fi

# Helper to run rsync from local path to remote target path (creates remote dir)
rsync_to_remote() {
	local src="$1"
	local dest_dir="$2"
	local remote_host="${REMOTE%%:*}"
	local remote_base="${REMOTE#*:}"

	# ensure remote target dir exists
	ssh $SSH_OPTS "$remote_host" "mkdir -p '${remote_base%/}/$dest_dir'"

	rsync "${RSYNC_OPTS[@]}" -e "ssh $SSH_OPTS" "$src" "$remote_host:${remote_base%/}/$dest_dir/"
}

echo "Syncing to ${REMOTE}"

# backend compiled output and config
rsync_to_remote "backend/dist/" "backend/dist"
rsync_to_remote "backend/config/" "backend/config"

# frontend compiled output
rsync_to_remote "frontend/dist/" "frontend/dist"

# package.json files (root, backend, frontend)
rsync_to_remote "package.json" ""
rsync_to_remote "backend/package.json" "backend"
rsync_to_remote "frontend/package.json" "frontend"

echo "Sync complete."
