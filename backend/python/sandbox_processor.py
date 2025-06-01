import sys
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import os
import json
import re

def _camel_to_snake_global(name):
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()

def safe_execute_plot_code(df_json_str, python_code, chart_save_path):
    try:
        # Prepare DataFrame creation code
        df_creation_code = f"""
import json
import pandas as pd
import re
_df_data_str = {repr(df_json_str)}
_df_data = json.loads(_df_data_str)
df = pd.DataFrame(_df_data['data'], columns=_df_data['columns'])
def _camel_to_snake_internal(name):
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\\1_\\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\\1_\\2', s1).lower()
df.columns = [_camel_to_snake_internal(col) for col in df.columns]
"""
        full_python_code_to_exec = df_creation_code + python_code

        # Ensure chart directory exists
        chart_dir = os.path.dirname(chart_save_path)
        if not os.path.exists(chart_dir):
            os.makedirs(chart_dir)

        # Restrict built-ins for security
        exec_globals = {
            'plt': plt,
            'sys': sys,
            're': re,
            '__builtins__': {
                '__import__': __import__,
                'print': print,
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
        exec_locals = {}

        # Compile and execute code
        try:
            compiled_code = compile(full_python_code_to_exec, '<string>', 'exec')
        except SyntaxError as se:
            return {"success": False, "error": f"Syntax Error: {se.msg} on line {se.lineno}, column {se.offset}. Code snippet: '{se.text}'"}

        exec(compiled_code, exec_globals, exec_locals)

        # Save the chart
        plt.tight_layout()
        plt.savefig(chart_save_path)
        plt.close('all')

        return {"success": True, "message": "Chart generated successfully."}

    except Exception as e:
        plt.close('all')
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Missing arguments: df_json_str, chart_save_path. Python code expected from stdin."}), file=sys.stderr)
        sys.exit(1)

    df_json_str = sys.argv[1]
    chart_save_path = sys.argv[2]
    python_code = sys.stdin.read()

    result = safe_execute_plot_code(df_json_str, python_code, chart_save_path)
    print(json.dumps(result))

    if not result["success"]:
        sys.exit(1)