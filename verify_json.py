import json

def verify_json(filepath):
    try:
        with open(filepath, 'r') as f:
            json.load(f)
        print(f"SUCCESS: {filepath} is valid JSON.")
    except json.JSONDecodeError as e:
        print(f"FAILURE: {filepath} is invalid JSON. Error: {e}")

if __name__ == "__main__":
    verify_json('assets/data/items.json')
    verify_json('assets/data/npcs.json')
