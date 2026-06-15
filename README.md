# 🥬 FreshMart — Online Grocery Store

A full-stack e-commerce web application for grocery delivery, built with **Node.js**, **Express**, **MySQL**, and a **vanilla JavaScript** frontend. FreshMart lets users browse products, manage their cart, place orders, and receive email confirmations — all with a clean, responsive UI.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

---

## ✨ Features

- 🛒 **Product Catalog** — Browse groceries by category (Vegetables, Fruits, Dairy, Grains, Snacks, Beverages, etc.)
- 🔍 **Search & Filter** — Search products by name and filter by category
- 🛍️ **Shopping Cart** — Add/remove items, update quantities
- 📦 **Order Placement** — Checkout with delivery details and payment method (COD)
- 🔐 **User Authentication** — Register & login with JWT-based auth and bcrypt password hashing
- 📧 **Email Notifications** — Order confirmation emails via Gmail SMTP
- 📱 **Responsive Design** — Works seamlessly on desktop, tablet, and mobile
- ⚡ **Auto Database Setup** — Tables and seed data are created automatically on first run

---

## 🛠️ Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript    |
| **Backend**  | Node.js, Express.js                |
| **Database** | MySQL                              |
| **Auth**     | JWT (jsonwebtoken), bcryptjs        |
| **Email**    | Nodemailer (Gmail SMTP)             |

---

## 📁 Project Structure

```
FreshMart/
├── backend/
│   ├── config/             # Database connection config
│   ├── controllers/        # Route handler logic
│   ├── middleware/          # JWT auth middleware
│   ├── models/             # Database setup & seed
│   ├── routes/             # API route definitions
│   │   ├── auth.js         # /api/auth (register, login)
│   │   ├── products.js     # /api/products (catalog)
│   │   ├── cart.js         # /api/cart (cart management)
│   │   └── orders.js       # /api/orders (order placement)
│   ├── server.js           # Express app entry point
│   ├── package.json
│   ├── .env.example        # Environment variable template
│   └── .gitignore
├── frontend/
│   ├── css/
│   │   └── style.css       # Complete stylesheet
│   ├── js/
│   │   ├── api.js          # API helper functions
│   │   ├── auth.js         # Login/register logic
│   │   ├── navbar.js       # Dynamic navigation bar
│   │   ├── home.js         # Homepage & product listing
│   │   ├── product.js      # Single product page
│   │   ├── cart.js         # Cart page logic
│   │   ├── checkout.js     # Checkout flow
│   │   └── confirmation.js # Order confirmation page
│   ├── images/             # Product images
│   ├── index.html          # Homepage
│   ├── product.html        # Product detail page
│   ├── cart.html           # Shopping cart page
│   ├── checkout.html       # Checkout page
│   ├── confirmation.html   # Order confirmation page
│   ├── login.html          # Login page
│   └── register.html       # Registration page
├── database/
│   └── schema.sql          # Full database schema + seed data
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher) — [Download](https://nodejs.org/)
- **MySQL** (v8.0 or higher) — [Download](https://dev.mysql.com/downloads/)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/freshmart-online-grocery-store.git
cd freshmart-online-grocery-store
```

### 2. Set Up the Database

Create the MySQL database and tables:

```bash
mysql -u root -p < database/schema.sql
```

Or let the app do it automatically — it will create tables and seed data on first run.

### 3. Configure Environment Variables

```bash
cd backend
cp .env.example .env
```

Edit the `.env` file with your actual credentials:

```env
DB_PASSWORD=your_mysql_password
JWT_SECRET=your_secret_key
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_gmail_app_password
```

> **Note:** For Gmail SMTP, you must use an [App Password](https://myaccount.google.com/apppasswords) (requires 2FA enabled on your Google account).

### 4. Install Dependencies

```bash
cd backend
npm install
```

### 5. Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The app will be live at **http://localhost:3000** 🎉

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint             | Description          |
|--------|----------------------|----------------------|
| POST   | `/api/auth/register` | Register a new user  |
| POST   | `/api/auth/login`    | Login & get JWT token|

### Products
| Method | Endpoint                        | Description          |
|--------|---------------------------------|----------------------|
| GET    | `/api/products`                 | Get all products     |
| GET    | `/api/products/:id`             | Get product by ID    |
| GET    | `/api/products?category=Fruits` | Filter by category   |
| GET    | `/api/products?search=rice`     | Search products      |

### Cart (🔒 Auth Required)
| Method | Endpoint           | Description              |
|--------|--------------------|--------------------------|
| GET    | `/api/cart`        | Get user's cart          |
| POST   | `/api/cart`        | Add item to cart         |
| PUT    | `/api/cart/:id`    | Update item quantity     |
| DELETE | `/api/cart/:id`    | Remove item from cart    |

### Orders (🔒 Auth Required)
| Method | Endpoint           | Description              |
|--------|--------------------|--------------------------|
| POST   | `/api/orders`      | Place a new order        |
| GET    | `/api/orders`      | Get user's order history |

### Utility
| Method | Endpoint         | Description              |
|--------|------------------|--------------------------|
| GET    | `/api/health`    | Server health check      |

---

## 🗄️ Database Schema

The app uses **5 tables**:

| Table          | Description                            |
|----------------|----------------------------------------|
| `users`        | Customer accounts (bcrypt passwords)   |
| `products`     | Grocery catalog (15 seeded items)      |
| `cart`         | User shopping cart items               |
| `orders`       | Placed orders with delivery details    |
| `order_items`  | Individual products within each order  |

See [`database/schema.sql`](database/schema.sql) for the complete schema.

---

## 📸 Product Categories

| Category             | Example Products               |
|----------------------|-------------------------------|
| 🥕 Vegetables        | Potatoes, Onions, Tomatoes     |
| 🍎 Fruits            | Bananas, Apples                |
| 🥛 Dairy             | Milk, Eggs                     |
| 🌾 Grains & Staples  | Rice, Flour, Sugar, Salt       |
| 🍪 Snacks            | Biscuits                       |
| ☕ Beverages          | Tea Powder                     |
| 🛢️ Oils & Spices     | Cooking Oil                    |
| 🍞 Bakery            | Bread                          |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **ISC License**.

---

## 👤 Author

**Ayush Nandi**

---

<p align="center">Made with ❤️ for fresh groceries</p>
