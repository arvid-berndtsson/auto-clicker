"""Utility to print keyboard scancodes."""

from __future__ import annotations

import keyboard


def print_scancode(event: keyboard.KeyboardEvent) -> None:
    """Print the name and scancode of the key event."""

    print(f"Key: {event.name}, Scancode: {event.scan_code}")


def main() -> None:
    """Hook into the keyboard module and print scancodes until ESC is pressed."""

    print("Press any key to get its scancode. Press 'esc' to exit.")
    keyboard.hook(print_scancode)
    keyboard.wait("esc")


if __name__ == "__main__":
    main()
