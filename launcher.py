from flask import Flask, render_template_string, request, send_from_directory
import os
import random

app = Flask(__name__)
UPLOAD_FOLDER = '/tmp'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
OS_LIST_FILE = 'config/os_list'

def load_os_list():
    if os.path.exists(OS_LIST_FILE):
        with open(OS_LIST_FILE) as f:
            return [line.strip() for line in f if line.strip()]
    return []

HTML_TEMPLATE = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>ABC Helper</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        iframe {
            width: 100%;
            height: 500px;
            border: 1px solid #ccc;
        }
    </style>
</head>
<body class="bg-light">
    <div class="container py-4">
        <div class="card shadow-sm p-4 mb-5">
            <h2 class="mb-4 text-center">ABC Helper - Upload and Process</h2>
            <form method="POST" enctype="multipart/form-data">
                <div class="mb-3">
                    <label for="csv1" class="form-label">Upload First CSV File</label>
                    <input type="file" class="form-control" name="csv1" id="csv1" accept=".csv" required>
                </div>
                <div class="mb-3">
                    <label for="csv2" class="form-label">Upload Second CSV File</label>
                    <input type="file" class="form-control" name="csv2" id="csv2" accept=".csv" required>
                </div>
                <div class="mb-3">
                    <label for="selected_os" class="form-label">Select OS</label>
                    <select class="form-select" name="selected_os" id="selected_os" required>
                        {% for os in os_list %}
                            <option value="{{ os }}">{{ os }}</option>
                        {% endfor %}
                    </select>
                </div>
                <div class="text-center">
                    <button type="submit" class="btn btn-primary">Upload and Process</button>
                </div>
            </form>

            {% if filenames %}
            <div class="mt-4 alert alert-success">
                <h5>Uploaded Files:</h5>
                <ul>
                    {% for f in filenames %}
                        <li>{{ f }}</li>
                    {% endfor %}
                </ul>
                <p><strong>Selected OS:</strong> {{ selected_os }}</p>
            </div>
            {% endif %}
        </div>

        <div class="card shadow-sm p-4">
            <h4 class="mb-3 text-center">Data Reports</h4>
            <iframe src="/index.html"></iframe>
        </div>
    </div>
</body>
</html>
'''

@app.route("/", methods=["GET", "POST"])
def upload():
    filenames = []
    selected_os = None
    os_list = load_os_list()

    if request.method == "POST":
        for key in ['csv1', 'csv2']:
            file = request.files[key]
            if file and file.filename.endswith('.csv'):
                save_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
                file.save(save_path)
                filenames.append(file.filename)
        selected_os = request.form.get("selected_os")

    return render_template_string(HTML_TEMPLATE, filenames=filenames, selected_os=selected_os, os_list=os_list)

# Serve index.html from current directory
@app.route("/index.html")
def serve_index():
    return send_from_directory(os.path.dirname(os.path.abspath(__file__)), "index.html")

# Also serve other static .html files like report1.html if needed
@app.route("/<path:filename>")
def serve_file(filename):
    return send_from_directory(os.path.dirname(os.path.abspath(__file__)), filename)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
