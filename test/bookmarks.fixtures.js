function makeBookmarksArray() {
  return [
    {
      id: 1,
      title: 'SomeUnimpressiveSite',
      url: 'https://www.unimpressed.com',
      rating: '1',
      description: 'this site is not impressive'
    },
    {
      id: 2,
      title: 'Thinkful',
      url: 'https://www.thinkful.com',
      rating: '5',
      description: 'Think outside the classroom'
    },
    {
      id: 3,
      title: 'Google',
      url: 'https://www.google.com',
      rating: '4',
      description: 'Where we find everything else'
    },
    {
      id: 4,
      title: 'MDN',
      url: 'https://developer.mozilla.org',
      rating: '5',
      description: 'The only place to find web documentation'
    }
  ];
}

module.exports = { makeBookmarksArray };