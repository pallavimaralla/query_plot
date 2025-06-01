const axios = require('axios');

module.exports.extractChartIntent = async (query, preview, normalizedColumns) => { // Accepts normalizedColumns
    const prompt = `You are a Python data visualization expert.
Your task is to generate precise Python code using pandas, matplotlib, and seaborn.

Important instructions for code generation:
1.  **DataFrame Access**: The dataset is already loaded into a Pandas DataFrame named \`df\`. You **MUST NOT** assign to or redefine \`df\` (e.g., do not use \`df = pd.read_csv(...)\`, \`df = ...\`, or any other assignment to \`df\`).
2.  **Column Names**: The original CSV column names have been transformed into **snake_case** (all lowercase, words separated by underscores).
    The ONLY available columns in the DataFrame are:
    ${normalizedColumns.join(', ')}
    You MUST use these exact normalized column names when referencing columns in \`df\`. For example, if the original column was "PetalLength", you must use "petal_length". If it was "Sepal Width", you must use "sepal_width".
3.  **No Plot Display/Saving**: Do NOT include any code for displaying or saving the plot (e.g., \`plt.show()\`, \`plt.savefig()\`). The plot will be saved by the environment automatically.
4.  **Imports**: Always import necessary libraries like \`import pandas as pd\`, \`import matplotlib.pyplot as plt\`, and \`import seaborn as sns\` (if using seaborn functions) at the very beginning of the generated code.

Data Manipulation and Aggregation:
5.  **Aggregation by Category**: When a query asks for an aggregation (like "average", "mean", "sum", "count", "standard deviation", "std", "variance", "var") *by* a specific category (e.g., "by species", "per month"), you MUST perform a Pandas **groupby()** operation first, and then apply the aggregation function (e.g., \`.mean()\`, \`.std()\`, \`.sum()\`, \`.count()\`).
    Example for std: \`df_grouped = df.groupby('species')['petal_width'].std()\`
    **Crucially, when selecting multiple columns for operations like \`.groupby(...)[['col1', 'col2']].agg(...)\`, always use a list of strings (double square brackets) \`[['col1', 'col2']]\`, NOT a tuple \`('col1', 'col2')\`.**
6.  **Derived Features**: For queries involving derived features or logic (e.g., "sepal length + petal length"), calculate the new feature within the DataFrame first: \`df['new_col'] = df['col1'] + df['col2']\`.
7.  **Data Filtering**: For filtering data (e.g., "for Setosa species only"), apply boolean indexing: \`df_filtered = df[df['species'] == 'setosa']\`.
8.  **Data Binning**: For binning numerical data into ranges (e.g., "petal width ranges binned into 0.1 intervals"), use \`pd.cut()\` or \`pd.qcut()\`.

Chart Type Determination and Code Examples:
9.  **Infer Chart Type**: Determine the most appropriate chart type based on the user's query keywords. If the chart type is not explicitly mentioned or clearly implied, default to a bar chart for comparisons or a scatter plot for relationships between two numerical variables.
    // Pie/Donut Chart (plt.pie): Keywords: "pie chart", "distribution", "proportion", "share", "percentage".
// ONLY use value_counts() for a single categorical column. NEVER use groupby or aggregation for a single column's distribution.
// For a donut chart, add wedgeprops={'width': 0.4}.
// Example: df_counts = df['category'].value_counts(); plt.pie(df_counts, labels=df_counts.index, autopct='%1.1f%%', wedgeprops={'width': 0.4} if 'donut' in user_query.lower() else {}); plt.title('Distribution Title')

// Histogram (plt.hist): Keywords: "histogram", "frequency distribution".
// ONLY use the raw numerical column. NEVER use groupby, aggregation, or any transformation for histograms.
// Example: plt.hist(df['numerical_column'], bins=10); plt.title('Frequency Distribution Title'); plt.xlabel('Value'); plt.ylabel('Frequency')

// Bar Chart (plt.bar or sns.barplot): Keywords: "bar chart", "compare", "average X by Y", "count of X by Y", "horizontal bar chart".
// If the query asks for a summary by category (e.g., mean, sum, count), use groupby and the correct aggregation.
// If the query asks for simple counts of a categorical column, use value_counts().
// Example (aggregation): df_grouped = df.groupby('category')['value'].mean(); plt.bar(df_grouped.index, df_grouped.values); plt.xlabel('Category'); plt.ylabel('Value'); plt.title('Comparison Chart')
// Example (counts): df_counts = df['category'].value_counts(); plt.bar(df_counts.index, df_counts.values); plt.xlabel('Category'); plt.ylabel('Count'); plt.title('Count by Category')

// Scatter Plot (sns.scatterplot or plt.scatter): Keywords: "scatter plot", "correlation", "relationship between X and Y", "bubble chart".
// ALWAYS use the raw numerical columns. NEVER use groupby or aggregation unless the query explicitly requests it.
// Example: sns.scatterplot(x='numerical_col_x', y='numerical_col_y', data=df, hue='category_col')

// Boxplot (sns.boxplot): Keywords: "boxplot", "box plot", "distribution by category".
// ALWAYS use the raw DataFrame. NEVER use groupby, aggregation, or any transformation for boxplots. The y-axis must be a numerical column, the x-axis a categorical column.
// Example: sns.boxplot(x='category_col', y='numerical_col', data=df, hue='category_col', palette='pastel', legend=False); plt.xlabel('Category'); plt.ylabel('Value'); plt.title('Boxplot Title')

// Violin Plot (sns.violinplot): Keywords: "violin plot", "violinplot", "density distribution by category".
// ALWAYS use the raw DataFrame. NEVER use groupby, aggregation, or any transformation for violin plots. The y-axis must be a numerical column, the x-axis a categorical column.
// Example: sns.violinplot(x='category_col', y='numerical_col', data=df, hue='category_col'); plt.xlabel('Category'); plt.ylabel('Value'); plt.title('Violin Plot Title')

// Line Plot (plt.plot or sns.lineplot): Keywords: "line plot", "trend", "over time", "series".
// If the query requests a trend by category or time, use groupby and the correct aggregation. Otherwise, use the raw data.
// Example: plt.plot(df['x_col'], df['y_col']); plt.xlabel('X Label'); plt.ylabel('Y Label'); plt.title('Line Plot Title')
Final Touches:
10. Ensure the plot has appropriate labels (\`plt.xlabel\`, \`plt.ylabel\`) and a title (\`plt.title\`).

Dataset Preview:
${preview}

User Query:
${query}

Only return the Python code. No explanations, no comments, no extra text.`;

    try {
        const response = await axios.post('http://localhost:11434/api/generate', {
            model: 'codellama',
            prompt: prompt,
            stream: false
        });

        const code = response.data.response.trim();
        if (!code) {
            throw new Error('No code generated by the LLM');
        }
        const cleanedCode = code.replace(/plt\.show\(\)\s*;?/g, '');
        console.log('✅ Code generated by CodeLlama:\n', cleanedCode);
        return cleanedCode;
    } catch (err) {
        console.error('❌ Ollama LLM processing failed:', err.response?.data || err.message);
        throw new Error('LLM processing failed');
    }
};