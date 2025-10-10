const express = require('express');
const {
  getContacts,
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
} = require('../controllers/chatController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

const ALLOWED_ROLES = ['super_admin', 'admin_hr', 'admin_outsource'];

router.use(protect);
router.use(authorize(...ALLOWED_ROLES));

router.get('/contacts', getContacts);
router.get('/conversations', getConversations);
router.post('/conversations', createConversation);
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/conversations/:conversationId/messages', sendMessage);

module.exports = router;
