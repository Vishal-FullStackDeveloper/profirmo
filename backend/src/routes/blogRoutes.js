// Public blog routes. Read-only — admin CRUD lives on /api/admin/blog/*.

const express = require('express');
const blogController = require('../controllers/blogController');

const router = express.Router();

router.get('/posts', blogController.listPosts);
router.get('/posts/:slug', blogController.getPost);
router.get('/categories', blogController.listCategories);
router.get('/tags', blogController.listTags);

module.exports = router;
