#!/bin/bash

input_file="$1"
special_col_index="$2"  # 0-based index

if [[ -z "$input_file" || -z "$special_col_index" ]]; then
  echo "Usage: $0 <input_file.csv> <special_column_index>"
  exit 1
fi

awk -v sc="$special_col_index" '
BEGIN {
    FS = OFS = ",";  # treat CSV as comma-delimited
    in_record = 0;
    record = "";
}
function strip_quotes(val) {
    gsub(/^"|"$/, "", val);
    return val;
}
function escape_special(val) {
    gsub(",", ";", val);  # replace commas with semicolons
    return val;
}
{
    # Join lines if quote count is not even (i.e., multiline field)
    record = (record == "") ? $0 : record "\n" $0;

    # Count quotes
    num_quotes = gsub(/"/, "&", record);
    if (num_quotes % 2 == 1) {
        next;  # keep joining until quote pairs are complete
    }

    # Now process full record
    n = split(record, fields, /","/);  # split fields safely assuming well-quoted
    for (i = 1; i <= n; i++) {
        if (i == sc + 1) {
            # Keep quotes, replace commas inside
            gsub(",", ";", fields[i]);
            output = output "\"" fields[i] "\"";
        } else {
            # Remove outer quotes
            gsub(/^"|"$/, "", fields[i]);
            output = (i == 1) ? fields[i] : output "," fields[i];
        }
    }

    # Fix ending: ensure 4 fields from end are CRITICAL,0,[optional_final_column],£
    # Count current fields
    total_fields = split(output, dummy, ",");
    if (total_fields == n) {
        # Missing final column (was empty)
        output = output ",,£";
    } else {
        output = output ",£";
    }

    print output;
    record = "";
    output = "";
}
' "$input_file"
