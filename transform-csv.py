import csv
import sys
import os

def main():
    if len(sys.argv) < 4:
        print("Usage: python transform_csv.py <input_file.csv> <special_column_index> <output_filename.csv>")
        sys.exit(1)

    input_file = sys.argv[1]
    special_col_index = int(sys.argv[2])  # 0-based index
    output_file = os.path.join(os.getcwd(), sys.argv[3])

    with open(input_file, mode='r', encoding='utf-8', newline='') as infile, \
         open(output_file, mode='w', encoding='utf-8', newline='') as outfile:

        reader = csv.reader(infile, quotechar='"')
        writer = csv.writer(outfile, quoting=csv.QUOTE_MINIMAL)

        for row in reader:
            if not row:
                continue

            # Replace commas in special column
            if len(row) > special_col_index:
                row[special_col_index] = row[special_col_index].replace(',', ';')

            # Remove double quotes from all columns except the special one
            cleaned_row = [
                col if i == special_col_index else col.replace('"', '')
                for i, col in enumerate(row)
            ]

            # Pad to ensure at least 13 columns
            while len(cleaned_row) < 13:
                cleaned_row.append('')

            # Ensure final structure ends with final column (may be empty) + £
            if len(cleaned_row) == 13:
                cleaned_row.append('£')
            elif len(cleaned_row) == 14:
                cleaned_row.append('£')
            elif len(cleaned_row) > 14:
                cleaned_row = cleaned_row[:14] + ['£']

            writer.writerow(cleaned_row)

    print(f"✅ Transformation complete. Output written to: {output_file}")

if __name__ == "__main__":
    main()
