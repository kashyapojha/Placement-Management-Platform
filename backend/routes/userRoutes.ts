import { Router } from 'express';
import { 
  getUsers, 
  updateUser, 
  updateUserRole, 
  createUser, 
  deleteUser,
  uploadAvatarImage,
  enhanceBio
} from '../controllers/userController.js';
import { uploadAvatar } from '../config/multer.js';

const router = Router();

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.put('/:id/role', updateUserRole);
router.delete('/:id', deleteUser);
router.post('/upload-avatar', uploadAvatar.single('avatar'), uploadAvatarImage);
router.post('/enhance-bio', enhanceBio);

export default router;
