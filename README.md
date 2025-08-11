# Help Desk Hero API

This is the backend REST API powering the Help Desk Hero ticketing system. It manages users, tickets, authentication, and data relationships for the full-stack project.

---

## Features

- User authentication with JSON Web Tokens (JWT)
- Secure password hashing with bcrypt
- CRUD operations for tickets and users
- Role-based access and protected routes
- RESTful API design with Express.js
- MongoDB Atlas cloud database with Mongoose ODM

---

## Technologies Used

- Node.js
- Express.js
- MongoDB (Atlas)
- Mongoose
- JSON Web Tokens (JWT)
- bcrypt
- Helmet, CORS, dotenv for security and config

---

## Frontend Demo & GIF Preview

For the user interface and interactive demo, please visit the frontend repository:

[Help Desk Hero Frontend Repo](http://github.com/george-garcia/Ticketing-tool-client)

![Help Desk Hero Frontend Demo](https://github.com/george-garcia/Portfolio/blob/master/src/public/HelpDeskHerogif.gif)

---

## API Endpoints

- `POST /api/v1/auth` — User registration and login
- `GET /api/v1/tickets` — Fetch tickets
- `POST /api/v1/tickets` — Create a new ticket
- `PATCH /api/v1/tickets/:id` — Update a ticket
- `DELETE /api/v1/tickets/:id` — Delete a ticket
- `GET /api/v1/users` — Fetch users
- `PATCH /api/v1/users/:id` — Update user info
- `DELETE /api/v1/users/:id` — Delete user

---

## Getting Started

1. Clone the repo:
   ```bash
   git clone https://github.com/george-garcia/Ticketing-tool-server.git
   ```
