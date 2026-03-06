import { Request, Response } from 'express';
import { pool } from '../../config/database';

export const healthCheck = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check database connection
    await pool.query('SELECT 1');
    
    res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: {
        message: 'Service unhealthy',
        database: 'disconnected',
      },
    });
  }
};
