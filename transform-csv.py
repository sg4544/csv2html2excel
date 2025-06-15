import csv
import sys

def main():
    if len(sys.argv) < 4:
        print("Usage: python prepare_for_mysql.py <input.csv> <special_col_index> <output.csv>")
        sys.exit(1)

    input_file = sys.argv[1]
    special_col_index = int(sys.argv[2])
    output_file = sys.argv[3]

    with open(input_file, mode='r', encoding='utf-8', newline='') as infile, \
         open(output_file, mode='w', encoding='utf-8', newline='') as outfile:

        reader = csv.reader(infile, quotechar='"')

        for row in reader:
            if not row:
                continue

            # Replace commas with semicolons in the special column
            if len(row) > special_col_index:
                row[special_col_index] = row[special_col_index].replace(',', ';')

            # Remove quotes from all columns except the special column
            cleaned_row = []
            for i, col in enumerate(row):
                if i == special_col_index:
                    cleaned_row.append(f'"{col}"')  # Keep quotes and newlines
                else:
                    cleaned_row.append(col.strip('"'))

            # Ensure at least 13 columns (padding if needed)
            while len(cleaned_row) < 13:
                cleaned_row.append('')

            # Append '£' field and write full row with no newline
            cleaned_row.append('£')
            outfile.write(','.join(cleaned_row))  # NO newline here

        outfile.flush()

    print(f"✅ File written: {output_file} — ready for MySQL LOAD with LINES TERMINATED BY '£'")

if __name__ == "__main__":
    main()
