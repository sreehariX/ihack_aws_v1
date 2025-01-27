<div align="center">
  

![image](https://github.com/user-attachments/assets/d56d262e-6222-4fcf-809b-339456732869)


[Getting Started] | [Live Demo Video]
</div>

This is the main source code repository for ihack_aws hackathon, built with aws transcribe , react native and fastapi.

## What are the futures implemented?

- **Scam call detection:** We use aws transcribe to get real time speech to text transcription and every 10 seconds take the transcription and ask an llm to get structured output whether FRAUD OR LEGITAMATE based on confidence score
- **Vkyc deepfake detection:** Tried using amazon faceliveness also implemented backend but currently it does not support react native it does but with native component not able to implement due to time constraints
- **Spam report :** You can report a user with phone number and description we use that data to improve the spam detection model in future models
- **SHA256 :**  I thought how can we guarantee users that their data is safe so the approach is everytime we record a call or video and upload to the backend we create a sha256 hash so in the future if there is any data leak they can verify if the sha256 hash matches that means it is leaked from our end otherswise we guarantee user data protection 



## Youtube demo video 

[![Video Title](https://img.youtube.com/vi/nGDS7qykMOw/maxresdefault.jpg)](https://www.youtube.com/watch?v=nGDS7qykMOw)

## Quick Start

1. Clone the repository
2. Follow the [Installation Guide](#installation)
3. Start developing with expo react native with `npx expo run:android --device`  and `uvicorn app.main:app --host 0.0.0.0 --port 8000` for backend

## Main Prerequisites 

### Required Software
- Node.js (v18 or higher)
- Python (v3.8 or higher)
- Android Studio (for Android development)
- Expo CLI: `npm install -g expo-cli`

### API Keys & Credentials
- Google API Key (for Gemini AI)
- AWS Credentials (for Transcribe service)
  - AWS Access Key ID
  - AWS Secret Access Key
  - AWS Region

### Database
- SQLite (included by default)

### Mobile Development Setup
- Expo Go app installed on your mobile device for testing
- Android SDK (for Android development)



## Installation
### Expo React Native Setup

1. **Clone & Navigate**
   ```bash
   git clone https://github.com/sreehariX/ihack_aws_v1
   cd expo-mobile app
   ```

4. **Start Development Server with development build after installing required packages**
   ```bash
   npx expo run:android --device
   ```

### Backend Setup

1. **Navigate to Backend Directory**
   ```bash
   cd backend
   ```

2. **Create & Activate Virtual Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**
   Create a `.env` file in the backend directory:
   ```env
   S3_BUCKET=
   AWS_ACCESS_KEY_ID=
   AWS_SECRET_ACCESS_KEY=
   AWS_REGION=
   GOOGLE_API_KEY=
   ```

5. **Start Development Server**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

## Brief overview

### How scam call detection works ?

![image](https://github.com/user-attachments/assets/74d4c8c7-9063-427c-a5ca-ceffe66e583c)
- First we wil record the audio in mobile and send to backend because getting auto call recording permission for ios and android is hard so we then simulate the call
- When call is simulated using aws transcribe realtime transcription we get the realtime transcription then every 10 seconds pass to llm and get structured output if confidence is higher
- Then we will trigger a warning in the frontend


### How sha256 works ?
![image](https://github.com/user-attachments/assets/8e1855d8-80ed-40c1-9e83-bf4baf2028d2)

- Everytime we record audio and upload to backend we will send that to /audio/storehash endpoint just before deleting the audio file and get sha256 hash
- This hash is unique for every input so the incase that user wants to verify in future whether his data is safe or not 
- He will upload that to the hash verification screen if the hash does not match then data is not leaked if so then it is issue with our application . By implementing this we give user security .

### How reporting works 
![image](https://github.com/user-attachments/assets/625b7bfa-bd49-450e-9f78-c2de6f25d6b3)

- Users report spam by submitting a phone number and description, which is sent to the backend API.
- The backend checks if the phone number exists; if so, it increments the report count, otherwise, it creates a new report.
- Users can view recent reports in the app, helping them stay informed about potential spam numbers and also we use this data to improve future models accuracy


### deepfake detection
- Unfortunately currently aws faceliveness does not support react native so due to time constraints not able to implement it but implemented that backend 

## Tech Stack

### Frontend
- React Native with TypeScript
- Expo for development and build
- React Navigation for routing
- Expo Vector Icons for icons
- Expo AV for audio and video handling

### Backend
- FastAPI
- SQLAlchemy for ORM
- PostgreSQL for database
- Python for backend logic

## License

MIT License


[Getting Started]: #quick-start
[Live Demo Video]: https://youtu.be/nGDS7qykMOw?si=MvoYWrMPMh0bMV12
