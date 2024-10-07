import os
import subprocess
import platform
import sys
from rich.console import Console
from rich.prompt import Prompt
from rich.table import Table
from rich.text import Text

# Initialize the rich console
console = Console()

# Append this file's real path to the system path
current_dir = os.path.dirname(os.path.realpath(__file__))
sys.path.append(current_dir)
console.print(f"[green]Current script directory appended to path:[/green] {current_dir}")

# Check Python version
python_version = sys.version_info
console.print(f"[cyan]Running Python version:[/cyan] {python_version.major}.{python_version.minor}.{python_version.micro}")

if python_version < (3, 6):
    console.print("[bold red]Error: This script requires Python 3.6 or higher.[/bold red]")
    sys.exit(1)

# Define error handling function
def handle_error(command, error_message):
    console.print(f"[bold red]Error:[/bold red] {error_message}")
    if "npm" in command:
        console.print("[yellow]Hint: You might need to run 'npm install' to install the dependencies.[/yellow]")
    elif "python" in command:
        console.print("[yellow]Hint: You might need to run 'pip install -r requirements.txt' to install the dependencies.[/yellow]")

# Function to run a command
def run_command(command, shell_option):
    try:
        subprocess.run(command, shell=shell_option, check=True)
    except subprocess.CalledProcessError as e:
        handle_error(command, str(e))

# Display menu options using a rich table
def display_menu():
    table = Table(title="Options", show_header=True, header_style="bold magenta")
    table.add_column("Option", style="dim", width=12)
    table.add_column("Description")

    table.add_row("1", "Run Python script (ai/main.py)")
    table.add_row("2", "Run Node.js app (npm run start)")
    table.add_row("0", "Exit")
    console.print(table)

# Main script function
def main():
    while True:
        display_menu()
        choice = Prompt.ask("[green]Enter your choice (1, 2, or 0 to exit)[/green]")

        if choice == '1':
            # Run Python script
            console.print("[bold blue]Running Python script...[/bold blue]")
            run_command(['python', '-u', os.path.join(current_dir, 'ai', 'main.py')], shell=False)
        elif choice == '2':
            # Run Node.js app
            console.print("[bold blue]Starting Node.js app...[/bold blue]")
            if platform.system() == 'Windows':
                run_command(['npm', 'run', 'start'], shell=True)
            else:
                run_command(['npm', 'run', 'start'], shell=False)
        elif choice == '0':
            console.print("[bold yellow]Exiting...[/bold yellow]")
            break
        else:
            console.print("[bold red]Invalid option, please choose 1, 2, or 0.[/bold red]")

if __name__ == "__main__":
    main()
