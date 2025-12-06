# Recording and Advanced Features Guide

This guide covers the advanced features of Auto Clicker, including action recording, sequence playback, smooth mouse movement, and screen recognition capabilities.

## Table of Contents

1. [Action Recording](#action-recording)
2. [Sequence Playback](#sequence-playback)
3. [Smooth Mouse Movement](#smooth-mouse-movement)
4. [Color Recognition](#color-recognition)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Action Recording

Action recording allows you to capture a sequence of mouse click positions and play them back later. This is perfect for:
- Repetitive clicking tasks
- Multi-step automation workflows
- Game farming and grinding
- Testing and demonstration purposes

### How to Record a Sequence

1. **Start Recording**
   - Click the "RECORD" button in the Recording section
   - The button will become disabled and the "STOP" button will activate
   - You'll see a message indicating recording has started

2. **Capture Click Positions**
   - Move your mouse to the first position you want to record
   - Press `Ctrl+Shift+R` (or `Cmd+Shift+R` on macOS)
   - You'll see a console message confirming the position was recorded
   - Repeat for each position you want to include

3. **Stop Recording**
   - Click the "STOP" button when you've captured all positions
   - A dialog will prompt you to name your sequence
   - Enter a descriptive name and click OK
   - Your sequence is automatically saved

### What Gets Recorded

Each recorded action includes:
- **Position**: Exact X and Y coordinates on screen
- **Timing**: Delay since the previous action
- **Button**: Mouse button to click (left, right, or middle)
- **Type**: Action type (click or move)

### Tips for Effective Recording

- **Plan Your Sequence**: Think through the steps before recording
- **Use Consistent Timing**: Try to maintain similar delays between actions
- **Test Positions**: Move to each position and verify it's correct before recording
- **Name Descriptively**: Use clear names like "Mining Route" or "Quest Clicks"
- **Record Shortcuts**: Keep sequences short and focused on specific tasks

---

## Sequence Playback

Once recorded, sequences can be played back with human-like mouse movement and timing.

### Playing a Sequence

1. Click the "LOAD SEQUENCES" button to refresh the list
2. Find your sequence in the list (shows name and action count)
3. Click the "PLAY" button next to the sequence
4. Watch as the Auto Clicker:
   - Moves the mouse smoothly to each position
   - Performs clicks at the recorded locations
   - Maintains the recorded timing between actions

### Managing Sequences

- **View Details**: Each sequence shows its name and number of actions
- **Delete Sequences**: Click "DELETE" to remove unwanted sequences
- **Reload List**: Click "LOAD SEQUENCES" to update the list after changes

### Sequence Files

Sequences are saved to:
- **Windows**: `%APPDATA%/auto-clicker/sequences.json`
- **macOS**: `~/Library/Application Support/auto-clicker/sequences.json`
- **Linux**: `~/.config/auto-clicker/sequences.json`

You can manually edit, backup, or share these files.

---

## Smooth Mouse Movement

All mouse movements during sequence playback use advanced algorithms to simulate human-like behavior, making automation less detectable.

### Features

1. **Variable Speed**
   - Random speed variation (30-100% of base speed)
   - Faster for long distances, slower for precision
   - Natural acceleration and deceleration

2. **Movement Curves**
   - Ease-in-out curves for natural motion
   - Not perfectly straight lines
   - Adaptive step count based on distance

3. **Micro-Movements**
   - Small random deviations (±1-2 pixels)
   - Occasional larger twitches (30% chance)
   - Simulates hand tremor and imprecision

4. **Variable Timing**
   - Randomized delay between movement steps
   - Changes speed mid-movement
   - More realistic than constant-speed movement

### How It Works

The smooth movement algorithm:
1. Calculates distance to target
2. Determines optimal number of steps (10-50)
3. Applies ease-in-out curve to create natural acceleration
4. Adds random micro-movements at each step
5. Occasionally includes small "twitches"
6. Uses variable timing between steps
7. Ensures final position is exact

This creates movement that closely resembles actual human mouse control, including:
- Natural imperfections
- Speed variations
- Smooth curves instead of straight lines
- Realistic timing

---

## Color Recognition

The Auto Clicker includes color detection capabilities for conditional automation.

### Use Cases

- **Health Bar Monitoring**: Detect when health drops below threshold
- **Notification Detection**: Recognize popup colors
- **Status Indicators**: Check for specific UI states
- **Resource Tracking**: Monitor inventory changes
- **Combat States**: Detect enemy/ally indicators

### Color Detection Features

1. **Screen Region Capture**
   - Capture specific screen areas
   - Define custom regions (x, y, width, height)
   - Fast pixel-level access

2. **Color Matching**
   - RGB color specification
   - Tolerance levels for inexact matches
   - Returns first matching pixel position
   - Useful for trigger conditions

3. **Pixel-Perfect Detection**
   - Exact color values
   - Tolerance-based matching
   - Position reporting

### Technical Details

The color recognition system:
- Uses native screen capture APIs
- Processes pixels in RGBA format
- Searches from top-left to bottom-right
- Returns on first match (fast)
- Configurable color tolerance

### Example Use Case

```
Scenario: Stop clicking when health is low
1. Define region: health bar area (x: 100, y: 50, width: 200, height: 20)
2. Specify color: red health warning (r: 255, g: 0, b: 0)
3. Set tolerance: 20 (allows for slight variations)
4. Check periodically during automation
5. Stop if red color detected
```

**Note**: Direct API usage requires code integration. This is an advanced feature for developers extending the Auto Clicker.

---

## Best Practices

### Recording Best Practices

1. **Clear Your Screen**: Close unnecessary windows before recording
2. **Consistent Resolution**: Record at the same screen resolution you'll use for playback
3. **Test Before Saving**: Verify positions are correct
4. **Use Descriptive Names**: Make sequences easy to identify later
5. **Keep It Simple**: Break complex workflows into multiple sequences
6. **Account for Timing**: Include appropriate delays between actions

### Playback Best Practices

1. **Same Environment**: Play sequences in the same application/window they were recorded
2. **Check Resolution**: Ensure screen resolution matches recording
3. **Window Position**: Keep target windows in the same position
4. **Monitor First Run**: Watch the first playback to verify accuracy
5. **Test in Safe Area**: Try sequences in non-critical scenarios first
6. **Have Emergency Stop**: Keep hand near ESC key for quick stops

### Security and Safety

1. **No Sensitive Actions**: Don't record sequences with passwords or sensitive data
2. **Review Before Sharing**: Check sequences for personal information
3. **Test Thoroughly**: Always verify sequences work as expected
4. **Use Responsibly**: Respect game ToS and automation policies
5. **Backup Sequences**: Keep copies of important sequences

### Performance Tips

1. **Shorter Sequences**: Faster loading and playback
2. **Reasonable Delays**: Don't make delays too short (minimum 50-100ms)
3. **Close Background Apps**: Free up system resources during playback
4. **Monitor CPU Usage**: Complex sequences may increase CPU load
5. **Update Regularly**: Keep Auto Clicker updated for performance improvements

---

## Troubleshooting

### Recording Issues

**Problem**: Hotkey not recording positions
- **Solution**: Make sure recording is active (STOP button enabled)
- **Solution**: Try pressing Ctrl+Shift+R (or Cmd+Shift+R) more deliberately
- **Solution**: Check console for error messages

**Problem**: Can't save sequence
- **Solution**: Verify you have write permissions to the config directory
- **Solution**: Check disk space
- **Solution**: Try a different sequence name (avoid special characters)

**Problem**: Sequence appears empty
- **Solution**: Make sure you pressed the recording hotkey at each position
- **Solution**: Check console logs for confirmation messages
- **Solution**: Try recording again with visible feedback

### Playback Issues

**Problem**: Mouse goes to wrong positions
- **Solution**: Ensure screen resolution matches recording
- **Solution**: Keep target window in same position
- **Solution**: Check for multi-monitor setup changes
- **Solution**: Re-record sequence if screen layout changed

**Problem**: Clicks happen too fast/slow
- **Solution**: Delays are based on recording timing
- **Solution**: Re-record with desired timing
- **Solution**: Add consistent pauses when recording

**Problem**: Sequence stops unexpectedly
- **Solution**: Check for error messages in console
- **Solution**: Verify target application is still active
- **Solution**: Ensure screen hasn't locked or dimmed
- **Solution**: Try running with elevated permissions

### Movement Issues

**Problem**: Mouse movement is jerky
- **Solution**: Close resource-intensive applications
- **Solution**: Check CPU usage
- **Solution**: Update graphics drivers
- **Solution**: Try restarting Auto Clicker

**Problem**: Movement is too slow
- **Solution**: This is by design for human-like behavior
- **Solution**: Speed varies randomly for realism
- **Solution**: Movement speed adapts to distance

### File and Storage Issues

**Problem**: Can't find sequences file
- **Solution**: Check application data directory for your OS
- **Solution**: Search for "sequences.json" in your system
- **Solution**: File is created after first save

**Problem**: Lost sequences after reinstall
- **Solution**: Backup sequences.json before reinstalling
- **Solution**: Check if file exists in config directory
- **Solution**: Sequences are not deleted on uninstall

**Problem**: Can't load sequences
- **Solution**: Click "LOAD SEQUENCES" button to refresh
- **Solution**: Check sequences.json file is valid JSON
- **Solution**: Verify file permissions
- **Solution**: Try deleting and recreating a test sequence

---

## Advanced Usage

### API Integration

The Auto Clicker exposes several APIs for advanced users:

- `smoothMoveMouse(x, y)`: Move mouse with human-like motion
- `captureRegion(region)`: Capture screen region
- `findColor(region, color)`: Search for color in region
- `findImage(region, templatePath)`: Find image template (basic)

These APIs are accessible through the Electron IPC interface and can be used to build custom automation scripts.

### Custom Sequences

Advanced users can manually create or edit `sequences.json`:

```json
{
  "name": "Custom Sequence",
  "actions": [
    {
      "type": "click",
      "x": 100,
      "y": 200,
      "button": "left",
      "timestamp": 1234567890,
      "delay": 1000
    }
  ],
  "created": 1234567890
}
```

### Extension Points

The codebase is designed for extensibility:
- Add new action types in `RecordedAction` interface
- Implement custom movement algorithms
- Extend color/image recognition with libraries like OpenCV
- Create plugins for game-specific automation

---

## Support and Community

For questions, issues, or feature requests:
- Check the [main README](../README.md) for general usage
- Review the [ROADMAP](../ROADMAP.md) for planned features
- See the [Gaming Guide](./GAMING_GUIDE.md) for game-specific tips
- Open an issue on GitHub for bugs or feature requests

---

*Last Updated: 2025-12-06*
*Version: 0.0.2*
