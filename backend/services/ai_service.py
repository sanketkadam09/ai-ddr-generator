from google import genai
from config import Config

# Initialize client
client = genai.Client(api_key=Config.GEMINI_API_KEY)


SYSTEM_PROMPT = """
You are a professional civil engineering diagnostic expert.

RULES:
- Do NOT hallucinate
- Use ONLY provided data
- If missing → "Not Available"
- If conflict → clearly mention it
"""


def generate_ddr(inspection_text, thermal_text, image_paths):

    prompt = f"""
Inspection Report:
{inspection_text}

Thermal Report:
{thermal_text}

Images:
{image_paths}

Generate a Detailed Diagnostic Report with:

1. Property Issue Summary
2. Area-wise Observations
3. Probable Root Cause
4. Severity Assessment (Low/Medium/High with reason)
5. Recommended Actions
6. Additional Notes
7. Missing or Unclear Information
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=SYSTEM_PROMPT + "\n\n" + prompt
    )

    return response.text