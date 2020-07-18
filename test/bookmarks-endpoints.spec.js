const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');
const supertest = require('supertest');
const { makeBookmarksArray, makeMaliciousBookmark } = require('./bookmarks.fixtures');

describe('Bookmarks Endpoints', function () {
  let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('clean the table', () => db('bookmarks').truncate());

  afterEach('cleanup', () => db('bookmarks').truncate());

  describe('Unauthorized requests', () => {
    const testBookmarks = makeBookmarksArray();

    beforeEach('insert bookmarks', () => {
      return db
        .into('bookmarks')
        .insert(testBookmarks);
    });

    it('responds with 401 Unauthorized for GET /bookmarks', () => {
      return supertest(app)
        .get('/api/bookmarks')
        .expect(401, { error: 'Unauthorized request' });
    });

    it('reaponds with 401 Unauthorized for POST /bookmarks', () => {
      return supertest(app)
        .post('/api/bookmarks')
        .expect(401, { error: 'Unauthorized request' });
    });

    it('responds with 401 Unauthorized for GET /bookmarks/:id', () => {
      const testBookmark = makeBookmarksArray()[0];
      return supertest(app)
        .get(`/api/bookmarks/${testBookmark.id}`)
        .expect(401, { error: 'Unauthorized request' });
    });

    it('responds with 401 Unauthorized for DELETE /bookmarks/:id', () => {
      const testBookmark = testBookmarks[0];
      return supertest(app)
        .delete(`/api/bookmarks/${testBookmark.id}`)
        .expect(401, { error: 'Unauthorized request' });
    });
  });

  describe('GET /api/bookmarks', () => {

    context('Given there are no bookmarks in the database', () => {
      it('responds with 200 and an empty array', () => {
        return supertest(app)
          .get('/api/bookmarks')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, []);
      });
    });

    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });

      it('responds with 200 and all the bookmarks', () => {
        return supertest(app)
          .get('/api/bookmarks')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, testBookmarks);
      });
    });

    context('Given an XSS attack bookmark', () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();

      beforeEach('insert malicious bookmark', () => {
        return db
          .into('bookmarks')
          .insert([maliciousBookmark]);
      });

      it('removes XSS attack content', () => {
        return supertest(app)
          .get('/api/bookmarks')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect(res => {
            expect(res.body[0].title).to.eql(expectedBookmark.title);
            expect(res.body[0].description).to.eql(expectedBookmark.description);
          });
      });
    });
  });

  describe('GET /api/bookmarks/:id', () => {

    context('Given there are no bookmarks in the database', () => {
      it('responds 404 when bookmark doesn\'t exist', () => {
        const testBookmark = makeBookmarksArray()[0];
        return supertest(app)
          .get(`/api/bookmarks/${testBookmark.id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: { message: 'Bookmark Not Found' }
          });
      });
    });

    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });

      it('responds 200 and returns the specified bookmark', () => {
        const testBookmark = testBookmarks[0];
        return supertest(app)
          .get(`/api/bookmarks/${testBookmark.id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, testBookmark);
      });
    });

    context('Given an XSS attakc bookmark', () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();

      beforeEach('insert malicious bookmark', () => {
        return db
          .into('bookmarks')
          .insert([maliciousBookmark]);
      });

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/bookmarks/${maliciousBookmark.id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect(res => {
            expect(res.body.title).to.eql(expectedBookmark.title);
            expect(res.body.description).to.eql(expectedBookmark.description);
          });
      });

    });
  });

  describe('DELETE /api/bookmarks/:id', () => {

    context('Given no bookmarks', () => {
      it('responds 404 whe bookmark doesn\'t exist', () => {
        return supertest(app)
          .delete('/api/bookmarks/123')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, { error: { message: 'Bookmark Not Found' } });
      });
    });

    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach('insert test bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });

      it('it removes the specified bookmark from the database', () => {
        const idToRemove = 1;
        const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove);
        return supertest(app)
          .delete(`/api/bookmarks/${idToRemove}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(204)
          .then(() =>
            supertest(app)
              .get('/api/bookmarks')
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedBookmarks)
          );
      });
    });

  });

  describe('POST /api/bookmarks', () => {
    const requiredFields = ['title', 'url', 'rating'];

    //make sure no requried fields are missing
    requiredFields.forEach(field => {
      const newBookmark = {
        title: 'SomeWebsite',
        url: 'https://www.youtube.com/watch?v=x0yNKU-tz1Y',
        rating: 5,
        description: 'some kinda description'
      };

      it(`responds with 400 missing ${field} if not supplied`, () => {
        delete newBookmark[field];

        return supertest(app)
          .post('/api/bookmarks')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send(newBookmark)
          .expect(400, {
            error: { message: `Missing '${field}' request in body` }
          });
      });
    });

    //check that items are posting
    it('creates an article, responding with 201 and the new bookmark', () => {
      const newBookmark = {
        title: 'SomeWebsite',
        url: 'https://www.youtube.com/watch?v=x0yNKU-tz1Y',
        rating: 5,
        description: 'some kinda description'
      };
      return supertest(app)
        .post('/api/bookmarks')
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .send(newBookmark)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newBookmark.title);
          expect(res.body.url).to.eql(newBookmark.url);
          expect(res.body.rating).to.eql(newBookmark.rating);
          expect(res.body.description).to.eql(newBookmark.description);
          expect(res.body).to.have.property('id');
          expect(res.headers.location).to.eql(`/api/bookmarks/${res.body.id}`);
        })
        .then(res =>
          supertest(app)
            .get(`/api/bookmarks/${res.body.id}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(res.body)
        );
    });

    //check for xss attack
    it('removes XSS attack content from response', () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();

      return supertest(app)
        .post('/api/bookmarks')
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .send(maliciousBookmark)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(expectedBookmark.title);
          expect(res.body.description).to.eql(expectedBookmark.description);
        });
    });
  });

  describe.only('PATCH /api/bookmarks/:id', () => {
    context('Given no articles', () => {
      it('responds with 404', () => {
        const bookmarkId = 123456;
        return supertest(app)
          .patch(`/api/bookmarks/${bookmarkId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, { error: { message: 'Bookmark Not Found' } });
      });
    });

    context('Given there are articles in the database', () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach('insert articles', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });

      it('responds with 204 and updates the bookmark', () => {
        const idToUpdate = 1;
        const updateBookmark = {
          title: 'SomeWebsite',
          url: 'https://www.youtube.com/watch?v=x0yNKU-tz1Y',
          rating: 5,
          description: 'some kinda description'
        };
        const expectedBookmark = {
          ...testBookmarks[idToUpdate - 1],
          ...updateBookmark
        };
        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send(updateBookmark)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/bookmarks/${idToUpdate}`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedBookmark)
          );
      });

      it('responds with 400 when no required fields supplied', () => {
        const idToUpdate = 1;
        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send({ irrelivantKey: 'goo' })
          .expect(400, {
            error: {
              message: 'Request body must contain either \'title\', \'url\', \'rating\', or \'description\''
            }
          });
      });

      it('responds with 204 when updating only a subset of fields', () => {
        const idToUpdate = 2;
        const updateBookmark = {
          title: 'updated bookmark title',
        };
        const expectedBookmark = {
          ...testBookmarks[idToUpdate - 1],
          ...updateBookmark
        }

        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send({
            ...updateBookmark,
            fieldToIgnore: 'shoudl not be in GET response'
          })
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/bookmarks/${idToUpdate}`)
              .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedBookmark)
          );
      });
    });
  });

});