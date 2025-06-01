import sys
import pandas as pd
import matplotlib
matplotlib.use('Agg') # Set a non-interactive backend for Matplotlib
import matplotlib.pyplot as plt
import io
import base64
import os
import json # Ensure json is imported
import re # Make sure re is imported at the top level of this script

# Function to convert CamelCase/PascalCase to snake_case (Corrected and standard Python regex)
# This function is defined here at the global scope of sandbox_processor.py
# and will be re-defined within the df_creation_code string for the exec context.
def _camel_to_snake_global(name): # Renamed to avoid confusion with internal exec function
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()

def safe_execute_plot_code(df_json_str, python_code, chart_save_path):
    """
    Executes the provided Python code in a sandboxed environment to generate a plot.
    The DataFrame is now injected directly as a JSON string.
    """
    try:
        # --- DEBUG PRINT ---
        print(f"DEBUG: Received df_json_str length: {len(df_json_str)}", file=sys.stderr)
        print(f"DEBUG: Received python_code:\n{python_code}", file=sys.stderr)
        # --- END DEBUG PRINT ---

        # The DataFrame creation and column normalization will now be part of the executed code.
        # This string will be prepended to the LLM-generated python_code.
        # Use repr() to safely embed df_json_str as a string literal in the Python code
        df_creation_code = f"""
import json
import pandas as pd
import re # NEW: Make re available inside the executed code (THIS WAS MISSING OR WRONG)
_df_data_str = {repr(df_json_str)} # Use repr() for safe string literal embedding
_df_data = json.loads(_df_data_str)
df = pd.DataFrame(_df_data['data'], columns=_df_data['columns'])

# Corrected Function to convert CamelCase/PascalCase to snake_case for execution context
# This is the function that will actually be used by the executed code.
def _camel_to_snake_internal(name):
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\\1_\\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\\1_\\2', s1).lower()

# --- NEW DEBUG PRINT INSIDE EXECUTED CODE ---
print(f"DEBUG_EXEC: Columns BEFORE internal normalization: {{df.columns.tolist()}}", file=sys.stderr)
df.columns = [_camel_to_snake_internal(col) for col in df.columns] # Apply the conversion
print(f"DEBUG_EXEC: Columns AFTER internal normalization: {{df.columns.tolist()}}", file=sys.stderr)
# --- END NEW DEBUG PRINT ---
"""
        # Combine the df creation code with the LLM-generated code
        full_python_code_to_exec = df_creation_code + python_code

        # --- EXISTING DEBUG: Print the full code being executed ---
        print(f"DEBUG: Full Python code being executed by sandbox:\n{full_python_code_to_exec}", file=sys.stderr)
        # --- END EXISTING DEBUG ---

        # Ensure chart directory exists
        chart_dir = os.path.dirname(chart_save_path)
        if not os.path.exists(chart_dir):
            os.makedirs(chart_dir)

        # Set up a restricted execution environment
        exec_globals = {
            'plt': plt,
            'sys': sys, # Allow access to the sys module for stderr
            're': re, # Ensure 're' module is available in global scope of exec
            '__builtins__': {
                '__import__': __import__, # Required to allow imports within the executed code
                'print': print, # Allow print for debugging
                'float': float, 'int': int, 'str': str, 'bool': bool, 'list': list, 'dict': dict,
                'min': min, 'max': max, 'sum': sum, 'len': len, 'abs': abs,
                'round': round, 'range': range, 'type': type, 'isinstance': isinstance,
                'KeyError': KeyError, 'ValueError': ValueError, 'TypeError': TypeError,
                'ZeroDivisionError': ZeroDivisionError, 'IndexError': IndexError,
                'AttributeError': AttributeError, 'NameError': NameError, 'Exception': Exception,
                'enumerate': enumerate, 'zip': zip, 'map': map, 'filter': filter, 'all': all, 'any': any,
                'sorted': sorted, 'reversed': reversed, 'set': set, 'frozenset': frozenset
            }
        }
        exec_locals = {} # 'df' is now created within the executed code itself, not passed as a local

        # Compile the code first to get clearer syntax errors
        try:
            compiled_code = compile(full_python_code_to_exec, '<string>', 'exec')
        except SyntaxError as se:
            print(f"ERROR: Python syntax compilation error: {se}", file=sys.stderr)
            return {"success": False, "error": f"Syntax Error: {se.msg} on line {se.lineno}, column {se.offset}. Code snippet: '{se.text}'"}

        # Execute the generated Python code (now using the compiled object)
        exec(compiled_code, exec_globals, exec_locals)

        # Ensure plot is saved
        plt.tight_layout() # Adjust plot to prevent labels from being cut off
        plt.savefig(chart_save_path) # Save the generated plot
        plt.close() # Close the plot to free up memory

        print("DEBUG_EXEC: Successfully completed execution and saved chart.", file=sys.stderr)

        return {"success": True, "message": "Chart generated successfully."}

    except Exception as e:
        plt.close() # Ensure plot is closed even on error
        error_message = str(e)
        # Explicitly print the error to stderr to ensure Node.js captures it
        print(f"ERROR: Python sandbox exception: {error_message}", file=sys.stderr)
        return {"success": False, "error": error_message}

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Missing arguments: df_json_str, chart_save_path. Python code expected from stdin."}), file=sys.stderr)
        sys.exit(1)

    df_json_str = sys.argv[1]       # The JSON string representation of the DataFrame
    chart_save_path = sys.argv[2]   # The path where the chart should be saved
    python_code = sys.stdin.read()  # Read the Python code from stdin

    result = safe_execute_plot_code(df_json_str, python_code, chart_save_path)
    print(json.dumps(result))

    if not result["success"]:
        sys.exit(1)