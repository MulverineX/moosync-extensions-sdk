#!/bin/python

import subprocess
import os
import sys
from pathlib import Path

current_directory = os.path.dirname(os.path.abspath(__file__))
new_env = os.environ.copy()

new_env["EXTISM_PYTHON_WASI_DEPS_DIR"] = os.path.join(current_directory, "..", "wasi-deps")

args = sys.argv[1]
python_path = str(Path(args).resolve().parent).rstrip("/")
old_python_path = os.environ.get("PYTHONPATH", f"{python_path}")
new_env["PYTHONPATH"] = old_python_path + f"{os.pathsep}{python_path}"

def find_lib(module_name, init_file: str = "__init__.py"):
    site_packages_dirs = [path for path in sys.path if "site-packages" in path]

    for site_dir in site_packages_dirs:
        module_path = os.path.join(site_dir, module_name)
        init_path = os.path.join(module_path, init_file)

        if os.path.isdir(module_path) and os.path.isfile(init_path):
            return init_path

    print("Failed to find moosync_edk package")
    sys.exit(1)
    return ""

lib_path = find_lib("moosync_edk")
new_env["PYTHONPATH"] = new_env["PYTHONPATH"] + f"{os.pathsep}{Path(lib_path).parent.parent.absolute()}"
print(new_env["PYTHONPATH"])

if sys.platform == "win32":
    binary_path = "extism-py.exe"
else:
    binary_path = "extism-py"
binary_args = sys.argv[2:]

result = subprocess.run([binary_path, lib_path] + binary_args, env=new_env, stdout=subprocess.PIPE,
    stderr=subprocess.PIPE, text=True)
print(result.stderr)
print(result.stdout)
sys.exit(result.returncode)
