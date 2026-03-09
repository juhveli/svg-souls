import urllib.request
import urllib.error
import zipfile
import os

def download_and_extract(url, extract_to):
    print(f"Downloading from {url}...")
    zip_path = "temp_assets.zip"
    try:
        req = urllib.request.Request(
            url,
            data=None,
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        with urllib.request.urlopen(req) as response, open(zip_path, 'wb') as out_file:
            data = response.read()
            out_file.write(data)

        print("Download complete. Extracting...")
        if not os.path.exists(extract_to):
            os.makedirs(extract_to)

        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_to)
            print(f"Extracted to {extract_to}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        if os.path.exists(zip_path):
            os.remove(zip_path)

if __name__ == "__main__":
    # Let's try downloading from opengameart again with a known good file for Isometric.
    # The "Isometric Tile Starter Pack" by GameDeveloperStudio is a great one (CC0)
    # File is isometric.zip
    url = "https://opengameart.org/sites/default/files/isometric.zip"
    extract_dir = "assets/sprites/raw/iso_starter"
    download_and_extract(url, extract_dir)
