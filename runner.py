"""
runner.py

This script runs a series of commands to build, start, and execute a Python script.
"""

import subprocess

def run_build():
    """Run npm build command"""
    print("Running npm build...")
    try:
        subprocess.run(
            ["npm", "run", "build"],
            capture_output=True,
            text=True,
            check=True
        )
    except subprocess.CalledProcessError as e:
        print(f"Error during build: {e.stderr}")
        return False
    print("Build completed successfully.")
    return True

def run_start():
    """Run npm start command"""
    print("Running npm start...")
    try:
        subprocess.run(
            ["npm", "run", "start"],
            capture_output=True,
            text=True,
            check=True
        )
    except subprocess.CalledProcessError as e:
        print(f"Error during start: {e.stderr}")
        return False
    print("npm start completed successfully.")
    return True

def run_python_script():
    """Run the Python script"""
    print("Running ai/main.py...")
    try:
        subprocess.run(
            ["python", "ai/main.py"],
            capture_output=True,
            text=True,
            check=True
        )
    except subprocess.CalledProcessError as e:
        print(f"Error during Python script execution: {e.stderr}")
        return False
    print("Python script executed successfully.")
    return True

if __name__ == "__main__":
    if run_build() and run_start() and run_python_script():
        print("All tasks completed successfully.")
    else:
        print("One or more tasks failed.")
