const BookmarksService = {
  getAllBookmarks(knex) {
    return knex.select('*').from('bookmarks');
  },
  insertBookmark(knex, newArticle) {
    return knex
      .insert(newArticle)
      .into('bookmarks')
      .returning('*')
      .then(rows => {
        return rows[0];
      });
  },
  getById(knex, id) {
    return knex
      .select('*')
      .from('bookmarks')
      .where('id', id)
      .first();
  },
  deleteArticle(knex, id) {
    return knex('bookmarks')
      .where({ id })
      .delete();
  },
  updateArticle(knex, id, newBookMark) {
    return knex('bookmarks')
      .where({ id })
      .update(newBookMark);
  }
};

module.exports = BookmarksService;