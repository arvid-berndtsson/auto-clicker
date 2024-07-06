import keyboard


def print_scancode(e: keyboard.KeyboardEvent) -> None:
    """Prints the name and scancode of the key event."""
    print(f"Key: {e.name}, Scancode: {e.scan_code}")


def main() -> None:
    """Main function to hook into keyboard events and print scancodes."""
    print("Press any key to get its scancode. Press 'esc' to exit.")

    # Hook to all key events
    keyboard.hook(print_scancode)

    # Wait for the 'esc' key to exit
    keyboard.wait("esc")


if __name__ == "__main__":
    main()
