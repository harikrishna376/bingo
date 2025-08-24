# Bingo Master

Welcome to **Bingo Master**, a classic web-based Bingo game with a modern twist. This application allows users to register, play Bingo, and compete for a spot on the leaderboard.

## Features

- **User Authentication:** Secure registration and login system.
- **Dynamic Bingo Card Generation:** Each game features a unique, randomly generated Bingo card.
- **Interactive Gameplay:** Call numbers, mark your card, and check for a "Bingo!"
- **Scoring System:** Scores are calculated based on how quickly you get a Bingo.
- **Leaderboard:** See how you stack up against the top 10 players.
- **Sleek UI:** A clean and modern user interface built with Tailwind CSS.

## Technologies Used

- **Backend:**
  - [Flask](https://flask.palletsprojects.com/): A lightweight WSGI web application framework in Python.
  - [Flask-SQLAlchemy](https://flask-sqlalchemy.palletsprojects.com/): A Flask extension for SQLAlchemy, an SQL toolkit and Object-Relational Mapper (ORM).
  - [SQLite](https://www.sqlite.org/): A C-language library that implements a small, fast, self-contained, high-reliability, full-featured, SQL database engine.

- **Frontend:**
  - [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript): For game logic and interactivity.
  - [Tailwind CSS](https://tailwindcss.com/): A utility-first CSS framework for rapid UI development.
  - [HTML5](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5)

## Installation

To run this project locally, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/bingo-master.git
   cd bingo-master
   ```

2. **Create a virtual environment and activate it:**
   ```bash
   # For Windows
   python -m venv venv
   venv\Scripts\activate

   # For macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install the required dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
   *(Note: You will need to create a `requirements.txt` file. See the "Creating requirements.txt" section below.)*

4. **Run the application:**
   ```bash
   python app.py
   ```

5. **Open your browser and navigate to:**
   ```
   http://127.0.0.1:5000
   ```

### Creating `requirements.txt`

To generate the `requirements.txt` file, run the following command in your activated virtual environment:

```bash
pip freeze > requirements.txt
```

For this project, the `requirements.txt` file should contain:

```
Flask
Flask-SQLAlchemy
Werkzeug
```

## How to Play

1.  **Register:** Create a new account with a unique username and password.
2.  **Login:** Log in to your account to start playing.
3.  **Start a New Game:** A new Bingo card will be generated for you.
4.  **Call Numbers:** Click the "Call Next Number" button to get a new number.
5.  **Mark Your Card:** If the called number is on your card, click on it to mark it. The "FREE" space in the center is already marked for you.
6.  **Check for Bingo:** When you think you have a Bingo (a full row, column, or diagonal of marked numbers), click the "Check Bingo!" button.
7.  **Win and Score:** If you have a valid Bingo, you win! Your score is calculated based on the number of called numbers—the fewer, the better.
8.  **Leaderboard:** Check the leaderboard to see if you've made it to the top 10!

## API Endpoints

The application provides the following API endpoints:

- `POST /api/register`: Register a new user.
- `POST /api/login`: Log in a user.
- `POST /api/logout`: Log out the current user.
- `GET /api/me`: Get the current user's session status.
- `POST /api/submit_score`: Submit a score for the current user.
- `GET /api/leaderboard`: Get the top 10 scores.
