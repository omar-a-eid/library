import { Router } from 'express';
import { checkoutLimiter } from '../../middleware/rateLimiter';
import { validate } from '../../middleware/validate';
import { BorrowingsController } from './borrowings.controller';
import {
  borrowingIdSchema,
  checkoutBookSchema,
  listBorrowingsSchema,
  myBooksSchema,
  returnBookSchema,
} from './borrowings.schema';

const router = Router();
const controller = new BorrowingsController();

router.post('/checkout', checkoutLimiter, validate(checkoutBookSchema), controller.checkoutBook);
router.post('/:id/return', validate(returnBookSchema), controller.returnBook);
router.get('/', validate(listBorrowingsSchema), controller.listBorrowings);
router.get('/overdue', validate(listBorrowingsSchema), controller.getOverdueBooks);
router.get('/borrower/:borrower_id/current', validate(myBooksSchema), controller.getMyCurrentBooks);
router.get('/:id', validate(borrowingIdSchema), controller.getBorrowing);

export default router;
