# Application Icons

Place application icons in this directory for building distributable packages.

## Required Files

- `icon.ico` - Windows icon (256x256 or higher)
- `icon.icns` - macOS icon (1024x1024 recommended)
- `icon.png` - Linux icon (512x512 recommended)

## Icon Design Guidelines

The icon should represent an auto-clicker or mouse automation tool. Consider using:

- A mouse cursor symbol
- A click/pointer icon
- An automation/refresh symbol
- Colors that stand out (blue, purple, green)

## Generating Icons

You can use online tools or command-line utilities to convert a single PNG to multiple formats:

### Using ImageMagick (for PNG to ICO):

```bash
convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

### Using png2icns (for PNG to ICNS on macOS):

```bash
png2icns icon.icns icon.png
```

### Online Tools:

- https://convertio.co/png-ico/
- https://cloudconvert.com/png-to-icns
- https://iconverticons.com/online/

## Note

If icon files are not present, Electron will use default icons for the application.

## Adding Icons to the Build

Once you have created the icon files, update `package.json` to reference them:

```json
"win": {
  "target": ["nsis"],
  "icon": "assets/icon.ico"
},
"mac": {
  "target": ["dmg"],
  "icon": "assets/icon.icns",
  "category": "public.app-category.utilities"
},
"linux": {
  "target": ["AppImage", "deb"],
  "icon": "assets/icon.png",
  "category": "Utility"
}
```
