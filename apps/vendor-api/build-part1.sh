#!/bin/bash
# Complete Vendor API Build Script
# This script creates ALL remaining source files

set -e

echo "🏗️  Building Complete Vendor API..."

# Navigate to src directory
cd "$(dirname "$0")/src"

# ============================================
# UTILS
# ============================================

echo "Creating utilities..."

# Logger
cat > utils/logger.ts << 'EOF'
import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';
const logFile = process.env.LOG_FILE || 'logs/vendor-api.log';

export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: logFile }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}
EOF

# JWT Helper
cat > utils/jwt.helper.ts << 'EOF'
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET!;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

export const generateToken = (payload: object): string => {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};
EOF

# Password Helper
cat > utils/password.helper.ts << 'EOF'
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};
EOF

# AWS DynamoDB Helper
cat > utils/dynamodb.helper.ts << 'EOF'
import AWS from 'aws-sdk';

const config: AWS.DynamoDB.ClientConfiguration = {
  region: process.env.AWS_REGION || 'us-east-1',
};

if (process.env.DYNAMODB_ENDPOINT) {
  config.endpoint = process.env.DYNAMODB_ENDPOINT;
}

export const dynamodb = new AWS.DynamoDB(config);
export const docClient = new AWS.DynamoDB.DocumentClient({
  service: dynamodb,
});

export const TABLE_PREFIX = process.env.DYNAMODB_TABLE_PREFIX || 'reeyo-dev';

export const TABLES = {
  VENDORS: `${TABLE_PREFIX}-vendors`,
  ORDERS: `${TABLE_PREFIX}-orders`,
  WALLETS: `${TABLE_PREFIX}-wallets`,
  TRANSACTIONS: `${TABLE_PREFIX}-transactions`,
  PAYOUTS: `${TABLE_PREFIX}-payouts`,
};
EOF

# S3 Helper
cat > utils/s3.helper.ts << 'EOF'
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const s3 = new AWS.S3({
  region: process.env.S3_REGION || process.env.AWS_REGION,
});

const BUCKET = process.env.S3_BUCKET_NAME || 'reeyo-uploads';

export const uploadFile = async (
  file: Express.Multer.File,
  folder: string = 'vendors'
): Promise<string> => {
  const key = `${folder}/${uuidv4()}-${file.originalname}`;
  
  await s3.putObject({
    Bucket: BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read',
  }).promise();
  
  return `https://${BUCKET}.s3.amazonaws.com/${key}`;
};

export const deleteFile = async (url: string): Promise<void> => {
  const key = url.split('.com/')[1];
  
  await s3.deleteObject({
    Bucket: BUCKET,
    Key: key,
  }).promise();
};
EOF

# Socket Helper
cat > utils/socket.helper.ts << 'EOF'
import io from 'socket.io-client';
import { logger } from './logger';

const SOCKET_URL = process.env.SOCKET_SERVER_URL || 'http://localhost:3004';

class SocketClient {
  private socket: any;

  constructor() {
    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
    });

    this.socket.on('connect', () => {
      logger.info('Connected to Socket Server');
    });

    this.socket.on('disconnect', () => {
      logger.warn('Disconnected from Socket Server');
    });
  }

  emitNewOrder(orderId: string, vendorId: string, orderData: any) {
    this.socket.emit('new_order', {
      orderId,
      vendorId,
      ...orderData,
    });
  }

  emitOrderUpdate(orderId: string, status: string, data: any) {
    this.socket.emit('order_update', {
      orderId,
      status,
      ...data,
    });
  }

  joinRoom(vendorId: string) {
    this.socket.emit('join_room', { roomId: `vendor_${vendorId}` });
  }
}

export const socketClient = new SocketClient();
EOF

# Validators
cat > utils/validators.ts << 'EOF'
import { body, param, query } from 'express-validator';

export const registerValidation = [
  body('businessName').notEmpty().trim().isLength({ min: 3, max: 100 }),
  body('ownerName').notEmpty().trim().isLength({ min: 3, max: 100 }),
  body('phone').notEmpty().matches(/^\+[1-9]\d{1,14}$/),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
  body('businessType').isIn(['RESTAURANT', 'GROCERY', 'PHARMACY', 'OTHER']),
  body('address.street').notEmpty().trim(),
  body('address.city').notEmpty().trim(),
  body('location.latitude').isFloat({ min: -90, max: 90 }),
  body('location.longitude').isFloat({ min: -180, max: 180 }),
];

export const loginValidation = [
  body('phone').notEmpty().matches(/^\+[1-9]\d{1,14}$/),
  body('password').notEmpty(),
];

export const menuItemValidation = [
  body('name').notEmpty().trim().isLength({ min: 3, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('category').notEmpty().trim(),
  body('price').isFloat({ min: 0 }),
  body('preparationTime').isInt({ min: 1, max: 180 }),
];

export const orderIdValidation = [
  param('orderId').notEmpty().trim(),
];
EOF

echo "✅ Utilities created"

# ============================================
# MIDDLEWARE
# ============================================

echo "Creating middleware..."

# Auth Middleware
cat > middleware/auth.middleware.ts << 'EOF'
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { verifyToken } from '../utils/jwt.helper';
import { docClient, TABLES } from '../utils/dynamodb.helper';

export const authenticateVendor = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided',
      });
    }

    const decoded = verifyToken(token);
    
    const result = await docClient.get({
      TableName: TABLES.VENDORS,
      Key: { vendorId: decoded.vendorId },
    }).promise();

    if (!result.Item) {
      return res.status(401).json({
        success: false,
        message: 'Vendor not found',
      });
    }

    req.vendor = result.Item as any;
    req.vendorId = decoded.vendorId;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

export const requireApproval = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.vendor?.approvalStatus !== 'APPROVED') {
    return res.status(403).json({
      success: false,
      message: 'Your account is pending approval',
      approvalStatus: req.vendor?.approvalStatus,
    });
  }
  next();
};
EOF

# Error Middleware
cat > middleware/error.middleware.ts << 'EOF'
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
  });
};
EOF

# Validation Middleware
cat > middleware/validation.middleware.ts << 'EOF'
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  
  next();
};
EOF

echo "✅ Middleware created"

echo ""
echo "✅ All utility and middleware files created successfully!"
echo "Note: Module files (auth, menu, orders, etc.) need to be created separately"
echo "This is Part 1 of the complete build"
EOF

chmod +x /mnt/user-data/outputs/vendor-api-complete/build-part1.sh
