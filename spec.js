const testArticles = [
    {
      title: 'JavaScript',
      pageid: 9845,
      size: 105464,
      wordcount: 10983,
      timestamp: '2019-03-31T09:48:18Z',
      description: 'JavaScript (), often abbreviated as JS, is a high-level, interpreted programming language that conforms to the ECMAScript specification. It is a programming language that is characterized as dynamic, weakly typed, prototype-based and multi-paradigm.\nAlongside HTML and CSS, JavaScript is one of the core technologies of the World Wide Web.',
      url: 'https://en.wikipedia.org/wiki/JavaScript',
      relevance: 0,
      lastRevisionTime: 1554025698000
    },
    {
      title: 'React (JavaScript library)',
      pageid: 44926137,
      wordcount: 2561,
      timestamp: '2019-03-27T12:11:54Z',
      description: 'React (also known as React.js or ReactJS) is a JavaScript library for building user interfaces. It is maintained by Facebook and a community of individual developers and companies.React can be used as a base in the development of single-page or mobile applications.',
      url: 'https://en.wikipedia.org/wiki/React_(JavaScript_library)',
      relevance: 1,
      lastRevisionTime: 1553688714000
    },
    {
      title: 'List of JavaScript libraries',
      pageid: 10369986,
      wordcount: 231,
      timestamp: '2019-03-31T17:51:01Z',
      description: 'This is a list of notable JavaScript libraries.',
      url: 'https://en.wikipedia.org/wiki/List_of_JavaScript_libraries',
      relevance: 2,
      lastRevisionTime: 1554054661000
    },
    {
      title: 'JavaScript library',
      pageid: 10081669,
      wordcount: 295,
      timestamp: '2018-01-15T16:21:30Z',
      description: 'A JavaScript library is a library of pre-written JavaScript which allows for easier development of JavaScript-based applications, especially for AJAX and other web-centric technologies.',
      url: 'https://en.wikipedia.org/wiki/JavaScript_library',
      relevance: 3,
      lastRevisionTime: 1516033290000
    },
    {
      title: 'Rhino (JavaScript engine)',
      pageid: 344767,
      wordcount: 566,
      timestamp: '2019-03-18T13:22:29Z',
      description: 'Rhino is a JavaScript engine written fully in Java and managed by the Mozilla Foundation as open source software. It is separate from the SpiderMonkey engine, which is also developed by Mozilla, but written in C++ and used in Mozilla Firefox.',
      url: 'https://en.wikipedia.org/wiki/Rhino_(JavaScript_engine)',
      relevance: 4,
      lastRevisionTime: 1552915349000
    }
  ]

const searchResultsElement = document.getElementById('search-results')

describe("Updating Articles", function () {
    it("should add articles to state", function () {
        updateArticles(testArticles)
        expect(state.articles.length).toBe(5)
    });

    it("should append articles to the div with id = search-results", function () {
        updateArticles(testArticles)
        const numberOfSearchResultChildren = searchResultsElement.childElementCount
        expect(numberOfSearchResultChildren).toBe(5)
    });
})

describe('Sorting and Filtering', function () {
    updateArticles(testArticles)

    it("should sort the articles when the user changes the sort by selection", function () {
        const sortBySelect = document.getElementById('sort-by')
        sortBySelect.value = 'alpha'
        const changeEvent = new Event('change')
        sortBySelect.dispatchEvent(changeEvent)

        const firstTitle = state.articles[0].title
        expect(firstTitle).toBe('JavaScript')
        
        const firstTitleInHTML = document.getElementsByClassName('article__heading-link')[0].innerText
        expect(firstTitleInHTML).toBe('JavaScript')

        sortBySelect.value = 'reverse-recent'
        sortBySelect.dispatchEvent(changeEvent)
        const newFirstTitle = state.articles[0].title
        expect(newFirstTitle).toBe('JavaScript library')
        const newFirstTitleInHTML = document.getElementsByClassName('article__heading-link')[0].innerText
        expect(newFirstTitleInHTML).toBe('JavaScript library')
        
    })

    it("should filter the articles by length", function() {
        state = {...initialState}
        updateArticles(testArticles)
        const lengthFilter = document.getElementById('filter-length')
        lengthFilter.value = 'short'
        const changeEvent = new Event('change')
        lengthFilter.dispatchEvent(changeEvent)

        const numberOfSearchResultChildren = searchResultsElement.childElementCount
        expect(numberOfSearchResultChildren).toBe(3)
    })
});


describe('API Tests', function() {
    updateArticles([])
    it("should be able to fetch articles from wikipedia", async function() {
        state = {...initialState}
        updateArticles([])
        const numberOfSearchResultChildren = searchResultsElement.childElementCount
        expect(numberOfSearchResultChildren).toBe(0)
        
        const searchInput = document.getElementById('search-input')
        const searchForm = document.getElementById('search-form')
        searchInput.value = 'pizza'
        const submitEvent = new Event('submit')
        searchForm.dispatchEvent(submitEvent)

        const delayMe = await(delay(3000))
        const newNumberOfSearchResultChildren = searchResultsElement.childElementCount
        expect(newNumberOfSearchResultChildren).not.toBe(0)
    })   
})


  
  function delay(time) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  }
