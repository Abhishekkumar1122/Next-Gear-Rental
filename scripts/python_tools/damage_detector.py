import os
import cv2  # type: ignore
import numpy as np  # type: ignore

def detect_vehicle_damages(before_img_path, after_img_path, output_diff_path="public/uploads/damage_report.jpg"):
    """
    Compares vehicle check-in (before) and check-out (after) photos using OpenCV.
    Highlights new scratches, dents, and surface damages with red bounding boxes.
    """
    if not os.path.exists(before_img_path) or not os.path.exists(after_img_path):
        return {"success": False, "error": "One or both inspection images do not exist."}

    # Load images
    before = cv2.imread(before_img_path)
    after = cv2.imread(after_img_path)

    # Resize after to match before dimensions
    h, w, _ = before.shape
    after_resized = cv2.resize(after, (w, h))

    # Convert to grayscale
    gray_before = cv2.cvtColor(before, cv2.COLOR_BGR2GRAY)
    gray_after = cv2.cvtColor(after_resized, cv2.COLOR_BGR2GRAY)

    # Apply Gaussian Blur to reduce noise
    blur_before = cv2.GaussianBlur(gray_before, (21, 21), 0)
    blur_after = cv2.GaussianBlur(gray_after, (21, 21), 0)

    # Compute absolute difference
    diff = cv2.absdiff(blur_before, blur_after)

    # Apply thresholding to isolate significant changes
    _, thresh = cv2.threshold(diff, 35, 255, cv2.THRESH_BINARY)
    thresh = cv2.dilate(thresh, None, iterations=2)

    # Find contours (potential damage regions)
    contours, _ = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    annotated = after_resized.copy()
    damage_regions = []

    for c in contours:
        area = cv2.contourArea(c)
        if area > 450: # Filter out camera noise
            (x, y, cw, ch) = cv2.boundingRect(c)
            cv2.rectangle(annotated, (x, y), (x + cw, y + ch), (0, 0, 255), 3)
            cv2.putText(annotated, "DAMAGE ALERT", (x, max(20, y - 8)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
            damage_regions.append({"x": int(x), "y": int(y), "w": int(cw), "h": int(ch), "severity": "HIGH" if area > 2000 else "MEDIUM"})

    os.makedirs(os.path.dirname(output_diff_path), exist_ok=True)
    cv2.imwrite(output_diff_path, annotated)

    return {
        "success": True,
        "damage_detected": len(damage_regions) > 0,
        "count": len(damage_regions),
        "damage_regions": damage_regions,
        "annotated_image": output_diff_path
    }

if __name__ == "__main__":
    print("[AI DAMAGE DETECTOR] OpenCV Vehicle Inspection Scan engine ready.")
