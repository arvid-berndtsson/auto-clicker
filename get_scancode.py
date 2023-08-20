import keyboard

def print_scancode(e):
    print(f"Key: {e.name}, Scancode: {e.scan_code}")

print("Press any key to get its scancode. Press 'esc' to exit.")

# Hook to all key events
keyboard.hook(print_scancode)
keyboard.wait('esc')
