const BASE_URL = "http://127.0.0.1:5000";

export const uploadFiles = async (inspectionFile, thermalFile) => {
  const formData = new FormData();
  formData.append("inspection", inspectionFile);
  formData.append("thermal", thermalFile);

  const res = await fetch(`${BASE_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Upload failed");
  }

  return res.json();
};

export const generateDDR = async (inspection_path, thermal_path) => {
  const res = await fetch(`${BASE_URL}/generate-ddr`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inspection_path, thermal_path }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "DDR generation failed");
  }

  return res.json();
};