import keyboard
import pyautogui
import time
import logging
import argparse
import random

# Constants for key names
CLICK_KEY = "h"  # Key to start/stop clicking in toggle mode and to hold for clicking in hold mode
STOP_KEY = "esc"  # Key to stop the script

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)


def toggle_mode(min_delay: float, max_delay: float) -> None:
    clicking = False
    logging.info(
        "Toggle mode activated. Press '{}' to start/stop clicking. Press '{}' to stop the script.".format(
            CLICK_KEY, STOP_KEY
        )
    )

    try:
        while True:
            if keyboard.is_pressed(STOP_KEY):
                logging.info("Exiting script.")
                break

            if keyboard.is_pressed(CLICK_KEY):
                clicking = not clicking
                logging.info("Clicking: {}".format(clicking))
                time.sleep(0.5)  # Prevent rapid toggling

            if clicking:
                pyautogui.click()
                time.sleep(random.uniform(min_delay, max_delay))
    except Exception as e:
        logging.error("An error occurred: {}".format(e))


def hold_mode(min_delay: float, max_delay: float) -> None:
    logging.info(
        "Hold mode activated. Press and hold '{}' to start clicking. Press '{}' to stop the script.".format(
            CLICK_KEY, STOP_KEY
        )
    )

    try:
        while True:
            if keyboard.is_pressed(STOP_KEY):
                logging.info("Exiting script.")
                break

            if keyboard.is_pressed(CLICK_KEY):
                pyautogui.click()
                time.sleep(random.uniform(min_delay, max_delay))
    except Exception as e:
        logging.error("An error occurred: {}".format(e))


def double_click_mode(min_delay: float, max_delay: float) -> None:
    logging.info(
        "Double Click mode activated. Press and hold '{}' to start double clicking. Press '{}' to stop the script.".format(
            CLICK_KEY, STOP_KEY
        )
    )

    try:
        while True:
            if keyboard.is_pressed(STOP_KEY):
                logging.info("Exiting script.")
                break

            if keyboard.is_pressed(CLICK_KEY):
                pyautogui.click()
                time.sleep(0.01)
                pyautogui.click()
                time.sleep(random.uniform(min_delay, max_delay))
    except Exception as e:
        logging.error("An error occurred: {}".format(e))


def random_click_mode(min_delay: float, max_delay: float) -> None:
    logging.info(
        "Random Click mode activated. Press and hold '{}' to start clicking at random intervals. Press '{}' to stop the script.".format(
            CLICK_KEY, STOP_KEY
        )
    )

    try:
        while True:
            if keyboard.is_pressed(STOP_KEY):
                logging.info("Exiting script.")
                break

            if keyboard.is_pressed(CLICK_KEY):
                pyautogui.click()
                time.sleep(random.uniform(min_delay, max_delay))
    except Exception as e:
        logging.error("An error occurred: {}".format(e))


def burst_mode(burst_count: int, min_delay: float, max_delay: float) -> None:
    logging.info(
        "Burst mode activated. Press and hold '{}' to start burst clicking. Press '{}' to stop the script.".format(
            CLICK_KEY, STOP_KEY
        )
    )

    try:
        while True:
            if keyboard.is_pressed(STOP_KEY):
                logging.info("Exiting script.")
                break

            if keyboard.is_pressed(CLICK_KEY):
                for _ in range(burst_count):
                    pyautogui.click()
                    time.sleep(random.uniform(min_delay, max_delay))
                time.sleep(0.5)  # Pause between bursts
    except Exception as e:
        logging.error("An error occurred: {}".format(e))


def main() -> None:
    parser = argparse.ArgumentParser(description="Auto Clicker Script")
    parser.add_argument(
        "mode",
        nargs="?",
        default="hold",
        choices=["toggle", "hold", "double", "random", "burst"],
        help="Choose a mode: 'toggle', 'hold', 'double', 'random', 'burst'. Default is 'hold'.",
    )
    parser.add_argument(
        "--min-delay",
        type=float,
        default=0.001,
        help="Minimum delay between clicks (in seconds). Default is 0.001.",
    )
    parser.add_argument(
        "--max-delay",
        type=float,
        default=0.005,
        help="Maximum delay between clicks (in seconds). Default is 0.005.",
    )
    parser.add_argument(
        "--burst-count",
        type=int,
        default=10,
        help="Number of clicks in a burst. Default is 10.",
    )
    args = parser.parse_args()

    min_delay = args.min_delay
    max_delay = args.max_delay
    burst_count = args.burst_count

    if min_delay > max_delay:
        logging.error("Minimum delay cannot be greater than maximum delay.")
        return

    if args.mode == "toggle":
        toggle_mode(min_delay, max_delay)
    elif args.mode == "double":
        double_click_mode(min_delay, max_delay)
    elif args.mode == "random":
        random_click_mode(min_delay, max_delay)
    elif args.mode == "burst":
        burst_mode(burst_count, min_delay, max_delay)
    else:
        hold_mode(min_delay, max_delay)


if __name__ == "__main__":
    main()
