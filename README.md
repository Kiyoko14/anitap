# anitap

A minimal Python starter project.

## Requirements

- Python 3.9 or newer
- pip

## Setup

```bash
# 1. Clone the repository
git clone https://github.com/Kiyoko14/anitap.git
cd anitap

# 2. (Optional) Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt
```

## Run

```bash
python main.py
```

Expected output:

```
Hello, World!
```

## Test

```bash
python -m pytest tests/ -v
```

## Project structure

```
anitap/
├── main.py            # Application entry point
├── requirements.txt   # Python dependencies
├── tests/
│   └── test_main.py   # Unit tests
└── .github/
    └── workflows/
        └── ci.yml     # Continuous integration workflow
```
