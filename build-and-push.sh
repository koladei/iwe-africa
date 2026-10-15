#!/usr/bin/env bash

set -euo pipefail

no_cache=false
production=false
platforms=()
repository="${DOCKER_REPO:-koladei/iwe-africa}"

print_usage() {
	cat <<'EOF'
Usage: ./build-and-push.sh [options]

Options:
  --repo <name>       Docker repository name for both app and worker images (default: koladei/iwe-africa, or $DOCKER_REPO).
  --no-cache          Build images without using Docker cache.
  --production        Push production tags (latest/latest-arm). Without this, dev tags are used.
  --platform <list>   Comma-separated list of platforms to build (default: linux/amd64,linux/arm64).
  --help              Show this help message.

Examples:
  ./build-and-push.sh
  ./build-and-push.sh --production
  ./build-and-push.sh --repo koladei/iwe-africa --production
  ./build-and-push.sh --no-cache --platform linux/amd64,linux/arm64
EOF
}

parse_platform_arg() {
	local value="$1"
	IFS=',' read -r -a platform_list <<< "$value"
	for platform in "${platform_list[@]}"; do
		local normalized
		normalized=$(printf '%s' "$platform" | tr -d '[:space:]')
		case "$normalized" in
			amd64|x86_64)
				normalized="linux/amd64"
				;;
			arm64|aarch64)
				normalized="linux/arm64"
				;;
		esac
		if [[ -n "$normalized" ]]; then
			platforms+=("$normalized")
		fi
	done
}

while [[ $# -gt 0 ]]; do
	case "$1" in
		--repo|--repository|-r)
			if [[ $# -lt 2 ]]; then
				echo "Error: $1 requires a value" >&2
				exit 1
			fi
			repository="$2"
			shift 2
			;;
		--repo=*|--repository=*)
			repository="${1#*=}"
			shift
			;;
		--no-cache|no-cache)
			no_cache=true
			shift
			;;
		--production|production)
			production=true
			shift
			;;
		--help|-h|help)
			print_usage
			exit 0
			;;
		--platform|platform)
			if [[ $# -lt 2 ]]; then
				echo "Error: $1 requires a value" >&2
				exit 1
			fi
			parse_platform_arg "$2"
			shift 2
			;;
		--platform=*)
			parse_platform_arg "${1#*=}"
			shift
			;;
		platform=*)
			parse_platform_arg "${1#*=}"
			shift
			;;
		*)
			echo "Unknown option: $1" >&2
			exit 1
			;;
	esac
done

if [[ ${#platforms[@]} -eq 0 ]]; then
	platforms=(linux/amd64 linux/arm64)
fi

if git rev-parse --abbrev-ref '@{u}' >/dev/null 2>&1; then
	echo "Pulling latest changes from tracking branch..."
	git pull
else
	echo "No upstream tracking branch configured; skipping git pull."
fi

common_flags=()

if [[ "$no_cache" == true ]]; then
	common_flags+=(--no-cache)
fi

host_os=$(uname -s | tr '[:upper:]' '[:lower:]')
host_arch=$(uname -m)

case "$host_arch" in
	x86_64|amd64)
		host_arch=amd64
		;;
	aarch64|arm64)
		host_arch=arm64
		;;
esac

case "$host_os" in
	darwin)
		host_os=linux
		;;
esac

host_platform="${host_os}/${host_arch}"

tag_for_platform() {
	local platform="$1"
	case "$platform" in
		linux/amd64)
			echo "latest"
			return 0
			;;
		linux/arm64)
			echo "latest-arm"
			return 0
			;;
	esac
	local suffix="${platform#*/}"
	suffix="${suffix//\//-}"
	echo "latest-${suffix}"
}

for platform in "${platforms[@]}"; do
	image_tag=$(tag_for_platform "$platform")
	if [[ "$production" != true ]]; then
		case "$image_tag" in
			latest)
				image_tag="latest-dev"
				;;
			latest-arm)
				image_tag="latest-arm-dev"
				;;
		esac
	fi
	image_ref="${repository}:${image_tag}"
	worker_image_ref="${repository}:${image_tag}-worker"

	if [[ "$platform" == "$host_platform" ]]; then
		app_cmd=(docker build ${common_flags[@]+"${common_flags[@]}"} -f Dockerfile -t "$image_ref" .)
		printf 'Building app for %s natively: %s\n' "$platform" "${app_cmd[*]}"
		"${app_cmd[@]}"
		docker push "$image_ref"

		worker_cmd=(docker build ${common_flags[@]+"${common_flags[@]}"} -f Dockerfile.worker -t "$worker_image_ref" .)
		printf 'Building worker for %s natively: %s\n' "$platform" "${worker_cmd[*]}"
		"${worker_cmd[@]}"
		docker push "$worker_image_ref"
	else
		app_cmd=(docker buildx build --platform "$platform" ${common_flags[@]+"${common_flags[@]}"} -f Dockerfile -t "$image_ref" . --push)
		printf 'Building app for %s with buildx: %s\n' "$platform" "${app_cmd[*]}"
		"${app_cmd[@]}"

		worker_cmd=(docker buildx build --platform "$platform" ${common_flags[@]+"${common_flags[@]}"} -f Dockerfile.worker -t "$worker_image_ref" . --push)
		printf 'Building worker for %s with buildx: %s\n' "$platform" "${worker_cmd[*]}"
		"${worker_cmd[@]}"
	fi
done
