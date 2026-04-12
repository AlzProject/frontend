# Test Images Directory

This folder contains images used by the cognitive assessment tests.

## Structure

```
public/tests/
├── ACE-III/
│   └── Images/
│       ├── spoon.jpg
│       ├── pencil.png
│       ├── infinity.jpg
│       ├── dotCounting/
│       │   ├── d1.png
│       │   ├── d2.png
│       │   ├── d3.png
│       │   └── d4.png
│       └── fragmentedLetters/
│           ├── fragA.png
│           ├── fragK.png
│           └── fragM.png
├── MoCA/
│   └── Images/
│       ├── camel.jpg
│       ├── lion.jpg
│       └── rhinoceros.jpg
├── MMSE/
│   └── Images/ (if any)
├── CDR/
│   └── Images/ (if any)
└── ImageDescription/
    └── Images/ (if any)
```

## Usage

Images are referenced in test data.json files using relative paths:

```json
{
  "config": {
    "imageFiles": ["spoon.jpg"],
    "referenceImageFile": "infinity.jpg"
  }
}
```

The TestRunner component loads them from `/tests/{testName}/Images/{filename}`.

## Setup

Images are copied from `src/tests/{testName}/Images/` to `public/tests/{testName}/Images/` so they can be served as static assets by Vite.

To sync images after adding new ones:

```bash
# For a specific test
cp -r src/tests/ACE-III/Images public/tests/ACE-III/

# For all tests
for test in MMSE MoCA CDR ACE-III ImageDescription; do
  if [ -d "src/tests/$test/Images" ]; then
    mkdir -p "public/tests/$test"
    cp -r "src/tests/$test/Images" "public/tests/$test/"
  fi
done
```

## Why public/ instead of src/?

Vite serves files from the `public/` directory as static assets at the root URL. Files in `src/` require import statements, which doesn't work for dynamic image paths loaded from JSON.

## Image Formats Supported

- `.jpg` / `.jpeg`
- `.png`
- `.webp`
- `.svg`
- `.gif`

All modern image formats are supported by the browser.
