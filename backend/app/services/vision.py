"""
Vision service for project image analysis.

Analyzes uploaded project photos and LiDAR scans to extract
information useful for estimate generation.
"""

import base64
import httpx
from typing import Optional, Dict

from app.config import get_settings


class VisionService:
    """Service for analyzing project images using vision-capable LLMs."""

    BASE_URL = "https://openrouter.ai/api/v1"

    # Vision-capable model (Claude 3.5 Sonnet is good for this)
    VISION_MODEL = "anthropic/claude-3.5-sonnet"

    ANALYSIS_PROMPT = """Analyze this project image for a renovation estimate. Extract the following information:

1. **Room/Area Type**: What type of room or area is shown (bathroom, kitchen, living room, exterior, etc.)

2. **Approximate Dimensions**: If visible or estimable, provide rough dimensions or area

3. **Existing Conditions**:
   - Current flooring type and condition
   - Wall finish and condition
   - Ceiling type and condition
   - Any visible damage or wear

4. **Visible Materials & Finishes**:
   - Flooring material
   - Wall materials/finishes
   - Cabinet/fixture materials
   - Hardware and fixtures

5. **Fixtures & Appliances**: List any visible fixtures or appliances

6. **Problem Areas**: Note any visible damage, wear, code issues, or areas needing attention

7. **Measurements**: Extract any visible measurements, dimensions, or annotations

8. **Renovation Considerations**: Note any special considerations for renovation work

Provide your analysis in a structured format that can be used for estimate generation.
If something is not visible or cannot be determined, say so rather than guessing."""

    def __init__(self):
        settings = get_settings()
        self.api_key = settings.openrouter_api_key

    async def analyze_image(
        self,
        image_data: bytes,
        mime_type: str = "image/jpeg",
        additional_context: str = ""
    ) -> Dict:
        """
        Analyze a project image using vision model.

        Args:
            image_data: Raw image bytes
            mime_type: Image MIME type (image/jpeg, image/png, etc.)
            additional_context: Optional context about the project

        Returns:
            Analysis results with extracted information
        """
        # Encode image to base64
        base64_image = base64.b64encode(image_data).decode("utf-8")

        # Build the prompt
        prompt = self.ANALYSIS_PROMPT
        if additional_context:
            prompt += f"\n\nAdditional context: {additional_context}"

        # Build message with image
        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type};base64,{base64_image}"
                        }
                    },
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            }
        ]

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.BASE_URL}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "HTTP-Referer": "https://remodly.com",
                        "X-Title": "REMODLY AI Estimator",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.VISION_MODEL,
                        "messages": messages,
                        "max_tokens": 2000,
                        "temperature": 0.3,
                    },
                    timeout=60.0,
                )

                if response.status_code != 200:
                    return {
                        "success": False,
                        "error": f"Vision API error: {response.status_code}",
                    }

                result = response.json()
                analysis_text = result["choices"][0]["message"]["content"]

                return {
                    "success": True,
                    "analysis": analysis_text,
                    "model": self.VISION_MODEL,
                }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
            }

    async def analyze_image_url(
        self,
        image_url: str,
        additional_context: str = ""
    ) -> Dict:
        """
        Analyze a project image from URL using vision model.

        Args:
            image_url: URL to the image
            additional_context: Optional context about the project

        Returns:
            Analysis results with extracted information
        """
        prompt = self.ANALYSIS_PROMPT
        if additional_context:
            prompt += f"\n\nAdditional context: {additional_context}"

        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": image_url}
                    },
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            }
        ]

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.BASE_URL}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "HTTP-Referer": "https://remodly.com",
                        "X-Title": "REMODLY AI Estimator",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.VISION_MODEL,
                        "messages": messages,
                        "max_tokens": 2000,
                        "temperature": 0.3,
                    },
                    timeout=60.0,
                )

                if response.status_code != 200:
                    return {
                        "success": False,
                        "error": f"Vision API error: {response.status_code}",
                    }

                result = response.json()
                analysis_text = result["choices"][0]["message"]["content"]

                return {
                    "success": True,
                    "analysis": analysis_text,
                    "model": self.VISION_MODEL,
                }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
            }

    async def extract_measurements(
        self,
        image_data: bytes,
        mime_type: str = "image/jpeg"
    ) -> Dict:
        """
        Extract measurements and dimensions from an image (e.g., LiDAR scan).

        Args:
            image_data: Raw image bytes
            mime_type: Image MIME type

        Returns:
            Extracted measurements
        """
        base64_image = base64.b64encode(image_data).decode("utf-8")

        prompt = """Analyze this image and extract any visible measurements, dimensions, or annotations.

Look for:
1. Room dimensions (length, width, height)
2. Wall measurements
3. Window and door sizes
4. Any labeled measurements
5. Scale indicators

Return measurements in a structured format:
- measurement_type: (e.g., "room_length", "window_width")
- value: (numeric value)
- unit: (ft, in, m, cm)
- location: (where in the image/room)
- confidence: (high, medium, low)

If no measurements are visible, indicate that clearly."""

        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type};base64,{base64_image}"
                        }
                    },
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            }
        ]

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.BASE_URL}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "HTTP-Referer": "https://remodly.com",
                        "X-Title": "REMODLY AI Estimator",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.VISION_MODEL,
                        "messages": messages,
                        "max_tokens": 1500,
                        "temperature": 0.2,
                    },
                    timeout=60.0,
                )

                if response.status_code != 200:
                    return {
                        "success": False,
                        "error": f"Vision API error: {response.status_code}",
                    }

                result = response.json()
                measurements_text = result["choices"][0]["message"]["content"]

                return {
                    "success": True,
                    "measurements": measurements_text,
                    "model": self.VISION_MODEL,
                }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
            }
