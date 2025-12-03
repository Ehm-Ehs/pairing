# Group Raffle / Pairing Tool

A React-based application designed to help organizers create balanced groups for events, workshops, or classes, and allow participants to self-register into specific roles.

## 🚀 Features

### For Organizers
- **Automated Group Generation**: Define the number of participants and groups, and let the app calculate the structure.
- **Role Balancing**: Specify "Characteristics" (e.g., Developer, Designer, Manager) to ensure every group has the required mix of skills.
- **Real-time Dashboard**: Monitor group filling in real-time.
- **Shareable Links**: Generate unique links for participants to join specific sessions.

### For Participants
- **Self-Service Registration**: Join a group by simply clicking a link and entering details.
- **Role Selection**: Automatically see available slots for your specific role/track.
- **Instant Confirmation**: Get immediate feedback when you've successfully joined a group.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Backend/Database**: Firebase (Firestore, Auth)
- **Routing**: React Router DOM
- **Forms**: Formik + Yup validation

## 📦 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd random-selection
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory with your Firebase configuration:
   ```env
   VITE_API_KEY=your_api_key
   VITE_AUTH_DOMAIN=your_auth_domain
   VITE_PROJECT_ID=your_project_id
   VITE_STORAGE_BUCKET=your_storage_bucket
   VITE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_APP_ID=your_app_id
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

## 📖 Usage

1. **Log In**: Access the app and sign in using your credentials.
2. **Create Event**: Navigate to the Home page, enter the total number of participants and groups, and define the required roles (characteristics).
3. **Generate**: Click "Get Pairings" to generate the empty group slots.
4. **Share**: Use the "Share" page to get a link for your participants.
5. **Monitor**: Watch the "Your Pairing" page as slots fill up.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
