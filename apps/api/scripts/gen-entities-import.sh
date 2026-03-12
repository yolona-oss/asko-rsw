E_DIR="$1"

source "$(dirname $0)/extract_entities.sh"

while read -r file; do
    if [[ "$file" =~ __save ]]; then
        continue
    fi
    __import_f="${file/$E_DIR\//}"
    import_f="${__import_f/.ts/}"

    file_entities=()
    for entity in $(extract_entities "$file"); do
        file_entities+=("$entity")
    done

    file_entities_string="$(echo "${file_entities[@]}" | tr ' ' ', ')"
    echo "export { ${file_entities_string} } from './${import_f}';"
done < <(find "$E_DIR" -name '*.entity.ts')
