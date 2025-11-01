import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// ==================== Categories ====================

/**
 * GET /api/admin/categories
 * List all categories
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ categories });
  } catch (error) {
    console.error('List categories error:', error);
    res.status(500).json({
      error: 'خطأ في الخادم',
      message: error.message,
    });
  }
});

/**
 * POST /api/admin/categories
 * Create a new category
 */
router.post('/categories', async (req, res) => {
  try {
    const { nameAr, descriptionAr } = req.body;

    if (!nameAr) {
      return res.status(400).json({
        error: 'بيانات ناقصة',
        message: 'nameAr is required',
      });
    }

    const category = await prisma.category.create({
      data: {
        nameAr,
        descriptionAr: descriptionAr || null,
      },
    });

    res.status(201).json({
      message: 'تم إنشاء الفئة بنجاح',
      category,
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      error: 'خطأ في الخادم',
      message: error.message,
    });
  }
});

/**
 * PUT /api/admin/categories/:id
 * Update a category
 */
router.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nameAr, descriptionAr } = req.body;

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(nameAr && { nameAr }),
        ...(descriptionAr !== undefined && { descriptionAr }),
      },
    });

    res.json({
      message: 'تم تحديث الفئة بنجاح',
      category,
    });
  } catch (error) {
    console.error('Update category error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'الفئة غير موجودة',
        message: 'Category not found',
      });
    }
    res.status(500).json({
      error: 'خطأ في الخادم',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/admin/categories/:id
 * Delete a category
 */
router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.category.delete({
      where: { id },
    });

    res.json({
      message: 'تم حذف الفئة بنجاح',
    });
  } catch (error) {
    console.error('Delete category error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'الفئة غير موجودة',
        message: 'Category not found',
      });
    }
    res.status(500).json({
      error: 'خطأ في الخادم',
      message: error.message,
    });
  }
});

// ==================== Card Types ====================

/**
 * GET /api/admin/card-types
 * List all card types
 */
router.get('/card-types', async (req, res) => {
  try {
    const cardTypes = await prisma.cardType.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ cardTypes });
  } catch (error) {
    console.error('List card types error:', error);
    res.status(500).json({
      error: 'خطأ في الخادم',
      message: error.message,
    });
  }
});

/**
 * POST /api/admin/card-types
 * Create a new card type
 */
router.post('/card-types', async (req, res) => {
  try {
    const { nameAr, type } = req.body;

    if (!nameAr || !type) {
      return res.status(400).json({
        error: 'بيانات ناقصة',
        message: 'nameAr and type are required',
      });
    }

    const cardType = await prisma.cardType.create({
      data: {
        nameAr,
        type,
      },
    });

    res.status(201).json({
      message: 'تم إنشاء نوع البطاقة بنجاح',
      cardType,
    });
  } catch (error) {
    console.error('Create card type error:', error);
    res.status(500).json({
      error: 'خطأ في الخادم',
      message: error.message,
    });
  }
});

/**
 * PUT /api/admin/card-types/:id
 * Update a card type
 */
router.put('/card-types/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nameAr, type } = req.body;

    const cardType = await prisma.cardType.update({
      where: { id },
      data: {
        ...(nameAr && { nameAr }),
        ...(type && { type }),
      },
    });

    res.json({
      message: 'تم تحديث نوع البطاقة بنجاح',
      cardType,
    });
  } catch (error) {
    console.error('Update card type error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'نوع البطاقة غير موجود',
        message: 'Card type not found',
      });
    }
    res.status(500).json({
      error: 'خطأ في الخادم',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/admin/card-types/:id
 * Delete a card type
 */
router.delete('/card-types/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.cardType.delete({
      where: { id },
    });

    res.json({
      message: 'تم حذف نوع البطاقة بنجاح',
    });
  } catch (error) {
    console.error('Delete card type error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'نوع البطاقة غير موجود',
        message: 'Card type not found',
      });
    }
    res.status(500).json({
      error: 'خطأ في الخادم',
      message: error.message,
    });
  }
});

// ==================== Cards ====================

/**
 * GET /api/admin/cards
 * List all cards
 */
router.get('/cards', async (req, res) => {
  try {
    const { categoryId, cardTypeId } = req.query;

    const cards = await prisma.card.findMany({
      where: {
        ...(categoryId && { categoryId }),
        ...(cardTypeId && { cardTypeId }),
      },
      include: {
        category: {
          select: {
            id: true,
            nameAr: true,
          },
        },
        cardType: {
          select: {
            id: true,
            nameAr: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ cards });
  } catch (error) {
    console.error('List cards error:', error);
    res.status(500).json({
      error: 'خطأ في الخادم',
      message: error.message,
    });
  }
});

/**
 * POST /api/admin/cards
 * Create a new card
 */
router.post('/cards', async (req, res) => {
  try {
    const { textAr, categoryId, cardTypeId } = req.body;

    if (!textAr || !categoryId || !cardTypeId) {
      return res.status(400).json({
        error: 'بيانات ناقصة',
        message: 'textAr, categoryId, and cardTypeId are required',
      });
    }

    const card = await prisma.card.create({
      data: {
        textAr,
        categoryId,
        cardTypeId,
      },
      include: {
        category: {
          select: {
            id: true,
            nameAr: true,
          },
        },
        cardType: {
          select: {
            id: true,
            nameAr: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'تم إنشاء البطاقة بنجاح',
      card,
    });
  } catch (error) {
    console.error('Create card error:', error);
    res.status(500).json({
      error: 'خطأ في الخادم',
      message: error.message,
    });
  }
});

/**
 * PUT /api/admin/cards/:id
 * Update a card
 */
router.put('/cards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { textAr, categoryId, cardTypeId } = req.body;

    const card = await prisma.card.update({
      where: { id },
      data: {
        ...(textAr && { textAr }),
        ...(categoryId && { categoryId }),
        ...(cardTypeId && { cardTypeId }),
      },
      include: {
        category: {
          select: {
            id: true,
            nameAr: true,
          },
        },
        cardType: {
          select: {
            id: true,
            nameAr: true,
          },
        },
      },
    });

    res.json({
      message: 'تم تحديث البطاقة بنجاح',
      card,
    });
  } catch (error) {
    console.error('Update card error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'البطاقة غير موجودة',
        message: 'Card not found',
      });
    }
    res.status(500).json({
      error: 'خطأ في الخادم',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/admin/cards/:id
 * Delete a card
 */
router.delete('/cards/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.card.delete({
      where: { id },
    });

    res.json({
      message: 'تم حذف البطاقة بنجاح',
    });
  } catch (error) {
    console.error('Delete card error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'البطاقة غير موجودة',
        message: 'Card not found',
      });
    }
    res.status(500).json({
      error: 'خطأ في الخادم',
      message: error.message,
    });
  }
});

// ==================== Questions ====================

/**
 * GET /api/admin/questions
 * List all questions
 */
router.get('/questions', async (req, res) => {
  try {
    const { categoryId, difficulty } = req.query;

    const questions = await prisma.question.findMany({
      where: {
        ...(categoryId && { categoryId }),
        ...(difficulty && { difficulty }),
      },
      include: {
        category: {
          select: {
            id: true,
            nameAr: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ questions });
  } catch (error) {
    console.error('List questions error:', error);
    res.status(500).json({
      error: 'خطأ في الخادم',
      message: error.message,
    });
  }
});

/**
 * POST /api/admin/questions
 * Create a new question
 */
router.post('/questions', async (req, res) => {
  try {
    const { textAr, categoryId, difficulty } = req.body;

    if (!textAr || !categoryId) {
      return res.status(400).json({
        error: 'بيانات ناقصة',
        message: 'textAr and categoryId are required',
      });
    }

    const question = await prisma.question.create({
      data: {
        textAr,
        categoryId,
        difficulty: difficulty || null,
      },
      include: {
        category: {
          select: {
            id: true,
            nameAr: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'تم إنشاء السؤال بنجاح',
      question,
    });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({
      error: 'خطأ في الخادم',
      message: error.message,
    });
  }
});

/**
 * PUT /api/admin/questions/:id
 * Update a question
 */
router.put('/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { textAr, categoryId, difficulty } = req.body;

    const question = await prisma.question.update({
      where: { id },
      data: {
        ...(textAr && { textAr }),
        ...(categoryId && { categoryId }),
        ...(difficulty !== undefined && { difficulty }),
      },
      include: {
        category: {
          select: {
            id: true,
            nameAr: true,
          },
        },
      },
    });

    res.json({
      message: 'تم تحديث السؤال بنجاح',
      question,
    });
  } catch (error) {
    console.error('Update question error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'السؤال غير موجود',
        message: 'Question not found',
      });
    }
    res.status(500).json({
      error: 'خطأ في الخادم',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/admin/questions/:id
 * Delete a question
 */
router.delete('/questions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.question.delete({
      where: { id },
    });

    res.json({
      message: 'تم حذف السؤال بنجاح',
    });
  } catch (error) {
    console.error('Delete question error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'السؤال غير موجود',
        message: 'Question not found',
      });
    }
    res.status(500).json({
      error: 'خطأ في الخادم',
      message: error.message,
    });
  }
});

// ==================== Power Cards ====================

/**
 * GET /api/admin/power-cards
 * List all power cards
 */
router.get('/power-cards', async (req, res) => {
  try {
    const powerCards = await prisma.powerCard.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ powerCards });
  } catch (error) {
    console.error('List power cards error:', error);
    res.status(500).json({
      error: 'خطأ في الخادم',
      message: error.message,
    });
  }
});

/**
 * POST /api/admin/power-cards
 * Create a new power card
 */
router.post('/power-cards', async (req, res) => {
  try {
    const { nameAr, code, descriptionAr, icon, active } = req.body;

    if (!nameAr || !code || !descriptionAr) {
      return res.status(400).json({
        error: 'بيانات ناقصة',
        message: 'nameAr, code, and descriptionAr are required',
      });
    }

    const powerCard = await prisma.powerCard.create({
      data: {
        nameAr,
        code,
        descriptionAr,
        icon: icon || null,
        active: active !== undefined ? active : true,
      },
    });

    res.status(201).json({
      message: 'تم إنشاء بطاقة القوة بنجاح',
      powerCard,
    });
  } catch (error) {
    console.error('Create power card error:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'الكود موجود بالفعل',
        message: 'Power card code already exists',
      });
    }
    res.status(500).json({
      error: 'خطأ في الخادم',
      message: error.message,
    });
  }
});

/**
 * PUT /api/admin/power-cards/:id
 * Update a power card
 */
router.put('/power-cards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nameAr, code, descriptionAr, icon, active } = req.body;

    const powerCard = await prisma.powerCard.update({
      where: { id },
      data: {
        ...(nameAr && { nameAr }),
        ...(code && { code }),
        ...(descriptionAr && { descriptionAr }),
        ...(icon !== undefined && { icon }),
        ...(active !== undefined && { active }),
      },
    });

    res.json({
      message: 'تم تحديث بطاقة القوة بنجاح',
      powerCard,
    });
  } catch (error) {
    console.error('Update power card error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'بطاقة القوة غير موجودة',
        message: 'Power card not found',
      });
    }
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'الكود موجود بالفعل',
        message: 'Power card code already exists',
      });
    }
    res.status(500).json({
      error: 'خطأ في الخادم',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/admin/power-cards/:id
 * Delete a power card
 */
router.delete('/power-cards/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.powerCard.delete({
      where: { id },
    });

    res.json({
      message: 'تم حذف بطاقة القوة بنجاح',
    });
  } catch (error) {
    console.error('Delete power card error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'بطاقة القوة غير موجودة',
        message: 'Power card not found',
      });
    }
    res.status(500).json({
      error: 'خطأ في الخادم',
      message: error.message,
    });
  }
});

// ==================== Vote Override ====================

/**
 * POST /api/admin/vote-override
 * Admin can manually override vote acceptance/rejection
 */
router.post('/vote-override', async (req, res) => {
  try {
    const { roomId, turnId, accept } = req.body;

    if (!roomId || !turnId || accept === undefined) {
      return res.status(400).json({
        error: 'بيانات ناقصة',
        message: 'roomId, turnId, and accept are required',
      });
    }

    // This will be handled via Socket.IO in the game logic
    // For now, just acknowledge the override request
    res.json({
      message: accept ? 'تم قبول الإجابة يدوياً' : 'تم رفض الإجابة يدوياً',
      roomId,
      turnId,
      accept,
    });
  } catch (error) {
    console.error('Vote override error:', error);
    res.status(500).json({
      error: 'خطأ في الخادم',
      message: error.message,
    });
  }
});

export default router;

