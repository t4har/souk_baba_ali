import json
import shutil
from pathlib import Path
from datetime import datetime

# ============================================================
# CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

PRODUCTS_FILE = BASE_DIR / "data" / "products.json"
IMAGES_DIR = BASE_DIR / "images" / "products"

# ============================================================
# CHECK FILES
# ============================================================

if not PRODUCTS_FILE.exists():
    print(f"ERROR: products.json not found:")
    print(PRODUCTS_FILE)
    raise SystemExit(1)

if not IMAGES_DIR.exists():
    print(f"ERROR: images/products folder not found:")
    print(IMAGES_DIR)
    raise SystemExit(1)

# ============================================================
# LOAD PRODUCTS
# ============================================================

with open(PRODUCTS_FILE, "r", encoding="utf-8") as f:
    products = json.load(f)

if not isinstance(products, list):
    print("ERROR: products.json does not contain a JSON array.")
    raise SystemExit(1)

# ============================================================
# BACKUP
# ============================================================

timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

backup_file = PRODUCTS_FILE.with_name(
    f"products_backup_{timestamp}.json"
)

shutil.copy2(PRODUCTS_FILE, backup_file)

print("========================================")
print(" SOUK BABA ALI — PRODUCT IMAGE CHECK")
print("========================================")
print()
print(f"Products file : {PRODUCTS_FILE}")
print(f"Images folder : {IMAGES_DIR}")
print(f"Backup        : {backup_file}")
print()

# ============================================================
# SCAN PRODUCTS
# ============================================================

with_image = []
without_image = []
missing_image_files = []

for product in products:

    product_id = str(product.get("id", "")).strip()

    if not product_id:
        print("WARNING: Product without ID found.")
        continue

    expected_image = IMAGES_DIR / f"{product_id}.webp"

    if expected_image.exists():
        # Image exists — keep the existing image assignment.
        with_image.append(product_id)

    else:
        # No image — hide image assignment.
        product["image"] = None

        without_image.append(product_id)
        missing_image_files.append(product_id)

# ============================================================
# SAVE
# ============================================================

with open(PRODUCTS_FILE, "w", encoding="utf-8") as f:
    json.dump(
        products,
        f,
        ensure_ascii=False,
        indent=2
    )

    f.write("\n")

# ============================================================
# REPORT
# ============================================================

print("RESULT")
print("----------------------------------------")
print(f"Total products       : {len(products)}")
print(f"Products with image  : {len(with_image)}")
print(f"Products without img : {len(without_image)}")
print("----------------------------------------")
print()

if without_image:
    print("Products WITHOUT images:")
    print()

    for product_id in without_image:
        print(f"  - {product_id}")

    print()

print("Done.")
print()
print(f"Backup created at:")
print(backup_file)
