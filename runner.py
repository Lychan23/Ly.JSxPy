import subprocess
import os

def run_build():
    """Run npm build command"""
    print("Running npm build...")
    result = subprocess.run(["npm", "run", "build"], capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error during build: {result.stderr}")
        return False
    print("Build completed successfully.")
    return True

def run_start():
    """Run npm start command"""
    print("Running npm start...")
    result = subprocess.run(["npm", "run", "start"], capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error during start: {result.stderr}")
        return False
    print("npm start completed successfully.")
    return True

def run_python_script():
    """Run the Python script"""
    print("Running ai/main.py...")
    result = subprocess.run(["python", "ai/main.py"], capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error during Python script execution: {result.stderr}")
        return False
    print("Python script executed successfully.")
    return True

if __name__ == "__main__":
    if run_build() and run_start() and run_python_script():
        print("All tasks completed successfully.")
    else:
        print("One or more tasks failed.")
