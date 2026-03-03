import { Router } from 'express';
import { AuthorsController } from './authors.controller';
import { validate } from '../../middleware/validate';
import {
  createAuthorSchema,
  updateAuthorSchema,
  listAuthorsSchema,
  authorIdSchema
} from './authors.schema';

const router = Router();
const controller = new AuthorsController();

router.post('/', validate(createAuthorSchema), controller.createAuthor);
router.get('/', validate(listAuthorsSchema), controller.listAuthors);
router.get('/:id', validate(authorIdSchema), controller.getAuthor);
router.put('/:id', validate(updateAuthorSchema), controller.updateAuthor);
router.delete('/:id', validate(authorIdSchema), controller.deleteAuthor);

export default router;
