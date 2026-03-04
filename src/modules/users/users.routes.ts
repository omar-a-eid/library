import { Router } from 'express';
import { UsersController } from './users.controller';
import { validate } from '../../middleware/validate';
import {
  createUserSchema,
  updateUserSchemaValidation,
  listUsersSchema,
  userIdSchema
} from './users.schema';

const router = Router();
const controller = new UsersController();

router.post('/', validate(createUserSchema), controller.createUser);
router.get('/', validate(listUsersSchema), controller.listUsers);
router.get('/:id', validate(userIdSchema), controller.getUser);
router.put('/:id', validate(updateUserSchemaValidation), controller.updateUser);
router.delete('/:id', validate(userIdSchema), controller.deleteUser);

export default router;
