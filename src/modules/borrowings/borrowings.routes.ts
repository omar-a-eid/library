import { Router } from 'express';
import { checkoutLimiter, exportLimiter } from '../../middleware/rateLimiter';
import { validate } from '../../middleware/validate';
import { BorrowingsController } from './borrowings.controller';
import {
  borrowingIdSchema,
  checkoutBookSchema,
  exportBorrowingsSchema,
  listBorrowingsSchema,
  myBooksSchema,
  returnBookSchema,
} from './borrowings.schema';

const router = Router();
const controller = new BorrowingsController();

router.post('/checkout', checkoutLimiter, validate(checkoutBookSchema), controller.checkoutBook);
router.post('/:id/return', validate(returnBookSchema), controller.returnBook);
router.get('/export', exportLimiter, validate(exportBorrowingsSchema), controller.exportBorrowings);
router.get('/overdue/export', exportLimiter, validate(exportBorrowingsSchema), controller.exportOverdueBorrowings);
router.get('/', validate(listBorrowingsSchema), controller.listBorrowings);
router.get('/overdue', validate(listBorrowingsSchema), controller.getOverdueBooks);
router.get('/borrower/:borrower_id/current', validate(myBooksSchema), controller.getMyCurrentBooks);
router.get('/:id', validate(borrowingIdSchema), controller.getBorrowing);

export default router;
