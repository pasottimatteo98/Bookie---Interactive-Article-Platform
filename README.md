# Bookie - Interactive Article Platform

Bookie is a Node.js/Express web application that allows writers to publish articles and episodes, with both free and premium content options. Readers can follow articles, favorite episodes, and purchase premium content.

## Features

### User Management
- User registration and authentication
- Two user types: Writers and Readers
- Profile management

### Content Management
- Writers can create and manage articles
- Articles can contain multiple episodes
- Support for free and paid content
- Content categorization

### Reader Experience
- Browse articles by category
- Search functionality
- Follow favorite articles
- Save episodes to favorites
- Comment on episodes
- Payment system for premium content

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: SQLite3
- **Frontend**: EJS templates, Bootstrap 5, JavaScript/jQuery
- **AJAX**: Axios
- **Authentication**: Session-based with MD5 password hashing

## Installation

1. Clone the repository
2. Install dependencies
```bash
npm install
```
3. Create a `.env` file with the following variables:
```
HTTP_PORT=3000
SESSION_SECRET=your_session_secret
```
4. Start the server
```bash
npm start
```
Or for development with auto-reload:
```bash
npm run dev
```

## Project Structure

- `node-express/database.js` - Database setup and schema
- `node-express/server.js` - Main application file with routes
- `node-express/views/` - EJS templates
- `css/` - Stylesheets
- `js/` - Client-side JavaScript

## Database Schema

The application uses several interconnected tables including:
- Account - User credentials and type
- Utenti - User profile information
- Articoli - Articles written by users
- Episodi - Episodes within articles
- Categorie - Article categories
- Tipo - Content type (free or paid)
- CartaCredito - Payment information
- Pagamenti - Payment transactions
- Seguiti - Followed articles
- Preferiti - Favorited episodes
- Commenti - User comments on episodes

## Default Accounts

The system comes with two pre-configured accounts for testing:

### Writer Account
- Email: scrittore@example.com
- Password: scrittore123

### Reader Account
- Email: lettore@example.com
- Password: lettore123

## Screenshots

![Homepage](screenshots/homepage.png)
![Article View](screenshots/article.png)
![Writer Dashboard](screenshots/writer.png)

## License

ISC © Matteo Pasotti
