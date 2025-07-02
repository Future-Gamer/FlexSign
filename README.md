# FlexSign

**FlexSign** is a modern, intuitive document signing and management platform designed to simplify digital agreements for individuals and teams. Built with React, Supabase, and Vite, it streamlines the process of uploading, signing, and tracking documents securely—all in one place.

---

## 🚀 Features

- **Secure Document Upload:** Easily upload and store documents with robust security.
- **Electronic Signatures:** Sign documents digitally with a seamless workflow.
- **Document Dashboard:** Track document status, view history, and manage all your files in one dashboard.
- **User Authentication:** Secure login and user management powered by Supabase Auth.
- **Role-Based Access:** Assign roles and permissions for senders, signers, and admins.
- **Real-Time Updates:** Instantly see changes and status updates as documents move through the signing process.
- **Notifications & Alerts:** Get notified when documents are signed or require your attention.
- **Modern UI:** Clean, responsive interface built with shadcn-ui and Tailwind CSS.
  
---

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Vite, shadcn-ui, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime)
- **State Management:** React Context API, React Query

---

## 📦 Getting Started

### 1. Clone the Repository

```bash
   git clone <YOUR_GIT_URL>
   cd flexsign
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root and add your Supabase credentials:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_URL=your-api-url
```

### 4. Run the Development Server

```bash
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173) (or the port specified by Vite).

---

## 📚 Usage

-**Upload Documents:** Start by uploading the document you want to sign or send.
-**Invite Signers:** Add recipients and assign signing roles.
-**Sign & Track:** Sign documents electronically and track their status in real time.
-**Manage Documents:** Access all your documents and signing history from the dashboard.

---

## 📝 Contributing

Contributions are welcome! Please open issues or submit pull requests for improvements and bug fixes.

---


## 🙏 Acknowledgements

- [Supabase](https://supabase.com/)
- shadcn-ui
- [Vite](https://vitejs.dev/)
- [React Query](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/)

---

**FlexSign** – Making digital document signing secure, simple, and efficient.
