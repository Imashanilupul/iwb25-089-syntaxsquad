# Categories Module

This directory contains all the files related to the Categories feature of the Transparent Governance Platform.

## Files

- `categories-controller.bal` - HTTP controller with REST endpoints for categories operations
- `categories_service.bal` - Business logic service for categories operations

## Structure

The controller handles HTTP requests and responses, while the service contains the business logic and database operations.

## API Endpoints

The categories controller provides the following endpoints:

- `POST /api/categories` - Create a new category
- `GET /api/categories` - Get all categories
- `GET /api/categories/{id}` - Get category by ID
- `PUT /api/categories/{id}` - Update category by ID
- `DELETE /api/categories/{id}` - Delete category by ID

## Usage

The categories controller runs on port 8085 and provides a separate service from the main API.

## Database

Uses Supabase as the backend database for storing category information.
