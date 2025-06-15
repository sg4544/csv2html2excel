#!/bin/bash

input_file="$1"
special_col_index="$2"  # 0-based index

if [[ -z "$input_file" || -z "$special_col_index" ]]; then
  echo "Usage: $0 <input_file.csv> <special_column_index>"
  exit 1
fi

awk -v sc="$special_col_index" '
BEGIN {
    FS = OFS = ",";
    record = "";
}
function clean_field(f, idx) {
    # Keep special column quoted with comma→semicolon replacement
    if (idx == sc + 1) {
        gsub(",", ";", f);
        return "\"" f "\"";
    } else {
        gsub(/^"|"$/, "", f);  # strip outer quotes
        return f;
    }
}
{
    record = (record == "") ? $0 : record "\n" $0;

    # Count number of double quotes so far
    q = gsub(/"/, "&", record);
    if (q % 2 == 1) {
        next;  # not a complete record yet
    }

    # Remove final comma if present
    sub(/,\s*$/, "", record);

    # Remove outer quote before and after split
    sub(/^"/, "", record);
    sub(/"$/, "", record);

    n = split(record, fields, /","/);
    output = "";

    for (i = 1; i <= n; i++) {
        output = (i == 1) ? clean_field(fields[i], i-1) : output OFS clean_field(fields[i], i-1);
    }

    # Ensure final column behavior
    if (n == 13) {
        output = output OFS "£";
    } else if (n == 14) {
        output = output OFS "£";
    } else {
        # Malformed, pad just in case
        while (n < 13) {
            output = output OFS "";
            n++;
        }
        output = output OFS "£";
    }

    print output;
    record = "";
}
' "$input_file"
