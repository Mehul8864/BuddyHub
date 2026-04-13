<div align="center">
  <img src="frontend/public/light-logo.svg" alt="BuddyHub Logo" width="80" />
  <h1>BuddyHub</h1>
  <p>A full-stack social media platform — post, chat, follow, and connect in real time.</p>

  ![Node.js](https://img.shields.io/badge/Node.js-20.x-green?logo=node.js)
  ![React](https://img.shields.io/badge/React-18-blue?logo=react)
  ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen?logo=mongodb)
  ![Socket.IO](https://img.shields.io/badge/Socket.IO-4.x-black?logo=socket.io)
  ![Chakra UI](https://img.shields.io/badge/Chakra_UI-2.x-teal?logo=chakraui)
</div>

---

## What is BuddyHub?

BuddyHub is a Threads-inspired social platform where users can share posts, follow each other, chat in real time, get notified of activity, and save content — all in a clean, dark-mode-first UI.

---

## Features

### Auth
- Sign up / log in with JWT (stored in httpOnly cookie)
- Auto-login on page refresh via localStorage hydration
- Account freeze & unfreeze

### Posts & Feed
- Create posts with text (up to 500 chars) and images (Cloudinary)
- Like / unlike posts
- Reply to posts (threaded comments)
- Delete your own posts
- Feed of posts from people you follow
- Bookmark / save posts for later

### People
- User profiles with avatar, bio, followers & following count
- Follow / unfollow users
- Suggested users sidebar
- Search users by username or name

### Messaging
- Real-time 1-on-1 chat via Socket.IO
- Send text and image messages
- Typing indicators ("..." bubbles)
- Message seen / read receipts
- Delete your own messages
- Online presence indicators

### Notifications
- Real-time in-app notifications for likes, replies, and follows
- Unread badge on the bell icon in the header
- Mark all as read
- Delete individual notifications

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Chakra UI, Recoil, React Router v6 |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose ODM) |
| Real-time | Socket.IO |
| Auth | JWT + httpOnly cookies |
| Image storage | Cloudinary |
| Scheduling | node-cron |

---

## Project Structure

```
BuddyHub/
├── backend/
│   ├── controllers/       # Route handlers
│   ├── models/            # Mongoose schemas
│   ├── routes/            # Express routers
│   ├── middlewares/       # Auth middleware
│   ├── socket/            # Socket.IO setup
│   ├── utils/             # JWT helper
│   ├── cron/              # Cron jobs
│   ├── db/                # MongoDB connection
│   └── server.js          # Entry point
└── frontend/
    └── src/
        ├── atoms/         # Recoil global state
        ├── components/    # Reusable UI components
        ├── context/       # Socket context
        ├── hooks/         # Custom React hooks
        └── screens/       # Page-level components
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (free tier works)
- A [Cloudinary](https://cloudinary.com) account (free tier works)

### 1. Clone the repo

```bash
git clone https://github.com/<your-username>/BuddyHub.git
cd BuddyHub
```

### 2. Set up environment variables

Create `backend/.env`:

```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/buddyhub
JWT_SECRET=your_super_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=5000
```

### 3. Install dependencies

```bash
# backend (from project root)
npm install

# frontend
cd frontend && npm install
```

### 4. Run the app

Open **two terminals**:

```bash
# Terminal 1 — backend (from project root)
npm run dev

# Terminal 2 — frontend
cd frontend
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |

> The Vite dev server proxies all `/api` requests to the backend automatically — no CORS issues.

---

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/users/signup` | Register |
| POST | `/api/users/login` | Login |
| POST | `/api/users/logout` | Logout |
| GET | `/api/users/profile/:query` | Get user by username or ID |
| GET | `/api/users/suggested` | Suggested users |
| GET | `/api/users/search?q=` | Search users |
| POST | `/api/users/follow/:id` | Follow / unfollow |
| PUT | `/api/users/update/:id` | Update profile |
| PUT | `/api/users/freeze` | Freeze account |
| GET | `/api/posts/feed` | Get feed posts |
| POST | `/api/posts/create` | Create post |
| GET | `/api/posts/:id` | Get single post |
| DELETE | `/api/posts/:id` | Delete post |
| PUT | `/api/posts/like/:id` | Like / unlike |
| PUT | `/api/posts/reply/:id` | Reply to post |
| PUT | `/api/posts/bookmark/:id` | Bookmark / unbookmark |
| GET | `/api/posts/bookmarks` | Get saved posts |
| GET | `/api/messages/conversations` | Get conversations |
| GET | `/api/messages/:otherUserId` | Get messages |
| POST | `/api/messages` | Send message |
| DELETE | `/api/messages/:id` | Delete message |
| GET | `/api/notifications` | Get notifications |
| GET | `/api/notifications/unread-count` | Unread count |
| PUT | `/api/notifications/mark-read` | Mark all read |
| DELETE | `/api/notifications/:id` | Delete notification |

---

## Socket.IO Events

| Event | Direction | Description |
|---|---|---|
| `getOnlineUsers` | Server → Client | List of online user IDs |
| `newMessage` | Server → Client | Incoming message |
| `messagesSeen` | Server → Client | Messages marked as read |
| `messageDeleted` | Server → Client | Message was deleted |
| `newNotification` | Server → Client | New like / reply / follow |
| `typing` | Client → Server | User is typing |
| `stopTyping` | Client → Server | User stopped typing |
| `markMessagesAsSeen` | Client → Server | Mark conversation as read |

---

## Roadmap

- [ ] Group chats
- [ ] Post scheduling
- [ ] Hashtags and trending feed
- [ ] Push notifications (PWA)
- [ ] Mobile app (React Native)
- [ ] Dark / light theme toggle per user preference saved to DB

---

## License

MIT © BuddyHub
