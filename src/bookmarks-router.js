const express = require('express');
const xss = require('xss');
const { v4: uuid } = require('uuid');
const logger = require('./logger');

const bookmarksRouter = express.Router();
const bodyParser = express.json();
const BookmarksService = require('./bookmarks-service');

const serializeBookmark = bookmark => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  url: bookmark.url,
  description: xss(bookmark.description),
  rating: Number(bookmark.rating),
});

bookmarksRouter
  .route('/api/bookmarks')
  .get((req, res, next) => {
    const db = req.app.get('db');
    BookmarksService.getAllBookmarks(db)
      .then(bookmarks => {
        res.json(bookmarks.map(serializeBookmark));
      })
      .catch(next);
  })
  .post(bodyParser, (req, res) => {
    for (const field of ['title', 'url', 'rating']) {
      if (!req.body[field]) {
        logger.error(`${field} is required`);
        return res.status(400).send({
          error: { message: `${field} is required` }
        });
      }
    }

    const { title, content } = req.body;

    // get an id
    const id = uuid();

    const bookmark = {
      id,
      title,
      content
    };

    //bookmarks.push(bookmark);
    logger.info(`Bookmarks with id ${id} created`);

    res
      .status(201)
      //.location(`http://localhost:8000/bookmarks/${id}`)
      .location(`/bookmarks/${id}`)
      .json(bookmark);

  });

bookmarksRouter
  .route('/api/bookmarks/:id')
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
    //const bookmarkIndex = bookmarks.findIndex(b => b.id == id);

    // if (bookmarkIndex === -1) {
    //   logger.error(`Card with id ${id} not found.`);
    //   return res
    //     .status(404)
    //     .send('Not found');
    // }

    //bookmarks.splice(bookmarkIndex, 1);

    logger.info(`Bookmark with id ${id} deleted.`);

    res
      .status(204)
      .end();
  });

module.exports = bookmarksRouter;