extract_entities() {
    local filename="$1"

    if [ ! -f "$filename" ]; then
        echo "Error: File '$filename' not found" >&2
        return 1
    fi

    awk '
    /@Entity\(\)/ { 
        found_entity = 1
        next
    }
found_entity && /export class/ {
    if (match($0, /export class[[:space:]]+([^{[:space:]]+)/, arr)) {
        print arr[1]
    }
found_entity = 0
}
' "$filename"
}
