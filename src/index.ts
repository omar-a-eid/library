import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import { checkDatabaseConnection } from './config/db';
import { errorHandler } from './middleware/errorHandler';
import authorsRoutes from './modules/authors/authors.routes';
import booksRoutes from './modules/books/books.routes';
import borrowingsRoutes from './modules/borrowings/borrowings.routes';
import usersRoutes from './modules/users/users.routes';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.get('/', (req, res) => {
  res.json({
    message: 'Library Management System API',
    version: '1.0.0',
  });
});

app.use('/api/v1/authors', authorsRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/books', booksRoutes);
app.use('/api/v1/borrowings', borrowingsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    const isDbConnected = await checkDatabaseConnection();

    if (!isDbConnected) {
      console.error('Failed to connect to database.');
      process.exit(1);
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
