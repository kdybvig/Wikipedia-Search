const initialState = {
    articles: [],
    sortBy: 'default',
    lengthFilter: 'any',
    dateFilter: 'any'
}

let state = {...initialState}


//Event listeners and handlers
document.getElementById('search-form').addEventListener('submit', startSearch)

function startSearch(e){
    e.preventDefault()
    updateArticles([])
    const searchTerm = document.getElementById('search-input').value
    findArticles(searchTerm)
}

document.getElementById('sort-by').addEventListener('change', startSort)

function startSort(e) {
    const sortBy = e.target.value
    state.sortBy = sortBy
    sortArticles()
}

document.getElementById('filter-length').addEventListener('change', changeLengthFilter)

function changeLengthFilter(e) {
    state.lengthFilter = e.target.value
    updateArticles(state.articles)
}

document.getElementById('filter-date').addEventListener('change', changeDateFilter)

function changeDateFilter(e) {
    state.dateFilter = e.target.value
    updateArticles(state.articles)
}



function updateArticles(articles) {

    removeLoadingIcon()

    //update articles in state
    state = {...state, articles}

    const searchResults = document.getElementById('search-results');
    //better performance than searchResults.innerHTML = ''
    while(searchResults.firstChild) {
        searchResults.removeChild(searchResults.firstChild);
    }

    const filteredArticles = filterByDate(filterByLength(articles))

    console.log(filteredArticles)

    filteredArticles.forEach(article=> addArticle(article))
}

function addArticle({title, description, timestamp, url}) {
    //create the heading
    const headingLink = document.createElement('a')
    headingLink.href = url
    headingLink.target = '_blank'
    const headingText = document.createTextNode(title)
    headingLink.appendChild(headingText);
    headingLink.className = 'article__heading-link'

    const heading = document.createElement('h3')
    heading.appendChild(headingLink);
    heading.className = 'article__heading'

    //create the description
    const body = document.createElement('p')
    const bodyText = document.createTextNode(description)
    body.appendChild(bodyText)
    body.className = 'article__body'

    //create the last revised footer
    const footer = document.createElement('p')
    const formattedDate = getFormattedDate(timestamp)
    const revisedText = document.createTextNode('Last revised on ' + formattedDate)
    footer.appendChild(revisedText)
    footer.className = 'article__footer'

    const article = document.createElement('article')
    article.appendChild(heading)
    article.appendChild(body)
    article.appendChild(footer)
    article.className='article'
    
    const searchResults = document.getElementById('search-results')
    searchResults.appendChild(article)
}

function getFormattedDate(isoDate) {
    const months = [
        'January', 
        'February', 
        'March', 
        'April', 
        'May', 
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
    ]

    const year = isoDate.slice(0,4)
    const month = months[Number(isoDate.slice(5,7))]
    const day = isoDate.slice(8,10)

    return `${month} ${day}, ${year}`
}


//Filter and sort functions

function sortArticles() {
    const {sortBy} = state
    const options = {sortByProperty: '', reverse: false}

    switch(sortBy) {
        case 'default':
            options.sortByProperty = 'relevance';
            break;
        case 'alpha':
            options.sortByProperty = 'title';
            break;
        case 'reverse-alpha':
            options.sortByProperty = 'title';
            options.reverse = true;
            break;
        case 'recent':
            options.sortByProperty = 'lastRevisionTime';
            options.reverse = true; //sort from greatest (most recent) to least
            break;
        case 'reverse-recent':
            options.sortByProperty = 'lastRevisionTime';
            break;
        default: 
            console.error(`${sortBy} is not a sort by option.`)
    }

    const sortedArticles = [...state.articles].sort((article, nextArticle) => {
        const { sortByProperty, reverse } = options
        let comparison = 0;
        if(article[sortByProperty] > nextArticle[sortByProperty]){
            comparison = 1
        }  else if (article[sortByProperty] < nextArticle[sortByProperty]) {
            comparison = -1
        }

        return reverse ? comparison * -1 : comparison
    })

    updateArticles(sortedArticles)

}

function filterByLength(articles) {
    const filter = state.lengthFilter
    console.log(filter)
    
    function isSelectedLength(wordcount) {
        if(filter === 'any') return true
        if(filter === 'short') return wordcount < 2000
        if(filter === 'medium') return wordcount >= 2000 && wordcount < 6000
        if(filter === 'long') return wordcount >= 6000
        console.log(filter + ' is not a length filter option.')
        return false
    }

    return articles.filter(article => isSelectedLength(article.wordcount))
}

function filterByDate(articles) {
    const filter = state.dateFilter
    
    function isSufficientlyRecent(revisionTime) {
        function oneWeekAgo() {
            const date = new Date()
            date.setDate(date.getDate() - 7)
            return date.getTime()            
        }
        function oneMonthAgo() {
            const date = new Date()
            date.setMonth(date.getMonth() - 1)
            return date.getTime()            
        }
        function oneYearAgo() {
            const date = new Date()
            date.setYear(date.getYear() - 1)
            return date.getTime()            
        }
        if(filter === 'any') return true
        if(filter === 'week') return revisionTime > oneWeekAgo()
        if(filter === 'month') return revisionTime > oneMonthAgo()
        if(filter === 'year') return revisionTime > oneYearAgo()
        console.log(filter + ' is not a date filter option.')
        return false
    }
    return articles.filter(article => isSufficientlyRecent(article.lastRevisionTime))
}


//API calls

function findArticles (searchTerm) {
    addLoadingIcon()
    const xhr = new XMLHttpRequest();
    const apiUrl = 'https://en.wikipedia.org/w/api.php?'
    const options = `action=query&list=search&srsearch=${searchTerm}&utf8=&format=json&origin=*`
    const urlToFetch = apiUrl + options

    xhr.open('GET', urlToFetch);
    
    xhr.send(); 
    
    xhr.onload = function() {
      if (xhr.status != 200) {
        console.log(`${xhr.status}: ${xhr.statusText}`);
        return;
      }
      const response = JSON.parse(xhr.response)
      const articles = response.query.search
      console.log('articles', articles)
      addDescriptionsAndUrls(articles)
    };
    
    
    xhr.onerror = function() {
        console.error('Network error')
    };


}

function  addDescriptionsAndUrls(articles) {
    const pageIds = articles.map(article => article.pageid)
    const pageIdsStr = pageIds.join('|')
    const xhr = new XMLHttpRequest();
    const apiUrl = 'https://en.wikipedia.org/w/api.php?'
    const options = `action=query&pageids=${pageIdsStr}&prop=extracts|info&inprop=url&exintro=true&explaintext=true&exsentences=3&format=json&origin=*`
    const urlToFetch = apiUrl + options

    xhr.open('GET', urlToFetch);
    
    xhr.send(); 
    
    xhr.onload = function() {
        if (xhr.status != 200) {
            console.error(`${xhr.status}: ${xhr.statusText}`);
            return;
        }
        const response = JSON.parse(xhr.response)
        const descriptions = pageIds.map(pageId => response.query.pages[pageId].extract)
        const urls = pageIds.map(pageId => response.query.pages[pageId].fullurl)

        const enhancedArticles = articles.map((article, index) => {
            const lastRevision = new Date (article.timestamp)
            const lastRevisionTime = lastRevision.getTime()
            return {...article, description: descriptions[index], url: urls[index], relevance: index, lastRevisionTime}
        })
        console.log('articles with descriptions', enhancedArticles)
        updateArticles(enhancedArticles)
        return
    };
    
    
    xhr.onerror = function() {
      console.log('network error')
    };
}

function addLoadingIcon() {
    const loading = document.createElement('img')
    loading.src = 'loading.gif'
    loading.id = 'loading-gif'
    document.getElementById('search-results').append(loading)
}

function removeLoadingIcon() {
    const loadingIcon = document.getElementById('loading-gif')
    if(loadingIcon) loadingIcon.remove()
}

findArticles('javascript')