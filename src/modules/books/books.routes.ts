import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { BooksController } from './books.controller';
import {
  bookIdSchema,
  createBookSchema,
  listBooksSchema,
  searchBooksSchema,
  updateBookSchema
} from './books.schema';

const router = Router();
const controller = new BooksController();

router.post('/', validate(createBookSchema), controller.createBook);
router.get('/', validate(listBooksSchema), controller.listBooks);
router.get('/search', validate(searchBooksSchema), controller.searchBooks);
router.get('/:id', validate(bookIdSchema), controller.getBook);
router.put('/:id', validate(updateBookSchema), controller.updateBook);
router.delete('/:id', validate(bookIdSchema), controller.deleteBook);

export default router;
