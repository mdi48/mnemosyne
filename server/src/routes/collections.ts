import express from 'express'
import { PrismaClient } from '../generated/prisma/client'
import { authenticate } from '../middleware/auth'

const router = express.Router()
const prisma = new PrismaClient()

// Get all collections for the authenticated user
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId
    
    const collections = await prisma.collection.findMany({
      where: { userId },
      include: {
        quotes: {
          include: {
            quote: true
          }
        },
        _count: {
          select: { quotes: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ success: true, data: collections })
  } catch (error) {
    console.error('Error fetching collections:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch collections' })
  }
})

// Create a new collection
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId
    const { name, description } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Collection name is required' })
    }

    const collection = await prisma.collection.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        userId
      }
    })

    res.json({ success: true, data: collection })
  } catch (error) {
    console.error('Error creating collection:', error)
    res.status(500).json({ success: false, error: 'Failed to create collection' })
  }
})

// Update a collection
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId
    const { id } = req.params
    const { name, description } = req.body

    // Verify ownership
    const collection = await prisma.collection.findFirst({
      where: { id, userId }
    })

    if (!collection) {
      return res.status(404).json({ success: false, error: 'Collection not found' })
    }

    const updated = await prisma.collection.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null })
      }
    })

    res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error updating collection:', error)
    res.status(500).json({ success: false, error: 'Failed to update collection' })
  }
})

// Delete a collection
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId
    const { id } = req.params

    // Verify ownership
    const collection = await prisma.collection.findFirst({
      where: { id, userId }
    })

    if (!collection) {
      return res.status(404).json({ success: false, error: 'Collection not found' })
    }

    await prisma.collection.delete({
      where: { id }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting collection:', error)
    res.status(500).json({ success: false, error: 'Failed to delete collection' })
  }
})

// Add a quote to a collection
router.post('/:id/quotes', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId
    const { id } = req.params
    const { quoteId } = req.body

    if (!quoteId) {
      return res.status(400).json({ success: false, error: 'Quote ID is required' })
    }

    // Verify collection ownership
    const collection = await prisma.collection.findFirst({
      where: { id, userId }
    })

    if (!collection) {
      return res.status(404).json({ success: false, error: 'Collection not found' })
    }

    // Check if quote exists
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId }
    })

    if (!quote) {
      return res.status(404).json({ success: false, error: 'Quote not found' })
    }

    // Add quote to collection (unique constraint will prevent duplicates)
    const collectionQuote = await prisma.collectionQuote.create({
      data: {
        collectionId: id,
        quoteId
      }
    })

    res.json({ success: true, data: collectionQuote })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, error: 'Quote already in collection' })
    }
    console.error('Error adding quote to collection:', error)
    res.status(500).json({ success: false, error: 'Failed to add quote to collection' })
  }
})

// Remove a quote from a collection
router.delete('/:id/quotes/:quoteId', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId
    const { id, quoteId } = req.params

    // Verify collection ownership
    const collection = await prisma.collection.findFirst({
      where: { id, userId }
    })

    if (!collection) {
      return res.status(404).json({ success: false, error: 'Collection not found' })
    }

    // Remove quote from collection
    await prisma.collectionQuote.deleteMany({
      where: {
        collectionId: id,
        quoteId
      }
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Error removing quote from collection:', error)
    res.status(500).json({ success: false, error: 'Failed to remove quote from collection' })
  }
})

export default router
