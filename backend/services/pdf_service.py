import fitz  # PyMuPDF
import os

IMAGE_DIR = "extracted_images"


# -------------------------
# Extract TEXT from PDF
# -------------------------
def extract_text(pdf_path):
    doc = fitz.open(pdf_path)
    text = ""

    for page in doc:
        text += page.get_text()

    return text.strip()


# -------------------------
# Extract IMAGES from PDF
# -------------------------
def extract_images(pdf_path, prefix="img"):
    doc = fitz.open(pdf_path)

    os.makedirs(IMAGE_DIR, exist_ok=True)

    image_paths = []
    img_count = 0

    for page_index in range(len(doc)):
        page = doc[page_index]
        images = page.get_images(full=True)

        for img in images:
            xref = img[0]
            base_image = doc.extract_image(xref)

            image_bytes = base_image["image"]
            img_ext = base_image["ext"]

            img_name = f"{prefix}_page{page_index+1}_{img_count}.{img_ext}"
            img_path = os.path.join(IMAGE_DIR, img_name)

            with open(img_path, "wb") as f:
                f.write(image_bytes)

            image_paths.append(img_path)
            img_count += 1

    return image_paths