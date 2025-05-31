import sys
import pandas as pd
import matplotlib.pyplot as plt
import io
import base64
import os
import json # Ensure json is imported

def safe_execute_plot_code(df_json_str, python_code, chart_save_path):
    """
    Executes the provided Python code in a sandboxed environment to generate a plot.
    The DataFrame is now injected directly as a JSON string.
    """
    try:
        # 1. Deserialize the DataFrame from JSON
        # This assumes the JSON was generated with orient='split'
        df_data = json.loads(df_json_str)
        df = pd.DataFrame(df_data['data'], columns=df_data['columns'])

        # Ensure chart directory exists
        chart_dir = os.path.dirname(chart_save_path)
        if not os.path.exists(chart_dir):
            os.makedirs(chart_dir)

        # Set up a restricted execution environment
        # Only provide necessary functions and modules
        exec_globals = {
            'pd': pd,
            'plt': plt,
            '__builtins__': {
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
        exec_locals = {'df': df} # Make the DataFrame available as 'df'

        # Execute the generated Python code
        # The LLM's code will now operate on the 'df' variable
        exec(python_code, exec_globals, exec_locals)

        # Ensure plot is saved
        plt.tight_layout() # Adjust plot to prevent labels from being cut off
        plt.savefig(chart_save_path) # Save the generated plot
        plt.close() # Close the plot to free up memory

        return {"success": True, "message": "Chart generated successfully."}

    except Exception as e:
        plt.close() # Ensure plot is closed even on error
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    # Expecting arguments: df_json_str, python_code, chart_save_path
    if len(sys.argv) < 4: # Changed from 5 to 4 arguments
        print(json.dumps({"success": False, "error": "Missing arguments: df_json_str, python_code, chart_save_path."}), file=sys.stderr)
        sys.exit(1)

    df_json_str = sys.argv[1]       # The JSON string representation of the DataFrame
    python_code = sys.argv[2]       # The LLM generated Python code
    chart_save_path = sys.argv[3]   # The path where the chart should be saved

    # The original_filename argument is no longer passed or needed here for file loading.

    result = safe_execute_plot_code(df_json_str, python_code, chart_save_path)
    print(json.dumps(result))

    if not result["success"]:
        sys.exit(1)