import platform
from setuptools import setup
from setuptools.command.develop import develop
from setuptools.command.install import install
from setuptools.command.build_ext import build_ext
import subprocess
import os
import shutil

def remove_if_exists(path: str):
    if os.path.exists(path):
        if os.path.isfile(path):
            os.remove(path)
        elif os.path.isdir(path):
            shutil.rmtree(path)
        

def install_deps():
    remove_if_exists("extism-py")
    remove_if_exists("wasi-deps")

    system = platform.system()
    if system == "Windows":
        subprocess.call(["install-extism.bat"])
    elif system in ["Linux", "Darwin"]:
        subprocess.call(["./install-extism.sh"])
    else:
        raise RuntimeError(f"Unsupported OS: {system}")


class PostBuildCommand(build_ext):
    """Post-installation for installation mode."""
    def run(self):
        install_deps()
        build_ext.run(self)

class PostDevelopCommand(develop):
    """Post-installation for installation mode."""
    def run(self):
        install_deps()
        develop.run(self)

class PostInstallCommand(install):
    """Post-installation for installation mode."""
    def run(self):
        install_deps()
        
        if self.prefix is not None:
            data_dir = os.path.join(self.prefix, "wasi-deps")
            self.copy_tree("./wasi-deps", data_dir)

        install.run(self)

setup(
    name='moosync-edk',
    packages=['moosync_edk'],
    version='0.1.0',
    description='Extension development kit for Moosync',
    author='Sahil Gupte',
    cmdclass={
        'develop': PostDevelopCommand,
        'install': PostInstallCommand,
        'build_ext': PostBuildCommand
    },
    zip_safe=False,
    scripts=["moosync-edk"],
    include_package_data=True,
    data_files=[
        ('bin', ["moosync-edk", "extism-py"])
    ]
)
