import { Router } from 'express';
import { NftController } from '../../controllers/NftController';
import { authenticate } from '../../middlewares/auth';

const router = Router();
const nftController = new NftController();

// Public routes
router.get('/', nftController.list.bind(nftController));
router.get('/:id', nftController.getById.bind(nftController));

// Protected routes (require authentication)
router.use(authenticate);

// User's NFTs
router.get('/owner/:ownerId', nftController.getByOwner.bind(nftController));

// CRUD operations
router.post('/', nftController.create.bind(nftController));
router.put('/:id', nftController.update.bind(nftController));
router.delete('/:id', nftController.delete.bind(nftController));

// NFT specific operations
router.post('/:id/transfer', nftController.transferOwnership.bind(nftController));

export default router;
