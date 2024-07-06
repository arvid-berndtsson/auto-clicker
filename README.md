# Arvid's Simple Auto Clicker

## Table of Contents

- [Arvid's Simple Auto Clicker](#arvids-simple-auto-clicker)
  - [Table of Contents](#table-of-contents)
  - [Project Overview](#project-overview)
  - [Features](#features)
  - [Files](#files)
  - [Setup and Installation](#setup-and-installation)
    - [Using Poetry](#using-poetry)
    - [Using Virtual Environment and Pip (alternative)](#using-virtual-environment-and-pip-alternative)
  - [Usage](#usage)
  - [Code Improvements](#code-improvements)
  - [License](#license)

## Project Overview

This project is an Auto Clicker tool written in Python. The script automates mouse clicking based on keyboard inputs. It uses the `keyboard` library to detect key presses and the `pyautogui` library to simulate mouse clicks. This tool can be particularly useful for repetitive tasks that require frequent mouse clicks.

## Features

- **Toggle Mode**: Press the `h` key to start clicking and press it again to stop.
- **Hold Mode**: Press and hold the `h` key to continuously click the left mouse button.
- **Double Click Mode**: Press and hold the `h` key to double click.
- **Random Click Mode**: Press and hold the `h` key to click at random intervals.
- **Burst Mode**: Press and hold the `h` key to click rapidly a specified number of times.
- **Stop Script**: Press the `esc` key to stop the script entirely.
- **Human-like Delays**: Introduce randomness in clicking delays using `--min-delay` and `--max-delay` arguments.

## Files

- `main.py`: The main script that runs the auto clicker.
- `get_scancode.py`: A helper script to retrieve scancode values for different keys.
- `pyproject.toml`: Poetry configuration file.
- `requirements.txt`: Lists the dependencies needed to run the project.
- `.gitignore`: Specifies files and directories to be ignored by Git.

## Setup and Installation

### Using Poetry

1. **Clone the repository**:

   ```sh
   git clone <repository-url>
   cd auto-clicker-main
   ```

2. **Install Poetry**:

   ```sh
   curl -sSL https://install.python-poetry.org | python3 -
   ```

3. **Install dependencies**:

   ```sh
   poetry install
   ```

4. **Activate the virtual environment**:
   ```sh
   poetry shell
   ```

### Using Virtual Environment and Pip (alternative)

1. **Clone the repository**:

   ```sh
   git clone <repository-url>
   cd auto-clicker-main
   ```

2. **Create a virtual environment** (optional but recommended):

   ```sh
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. **Install the required packages**:
   ```sh
   pip install -r requirements.txt
   ```

## Usage

1. **Run the script in default hold mode**:

   ```sh
   python main.py
   ```

2. **Run the script in toggle mode**:

   ```sh
   python main.py toggle
   ```

3. **Run the script in double click mode**:

   ```sh
   python main.py double
   ```

4. **Run the script in random click mode**:

   ```sh
   python main.py random
   ```

5. **Run the script in burst mode**:

   ```sh
   python main.py burst --burst-count 20
   ```

6. **Run the script with custom delays**:

   ```sh
   python main.py --min-delay 0.01 --max-delay 0.1
   ```

7. **Instructions**:
   - In toggle mode, press the `h` key to start clicking and press it again to stop.
   - In hold mode, press and hold the `h` key to start clicking.
   - In double click mode, press and hold the `h` key to double click.
   - In random click mode, press and hold the `h` key to click at random intervals.
   - In burst mode, press and hold the `h` key to click rapidly a specified number of times.
   - Press the `esc` key to stop the script in any mode.
   - Use `--min-delay` and `--max-delay` to introduce randomness in the clicking delays to make the clicking more human-like.

## Code Improvements

Here are a few suggestions to enhance the code quality and functionality, which can also help impress future employers:

1. **Exception Handling**:

   - Add exception handling to manage unexpected errors gracefully.

2. **Logging**:

   - Implement logging instead of print statements for better monitoring and debugging.

3. **Configurable Parameters**:
   - Allow users to configure the keys and the delay time via command-line arguments or a configuration file.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
