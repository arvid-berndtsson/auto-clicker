import keyboard
import pyautogui
import time

def main():
    print("Script started. Press and hold the 'z' key to click the left mouse button.")
    print("To stop the script entirely, press 'esc'.")

    while True:
        # Check if 'esc' is pressed
        if keyboard.is_pressed('esc'):
            print("Exiting script.")
            break

        # Check if 'h' is pressed
        if keyboard.is_pressed(6):
            pyautogui.click()
            time.sleep(0.001)

if __name__ == "__main__":
    main()
