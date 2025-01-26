import google.generativeai as genai
from typing import Dict
import os
from dotenv import load_dotenv
import json
import re
import logging

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        # Load environment variables
        load_dotenv()
        self.api_key = os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is not set")
        
        # Configure Gemini
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')

    async def analyze_fraud(self, text: str) -> Dict:
        """
        Analyzes text for potential fraud using Gemini AI.
        
        Args:
            text (str): The text to analyze
            
        Returns:
            Dict: Contains 'classification' (FRAUD/LEGITIMATE) and 'confidence' (float 0-1)
            
        Raises:
            Exception: If analysis fails
        """
        try:
            prompt = f"""Analyze the following text for potential fraud. Return only a JSON object with two fields:
            - "classification": either "FRAUD" or "LEGITIMATE"
            - "confidence": a float between 0 and 1 indicating confidence level
            
            Text to analyze: {text}
            
            Respond only with valid JSON."""

            response = self.model.generate_content(prompt)
            
            # Clean and parse the response
            response_text = response.text
            # Remove markdown code blocks if present
            response_text = re.sub(r'```json\s*|\s*```', '', response_text)
            # Parse the cleaned JSON string
            return json.loads(response_text)
            
        except Exception as e:
            logger.error(f"Gemini analysis failed: {str(e)}")
            raise Exception(f"Failed to analyze text: {str(e)}")

# Create a singleton instance
gemini_service = GeminiService()