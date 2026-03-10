import urllib.request
import urllib.parse
import urllib.error
import zipfile
import os
import argparse

def download_and_extract(url, extract_to):
    print(f"Downloading from {url}...")
    zip_path = "temp_assets.zip"

    # URL encode path segment to handle spaces like in "Isometric - Dark Ruins.zip"
    parsed_url = urllib.parse.urlparse(url)
    encoded_path = urllib.parse.quote(parsed_url.path)
    encoded_url = urllib.parse.urlunparse((parsed_url.scheme, parsed_url.netloc, encoded_path, parsed_url.params, parsed_url.query, parsed_url.fragment))

    try:
        req = urllib.request.Request(
            encoded_url,
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
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", help="URL of the zip file to download")
    parser.add_argument("--out", help="Directory to extract to")
    args = parser.parse_args()

    if args.url and args.out:
        download_and_extract(args.url, args.out)
    else:
        # fallback
        url = "https://opengameart.org/sites/default/files/isometric.zip"
        extract_dir = "assets/sprites/raw/iso_starter"
        download_and_extract(url, extract_dir)
