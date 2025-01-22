#!/bin/python3

import subprocess
import os
import sys
from pathlib import Path

current_directory = os.path.dirname(os.path.abspath(__file__))
new_env = os.environ.copy()

new_env["EXTISM_PYTHON_WASI_DEPS_DIR"] = os.path.join(current_directory, "..", "wasi-deps")

args = sys.argv[1]
python_path = str(Path(args).resolve().parent).rstrip("/")
old_python_path = os.environ["PYTHONPATH"]
new_env["PYTHONPATH"] = old_python_path + f":{python_path}"

def find_lib(module_name, init_file: str = "__init__.py"):
    site_packages_dirs = [path for path in sys.path if "site-packages" in path]

    for site_dir in site_packages_dirs:
        module_path = os.path.join(site_dir, module_name)
        init_path = os.path.join(module_path, init_file)

        if os.path.isdir(module_path) and os.path.isfile(init_path):
            return init_path

    return ""


binary_path = "extism-py"
binary_args = sys.argv[2:]

result = subprocess.run([binary_path, find_lib("moosync_edk")] + binary_args, env=new_env, stdout=subprocess.PIPE,
    stderr=subprocess.PIPE, text=True)
print(result.stderr)
print(result.stdout)
sys.exit(result.returncode)
