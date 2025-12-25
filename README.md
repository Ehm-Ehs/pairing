# Pair Form - Random Group Generator

Effortlessly create random pairings and groups for your team, class, or event. Pair Form makes group generation simple and fair.

## Features

- **Random Group Generation**: Automatically generate random pairs or groups based on your participants.
- **Authentication**: Secure Sign Up and Sign In functionality using Firebase.
- **Participant Management**: Easily add and manage users for your events.
- **Dashboard**: A central hub to view and manage your pairings.
- **Event Creation**: Create custom events, specifying group sizes and other parameters.
- **Share Results**: Generate unique URLs to share grouping results with others.

## Tech Stack

- **Framework**: [React](https://reactjs.org/) with [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Authentication & Backend**: [Firebase](https://firebase.google.com/)
- **State Management**: React Hooks & Context
- **Forms**: [Formik](https://formik.org/) & [Yup](https://github.com/jquense/yup)
- **Notifications**: [React Toastify](https://github.com/fkhadra/react-toastify)
- **Icons**: [React Icons](https://react-icons.github.io/react-icons/)

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites

Make sure you have Node.js installed on your system.

- [Node.js](https://nodejs.org/)

### Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/your-username/random-selection.git
    cd random-selection
    ```

2.  Install dependencies:

    ```bash
    npm install
    ```

3.  Set up Environment Variables:
    Create a `.env.local` file in the root directory and add your Firebase configuration keys:
    ```env
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    ```

### Running Locally

Start the development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) (or the port shown in your terminal) to view it in the browser.

### Building for Production

To build the app for production:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## License

This project is licensed under the MIT License.
