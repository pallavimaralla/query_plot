import pandas as pd
import sys
import json

def read_csv_to_json(file_path):
    """
    Reads a CSV file into a pandas DataFrame and returns its JSON representation.
    The 'split' orientation is chosen as it includes column names and data types,
    making it robust for reconstruction.
    """
    try:
        df = pd.read_csv(file_path)
        # Using 'split' orientation to preserve column names and data structure
        # index=False to prevent including pandas index in JSON
        return json.dumps(df.to_json(orient='split', index=False))
    except Exception as e:
        # Print error to stderr as JSON for Node.js to parse
        print(json.dumps({"error": f"Error reading CSV or converting to JSON: {str(e)}"}), file=sys.stderr)
        sys.exit(1) # Indicate an error to the calling process

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing file path argument."}), file=sys.stderr)
        sys.exit(1)

    csv_file_path = sys.argv[1]
    # Call the function and print its output to stdout
    print(read_csv_to_json(csv_file_path))