# PixLens

## Run

This is a CLI tool that takes 4 parameters:
- `root`: Base directory to inspect images
- `destination`: Destination directory where files will be moved.
- `model`: Ollama model used to query images.
- `query`: User query describing what we want to extract from the provided files.

When parameters are not provided, the tool will prompt the user for them.

Example:

```bash
./pixlens --root ./assets
./pixlens --root ./assets --destination ./sorted-assets
./pixlens --root ./assets --destination ./sorted-assets --model llama3.1
./pixlens --root ./assets --destination ./sorted-assets --query "Extract the text from the images"
```

## Development

To run the project in development mode, use:

```bash
bun install
bun src/index.ts
```
