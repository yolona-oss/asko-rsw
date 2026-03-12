E_DIR="$1"
INLINE="$2"

INLINE_FLAG=$(test -n "$INLINE" && echo 1)

source "$(dirname $0)/extract_entities.sh"

list=()
while read -r file; do
    if [[ "$file" =~ __save ]]; then
        continue
    fi
    list+=("$(extract_entities "$file")")
done < <(find "$E_DIR" -name '*.entity.ts')

if test -z "$INLINE"; then
    echo "${list[@]}" | sed 's/ /,\n/g'
else
    echo "${list[@]}" | sed 's/ /, /g'
fi
