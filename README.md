📄 DDR Generator – AI Applied Engineering System
 Project Overview

DDR Generator is an AI-powered system that converts raw civil inspection and thermal reports into a structured, client-ready Detailed Diagnostic Report (DDR).
It uses Flask backend + Gemini AI + React frontend to process documents and generate engineering insights.

Key Features
Upload Inspection & Thermal PDF reports
Extract text and images automatically
AI-powered analysis using Gemini API
Generates structured DDR report
Handles missing/conflicting data
Stores generated reports in database

<img width="1149" height="909" alt="Screenshot 2026-05-06 094113" src="https://github.com/user-attachments/assets/39d74189-9d20-4e6f-adbf-57626a497ea0" />


System Architecture


Frontend (React)
      ↓
Flask Backend API
      ↓
PDF Processing (Text + Images)
      ↓
Gemini AI Model
      ↓
Structured DDR Output
      ↓
Database Storage


Tech Stack
Frontend:
React.js
JavaScript
Fetch API
Backend:
Flask
Flask-CORS
SQLAlchemy
Python
AI:
Google Gemini API
Document Processing:
PDF text extraction
Image extraction from PDFs

Workflow
User uploads inspection + thermal PDF
Backend saves files
Extracts:
Text
Images
Sends data to Gemini AI
AI generates structured DDR report
Response sent to frontend
Displayed in UI
AI Prompt Design

<img width="1267" height="893" alt="Screenshot 2026-05-06 093913" src="https://github.com/user-attachments/assets/f8f0f15e-49cb-4e7c-9b36-1cdfccc2c230" />


The system ensures:

No hallucination
Uses only given data
Handles missing information
Produces structured engineering report

Output Format (DDR)
Property Issue Summary
Area-wise Observations
Probable Root Cause
Severity Assessment
Recommended Actions
Additional Notes
Missing Information


Future Improvements
OCR for scanned PDFs
Advanced image classification
Real-time report editing
Deployment on cloud (AWS / Render)

How to Run
Backend:
cd backend
python app.py


cd frontend
npm install
npm run dev

