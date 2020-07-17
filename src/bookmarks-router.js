const express = require('express');
const { v4: uuid } = require('uuid');
const logger = require('./logger');
const { bookmarks } = require('../test/bookmarks.fixtures');
const bookmarksRouter = express.Router();
const bodyParser = express.json();
const BookmarksService = require('./bookmarks-service');

bookmarksRouter
  .route('/bookmarks')
  .get((req, res, next) => {
    const db = req.app.get('db');
    BookmarksService.getAllBookmarks(db)
      .then(bookmarks => {
        res.json(bookmarks);
      })
      .catch(next);
  })
  .post(bodyParser, (req, res) => {
    const { title, content } = req.body;
    if (!title) {
      logger.error('Title is required');
      return res
        .status(400)
        .send('Invalid data');
    }

    if (!content) {
      logger.error('Content is required');
      return res
        .status(400)
        .send('Invalid data');
    }
    // get an id
    const id = uuid();

    const bookmark = {
      id,
      title,
      content
    };

    bookmarks.push(bookmark);
    logger.info(`Bookmarks with id ${id} created`);

    res
      .status(201)
      //.location(`http://localhost:8000/bookmarks/${id}`)
      .location(`/bookmarks/${id}`)
      .json(bookmark);

  });

bookmarksRouter
  .route('/bookmarks/:id')
  .get((req, res, next) => {
    const db = req.app.get('db');
    const { id } = req.params;
    BookmarksService.getById(db, id)
      .then(article => {
        if (!article) {
          logger.error(`Card with id ${id} not found.`);
          return res.status(404).json({
            error: { message: 'Bookmark doesn\'t exist' }
          });
        }
        res.json(article);
      })
      .catch(next);
  })
  .delete((req, res) => {
    const { id } = req.params;

    // eslint-disable-next-line eqeqeq
    const bookmarkIndex = bookmarks.findIndex(b => b.id == id);

    if (bookmarkIndex === -1) {
      logger.error(`Card with id ${id} not found.`);
      return res
        .status(404)
        .send('Not found');
    }

    bookmarks.splice(bookmarkIndex, 1);

    logger.info(`Bookmark with id ${id} deleted.`);

    res
      .status(204)
      .end();
  });

module.exports = bookmarksRouter;