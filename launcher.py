from flask import Flask, render_template_string, request, send_from_directory
import os
import random
import string
import subprocess

app = Flask(__name__)
OS_LIST_FILE = 'config/os_list'
UPLOAD_ROOT = '/tmp'
PROCESS_SCRIPT = '/root/process_files.sh'
INDEX_HTML_PATH = 'index.html'


def load_os_list():
    if os.path.exists(OS_LIST_FILE):
        with open(OS_LIST_FILE) as f:
            return [line.strip() for line in f if line.strip()]
    return []


def generate_random_dirname(os_name):
    rand_suffix = ''.join(random.choices(string.digits, k=6))
    return f"{os_name}_{rand_suffix}"


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
            height: 600px;
            border: none;
        }
    </style>
</head>
<body class="bg-light">
    <div class="container py-4">
        <div class="card shadow-sm p-4 mb-5">
            <h2 class="mb-4 text-center">ABC Helper</h2>
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

            {% if message %}
            <div class="mt-4 alert alert-info">
                <strong>{{ message }}</strong>
            </div>
            {% endif %}
        </div>

        <h4 class="mb-3">Data Reports</h4>
        <iframe src="/static/index.html"></iframe>
    </div>
</body>
</html>
'''


@app.route("/", methods=["GET", "POST"])
def upload():
    os_list = load_os_list()
    message = None

    if request.method == "POST":
        selected_os = request.form.get("selected_os")
        if not selected_os:
            message = "OS not selected."
            return render_template_string(HTML_TEMPLATE, os_list=os_list, message=message)

        # Create random directory
        dirname = generate_random_dirname(selected_os)
        full_path = os.path.join(UPLOAD_ROOT, dirname)
        os.makedirs(full_path, exist_ok=True)

        # Save files
        saved_files = []
        for key in ['csv1', 'csv2']:
            file = request.files[key]
            if file and file.filename.endswith('.csv'):
                file_path = os.path.join(full_path, file.filename)
                file.save(file_path)
                saved_files.append(file_path)

        # Call shell script with directory path
        try:
            subprocess.run([PROCESS_SCRIPT, full_path], check=True)
            message = f"Files uploaded and processed successfully in: {full_path}"
        except subprocess.CalledProcessError as e:
            message = f"Error running script: {e}"

        return render_template_string(HTML_TEMPLATE, os_list=os_list, message=message)

    return render_template_string(HTML_TEMPLATE, os_list=os_list, message=None)


if __name__ == "__main__":
    app.run(port=8000)
