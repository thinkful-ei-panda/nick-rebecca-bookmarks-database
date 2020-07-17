function makeBookmarksArray() {
  return [
    {
      id: 1,
      title: 'SomeUnimpressiveSite',
      url: 'https://www.unimpressed.com',
      rating: 1,
      description: 'this site is not impressive'
    },
    {
      id: 2,
      title: 'Thinkful',
      url: 'https://www.thinkful.com',
      rating: 5,
      description: 'Think outside the classroom'
    },
    {
      id: 3,
      title: 'Google',
      url: 'https://www.google.com',
      rating: 4,
      description: 'Where we find everything else'
    },
    {
      id: 4,
      title: 'MDN',
      url: 'https://developer.mozilla.org',
      rating: 5,
      description: 'The only place to find web documentation'
    }
  ];
}

function makeMaliciousBookmark() {
  const maliciousBookmark = {
    id: 911,
    title: 'Naughty naughty very naughty <script>alert("xss");</script>',
    url: 'https://www.hackers.com',
    description: 'Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.',
    rating: 1,
  };
  const expectedBookmark = {
    ...makeMaliciousBookmark,
    title: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
    description: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
  };
  return {
    maliciousBookmark,
    expectedBookmark,
  }
}

module.exports = {
  makeBookmarksArray,
  makeMaliciousBookmark,
}