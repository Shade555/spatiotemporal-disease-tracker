# Spatiotemporal Disease Tracker: Project Overview

This document provides a comprehensive, easy-to-understand breakdown of the **Spatiotemporal Disease Tracker** project. It explains what the project does, how it works behind the scenes, where each feature is located in the codebase, and how it aligns perfectly with your Data Science for Healthcare syllabus.

---

## 🌟 What is this project?
The Spatiotemporal Disease Tracker is a **public health surveillance system**. Instead of waiting for official hospital records (which can take weeks to compile), this system actively monitors global news and media in real-time to detect disease outbreaks (like Dengue, Malaria, or entirely new viruses) in specific locations (like Maharashtra, India). 

It automatically reads thousands of news articles, extracts the diseases being talked about, calculates statistics to detect abnormal spikes (anomalies), and plots this data on a visual dashboard and geographical map.

---

## ⚙️ How it works behind the scenes (The Flow)

1. **The Cron Job (The Trigger):** Every day at 8:00 AM and 9:00 AM, Vercel automatically wakes up the application.
2. **Data Ingestion (The Fetch):** The system connects to massive global databases (GDELT Cloud API and NewsAPI) and says: *"Give me all the news from the last 30-100 days in Maharashtra related to health, diseases, and outbreaks."*
3. **Information Extraction (The Brain):** The system reads the titles and snippets of these articles. Using NLP (Natural Language Processing) pattern matching, it searches for specific disease names (Dengue, Malaria) and dynamically discovers new ones (e.g., "unknown fever", "Zika virus").
4. **Metrics & Anomaly Detection (The Math):** The system counts how many articles mention a disease on a given day. It compares today's count to the rolling average of the past 7 days. If today's count is significantly higher than normal (a high Z-score), it flags that day as an **Anomaly** (an outbreak).
5. **Database (The Storage):** All extracted articles and calculated metrics are saved into a Supabase PostgreSQL database.
6. **Visual Analytics (The Dashboard):** When a user opens the website, the React frontend fetches this data and draws interactive line charts, metric cards, and a map showing exactly where the outbreaks are happening and how severe they are.

---

## 🛠️ Features and Code Locations

Here is exactly where every feature lives in the codebase:

### 1. Data Sources & Ingestion
* **What it does:** Reaches out to external APIs to fetch raw unstructured news data.
* **Where it is:**
  * `lib/gdelt.ts`: Contains `fetchGdeltArticles()` which connects to the GDELT Cloud API, fetching clustered global events and extracting all articles from those clusters.
  * `app/api/ingest/route.ts`: The main API endpoint (`POST /api/ingest`) that coordinates the fetching and saving of data.
  * `app/api/trigger-ingest/route.ts`: A public wrapper that allows the dashboard buttons to trigger the ingestion manually without needing secret passwords.

### 2. Information Extraction (NLP)
* **What it does:** Scans the raw text of articles to find mentions of diseases and symptoms.
* **Where it is:**
  * `lib/validation.ts`: Contains the `extractEntities(text)` function. This uses regex (Pattern-based algorithms) to search for known diseases and dynamically catch unknown ones (e.g., matching any word followed by "virus", "syndrome", or "outbreak").

### 3. Temporal Data Mining & Anomaly Detection
* **What it does:** Calculates daily statistics and detects outbreaks.
* **Where it is:**
  * `lib/metrics.ts`: Contains `calculateDailyMetrics()` and `applyRollingAnomalies()`. It computes a 7-day rolling mean, standard deviation, and Z-score. If the Z-score > 2 (meaning the article count is 2 standard deviations above normal), `isAnomaly` is set to `true`.

### 4. Visual Analytics (Frontend Dashboard)
* **What it does:** Displays the data beautifully to the user.
* **Where it is:**
  * `components/dashboard/DashboardClient.tsx`: The main page layout that holds all the charts, the map, and the "Refresh" buttons.
  * `components/dashboard/MetricsChart.tsx`: Uses the `recharts` library to draw the line graphs showing disease mentions over time.
  * `components/dashboard/DiseaseMap.tsx`: Uses `react-leaflet` to render an interactive geographical map, placing markers on outbreak locations like Mumbai.

### 5. Automated Scheduling
* **What it does:** Ensures the system runs automatically every day.
* **Where it is:**
  * `vercel.json`: Defines the `"crons"` array, telling Vercel to hit the ingestion endpoints daily at specific UTC times.

---

## 🎓 Connection to the Syllabus

This project is a perfect practical implementation of several core concepts from your **Data Science for Healthcare** syllabus:

### Module 4.0: Social Media Analytics for Healthcare
* **Syllabus Topic:** *4.1 Social Media analysis for detection and tracking of Infectious Disease outbreaks. 4.2 Outbreak detection, Public Health Research.*
* **How it's included:** While we use Global News (GDELT/NewsAPI) instead of Twitter/X, the underlying data science concept is identical: **Syndromic Surveillance**. We are mining unstructured web text to detect and track infectious disease outbreaks (Dengue/Malaria) in real-time for public health monitoring.

### Module 3.0: Data Science and NLP for Clinical Text
* **Syllabus Topic:** *3.1 NLP, Mining information from Clinical Text, Information Extraction, Rule Based Approaches, Pattern based algorithms.*
* **How it's included:** In `lib/validation.ts`, the system performs **Information Extraction** using **Pattern-based algorithms (Regex)** to mine unstructured text and identify specific disease entities and health terminology.

### Module 5.0: Advanced Data Analytics for Healthcare
* **Syllabus Topic:** *5.1 Temporal Data Mining for Healthcare Data. 5.2 Visual Analytics for Healthcare Data.*
* **How it's included:** 
  * **Temporal Data Mining:** Implemented in `lib/metrics.ts`. We treat disease mentions as a time-series dataset. We apply temporal windowing (7-day rolling averages) and Z-score anomaly detection to find temporal spikes (outbreaks).
  * **Visual Analytics:** Implemented via the interactive Recharts line graphs (`MetricsChart.tsx`) and the spatial Leaflet map (`DiseaseMap.tsx`), allowing users to visually analyze health data trends over time and space.

### Module 1.0: Data Science for Healthcare
* **Syllabus Topic:** *1.1 Healthcare Data Sources and Data Analytics, Applications and Practical Systems for Healthcare.*
* **How it's included:** This entire codebase is a **Practical System for Healthcare**. It bypasses traditional, slow EHR (Electronic Health Record) systems by tapping into alternative healthcare data sources (global news intelligence) to provide early warning systems for epidemics.
