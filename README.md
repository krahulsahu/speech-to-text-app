# ??? VoiceScribe – Multilingual Speech to Text

A real-time multilingual speech transcription web application built with **Java Spring Boot** and vanilla **HTML/CSS/JavaScript**.

## ?? Features

- **Real-time Transcription** using Browser Web Speech API (Chrome)
- **Multilingual Support** – Hindi + English (Hinglish), Tamil, Bengali, etc.
- **Audio Visualizer** – Live waveform while recording
- **H2 Database** – Persistent storage of all transcriptions
- **CRUD Dashboard** – Create, Read, Update, Delete transcriptions
- **Search** – Full-text search across transcriptions
- **WebSocket** – Real-time sync via STOMP/SockJS
- **H2 Console** – Browse DB at `/h2-console`

<img width="1887" height="1073" alt="image" src="https://github.com/user-attachments/assets/f006d1cb-141a-4b14-b2b0-0af642313c72" />

<img width="1917" height="965" alt="image" src="https://github.com/user-attachments/assets/b0b0d808-969f-4fa0-8c16-bc36b5f35b75" />


## ??? Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Backend    | Java 17, Spring Boot 3.2            |
| Database   | H2 (file-based), JPA/Hibernate      |
| WebSocket  | STOMP over SockJS                   |
| Frontend   | HTML5, CSS3, Vanilla JS             |
| Speech API | Web Speech API (browser built-in)   |
| Build      | Maven                               |

## ?? Prerequisites

- Java 17+
- Maven 3.6+
- Chrome browser (for Speech Recognition)

## ?? Run Locally

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/speech-to-text-app.git
cd speech-to-text-app

# Build & Run
mvn spring-boot:run
```

Open: **http://localhost:8080**

H2 Console: **http://localhost:8080/h2-console**
- JDBC URL: `jdbc:h2:file:./data/transcriptions`
- Username: `sa`
- Password: (empty)

## ?? Project Structure

```
speech-to-text-app/
+-- src/main/java/com/speechapp/
¦   +-- SpeechToTextApplication.java   # Entry point
¦   +-- model/Transcription.java       # JPA Entity
¦   +-- repository/                    # Spring Data JPA
¦   +-- service/TranscriptionService.java
¦   +-- controller/
¦       +-- TranscriptionController.java  # REST API
¦       +-- WebSocketController.java      # WS Handler
¦       +-- WebConfig.java               # STOMP Config
+-- src/main/resources/
¦   +-- application.properties
¦   +-- static/
¦       +-- index.html
¦       +-- css/style.css
¦       +-- js/app.js
+-- pom.xml
```

## ?? REST API Endpoints

| Method | Endpoint                        | Description              |
|--------|---------------------------------|--------------------------|
| GET    | `/api/transcriptions`           | Get all transcriptions   |
| GET    | `/api/transcriptions/{id}`      | Get by ID                |
| POST   | `/api/transcriptions`           | Create new               |
| PUT    | `/api/transcriptions/{id}`      | Update                   |
| DELETE | `/api/transcriptions/{id}`      | Delete one               |
| DELETE | `/api/transcriptions`           | Delete all               |
| GET    | `/api/transcriptions/search?q=` | Search by keyword        |
| GET    | `/api/transcriptions/stats`     | Get stats                |

## ?? Speech Recognition Notes

- Uses **Web Speech API** (free, no API key needed)
- Best supported in **Google Chrome**
- Set language to **hi-IN** for Hindi/English mixed (Hinglish)
- Continuous recognition with interim results

## ?? Deployment

### Render (Free)
1. Push to GitHub
2. Create a new Web Service on [render.com](https://render.com)
3. Build Command: `mvn clean package -DskipTests`
4. Start Command: `java -jar target/speech-to-text-1.0.0.jar`

### Railway
```bash
railway up
```

## ?? Assignment Submission

Built for the Speech-to-Text assignment by Procucev.
