import os
import subprocess
import sys
import tkinter as tk
from tkinter import messagebox
from tkinter import simpledialog

def check_command(command):
    """Check if a command is available in the system."""
    try:
        subprocess.run([command, '--version'], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return True
    except subprocess.CalledProcessError:
        return False

def install_dependencies():
    """Install dependencies using npm and pip."""
    if not check_command('node') or not check_command('npm'):
        messagebox.showerror("Error", "Node.js and npm are required but not found.")
        return
    
    try:
        subprocess.run(['npm', 'install'], check=True, cwd='./Ly.JSxPY')
    except subprocess.CalledProcessError as e:
        messagebox.showerror("Error", f"Failed to run 'npm install': {e}")
        return
    
    if sys.version_info < (3, 9):
        messagebox.showerror("Error", "Python 3.9 or higher is required.")
        return
    
    try:
        subprocess.run([sys.executable, '-m', 'venv', '.venv'], check=True)
        subprocess.run([os.path.join('.venv', 'bin', 'pip'), 'install', '-r', 'requirements.txt'], check=True)
    except subprocess.CalledProcessError as e:
        messagebox.showerror("Error", f"Failed to set up Python environment: {e}")
        return
    
    try:
        subprocess.run(['npm', 'run', 'build'], check=True, cwd='./Ly.JSxPY')
        messagebox.showinfo("Success", "Setup and build completed successfully!")
    except subprocess.CalledProcessError as e:
        messagebox.showerror("Error", f"Failed to run 'npm run build': {e}")

def clone_repository():
    """Clone the repository and run the installation."""
    try:
        subprocess.run(['git', 'clone', 'https://github.com/Lychan23/Ly.JSxPY.git'], check=True)
        install_dependencies()
    except subprocess.CalledProcessError as e:
        messagebox.showerror("Error", f"Failed to clone repository: {e}")

def on_run():
    """Handle the GUI button click event."""
    clone_repository()

# GUI Setup
root = tk.Tk()
root.title("Setup Script")

label = tk.Label(root, text="Setup Script for Ly.JSxPY")
label.pack(pady=10)

run_button = tk.Button(root, text="Run Setup", command=on_run)
run_button.pack(pady=20)

root.mainloop()
