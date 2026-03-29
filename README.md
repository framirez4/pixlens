# PixLens

## Run

This is a CLI tool that takes 3 parameters:
- `root`: Base directory to inspect images
- `destination`: Destination directory where files will be moved.
- `yes`: Skips user prompts and runs the tasks

Example:

```bash
./pixlens --root ./assets
./pixlens --root ./assets --destination ./sorted-assets --yes
```

## Development

To run the project in development mode, use:

```bash
bun install
bun src/index.ts --root ./assets
```
