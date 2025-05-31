import sys
import pandas as pd
import matplotlib.pyplot as plt
import os

filename = sys.argv[1]
code = sys.stdin.read()

try:
    df = pd.read_csv(f'uploads/{filename}')
    globals()['df'] = df  # Make df available to exec()

    exec(code)

    os.makedirs("charts", exist_ok=True)
    chart_path = "charts/generated_chart.png"
    plt.savefig(chart_path)
    print("generated_chart.png")
except Exception as e:
    print(f'Error: {e}', file=sys.stderr)
    exit(1)
