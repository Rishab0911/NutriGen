
# NutriGen API Contract

Version: 0.1 (Draft)

## Base URL
http://127.0.0.1:8000

## 1. GET /

Purpose: Check that the backend is running.

Response:
{
  "message": "NutriGen Backend is Running!"
}

## 2. GET /health

Purpose: Check backend health.

Response:
{
  "status": "Backend is healthy"
}

## 3. POST /generate-meal

Purpose: Generate a meal plan from user details.

Request:
{
  "age": 20,
  "weight": 68,
  "goal": "weight gain",
  "diet": "vegetarian"
}

Response (draft):
{
  "status": "success",
  "daily_calories": 2400,
  "meals": [
    {
      "name": "Breakfast",
      "food": "Oats and milk",
      "calories": 400,
      "protein": 18
    }
  ]
}

## Status Codes

200 - Request successful
422 - Invalid input
500 - Unexpected server error

## Notes

- Request fields are provisional.
- Final user fields need team agreement.
- Nutrition response structure needs team agreement.
- This contract is a draft for frontend/backend integration.