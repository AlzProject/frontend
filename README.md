# MindCheck - Cognitive Assessment Platform

MindCheck is a comprehensive mental health screening platform designed to provide accessible and professional cognitive assessments.

## Features

- **Landing Page**: Overview of available cognitive tests.
- **MMSE Assessment**: A fully interactive Mini-Mental State Examination (MMSE) test.
- **Reusable Components**: A library of question components (Multiple Choice, Text, Drawing, Likert Scale).
- **Backend Integration**: Connects to a backend API for test management and result submission.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS v4
- **Routing**: React Router DOM
- **HTTP Client**: Axios

## Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev
    ```

3.  **Build for Production**:
    ```bash
    npm run build
    ```

## Project Structure

- `src/components/QuestionTypes`: Reusable question components.
- `src/tests/MMSE`: MMSE test implementation and structure documentation.
- `src/api.js`: Axios instance configuration.
- `src/App.jsx`: Main application component and routing.

## API Configuration

The application expects a backend API running at `http://localhost:3000/v1` (default). You can configure this via the `VITE_API_BASE_URL` environment variable in a `.env` file.

