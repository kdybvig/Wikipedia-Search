const initialState = {
    articles: [],
    sortBy: 'default',
    lengthFilter: 'any',
    dateFilter: 'any',
    searchTerm: 'JavaScript'
}

let state = {...initialState};

//Event listeners and handlers

//search-form submission
document.getElementById('search-form').addEventListener('submit', startSearch);

function startSearch(e){
    e.preventDefault();
    updateArticles([]); //remove current articles from HTML
    const searchTerm = document.getElementById('search-input').value;

    //& symbol inside search text confuses api and can cause errors
    const regex = new RegExp ('&', 'gi') ;
    newSearchTerm = searchTerm.replace(regex, ' and ');

    state.searchTerm = newSearchTerm;
    findArticles(newSearchTerm);
};

//sort-by select change
document.getElementById('sort-by').addEventListener('change', startSort);

function startSort(e) {
    const sortBy = e.target.value;
    state.sortBy = sortBy;
    updateArticles(state.articles); //update articles will sort articles using state.sortBy
};

//filter-length select change
document.getElementById('filter-length').addEventListener('change', changeLengthFilter);

function changeLengthFilter(e) {
    state.lengthFilter = e.target.value;
    updateArticles(state.articles); //update articles will filter articles
};

//filter-date select change
document.getElementById('filter-date').addEventListener('change', changeDateFilter);

function changeDateFilter(e) {
    state.dateFilter = e.target.value;
    updateArticles(state.articles); //update articles will filter articles
};


//Functions For Adding Articles to Search Results

function updateArticles(articles) {

    const sortedArticles = sortArticles(articles);
    
    state = {...state, articles: sortedArticles}; //update articles in state
    const searchResults = document.getElementById('search-results');

    while(searchResults.firstChild) {
        searchResults.removeChild(searchResults.firstChild);
    } //better performance than searchResults.innerHTML = ''

    const filteredArticles = filterByDate(filterByLength(sortedArticles)); // DO NOT update state with filtered articles
    filteredArticles.forEach(article=> addArticle(article));
}

function addArticle({title, description, timestamp, url}) {
    //create the heading of the article
    const headingLink = document.createElement('a');
    headingLink.href = url;
    headingLink.target = '_blank';
    const headingText = document.createTextNode(title);
    headingLink.appendChild(headingText);
    headingLink.className = 'article__heading-link';

    const heading = document.createElement('h3');
    heading.appendChild(headingLink);
    heading.className = 'article__heading';

    //create the body of the article
    const body = document.createElement('p');
    const bodyInnerHTML = highlightSearchTerms(state.searchTerm, description);
    body.innerHTML = bodyInnerHTML;
    body.className = 'article__body';

    //create the last revised footer
    const footer = document.createElement('p');
    const formattedDate = getFormattedDate(timestamp);
    const revisedText = document.createTextNode('Last revised on ' + formattedDate);
    footer.appendChild(revisedText);
    footer.className = 'article__footer';

    //append heading, body, and footer to article
    const article = document.createElement('article');
    article.appendChild(heading);
    article.appendChild(body);
    article.appendChild(footer);
    article.className='article';
    
    //add article to HTML document
    const searchResults = document.getElementById('search-results');
    searchResults.appendChild(article);
}

//utility functions for adding articles
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
    ];

    //isoDate format: yyyy-mm-dd
    const year = isoDate.slice(0,4);
    const month = months[Number(isoDate.slice(5,7))-1]; //subtract 1 from month to get correct array index
    const day = isoDate.slice(8,10);

    return `${month} ${day}, ${year}`
};

function highlightSearchTerms(searchTerm, text) {
    const searchTermArr = searchTerm.split(' ')
    searchTermArr.forEach(term => {
        term.trim();
        if(!term)return; //do not search for empty strings
        const regex = new RegExp(`\\b${term}\\b`, 'gi');

        //use callback function with match instead of using the searchTerm to keep capitalization of original word
        text = text.replace(regex, (match) => ` <span class='highlighted'>${match}</span> `);

        if(term === 'and') {
            const andRegex = new RegExp ('&', 'g')
            text = text.replace(andRegex, `<span class='highlighted'>${'&'}</span>`);
        } //highlight & symbols for queries with the word 'and' or symbol '&', e.g. "Ben & Jerry's"
    })
    return text;
}



//Filter and sort functions

function sortArticles(articles) {
    const { sortBy } = state;
    const sortOptions = {sortByProperty: '', reverse: false};
    
    switch(sortBy) {
        case 'default':
            sortOptions.sortByProperty = 'relevance';
            break;
        case 'alpha':
            sortOptions.sortByProperty = 'title';
            break;
        case 'reverse-alpha':
            sortOptions.sortByProperty = 'title';
            sortOptions.reverse = true;
            break;
        case 'recent':
            sortOptions.sortByProperty = 'lastRevisionTime';
            sortOptions.reverse = true; //sort from greatest (most recent) to least
            break;
        case 'reverse-recent':
            sortOptions.sortByProperty = 'lastRevisionTime';
            break;
        default: 
            console.error(`${sortBy} is not a sort by option.`);
    }

    const sortedArticles = articles.slice()

     sortedArticles.sort((article, nextArticle) => {
        const { sortByProperty, reverse } = sortOptions;
        
        const firstBigger = (
            sortByProperty === 'title' ?
                //change titles to uppercase before comparing
                article[sortByProperty].toUpperCase() > nextArticle[sortByProperty].toUpperCase() : 
                article[sortByProperty] > nextArticle[sortByProperty]
        )
        let comparison = 0; //if values are equal the current order will be maintained
        if(firstBigger){
            comparison = 1; //value 1 is larger, value 2 will be sorted first
        }  else if (!firstBigger) {
            comparison = -1; //value 2 is larger, value 1 will be sorted first
        }

        return reverse ? comparison * -1 : comparison; //if the reverse option is specified, larger values will be sorted first
    });
    return sortedArticles;
}

function filterByLength(articles) {
    const filter = state.lengthFilter;
    
    function isSelectedLength(wordcount) {
        if(filter === 'any') return true;
        if(filter === 'short') return wordcount < 2000;
        if(filter === 'medium') return wordcount >= 2000 && wordcount < 6000;
        if(filter === 'long') return wordcount >= 6000;
        console.error(filter + ' is not a length filter option.');
        return false
    }

    return articles.filter(article => isSelectedLength(article.wordcount));
}

function filterByDate(articles) {
    const filter = state.dateFilter;
    
    function isSufficientlyRecent(revisionTime) {
        function oneWeekAgo() {
            const date = new Date(); //today's date and time
            date.setDate(date.getDate() - 7); //set date to one week before today
            return date.getTime(); //change date to numerical value (milliseconds past 01/01/1970)          
        }
        function oneMonthAgo() {
            const date = new Date();
            date.setMonth(date.getMonth() - 1);
            return date.getTime();           
        }
        function oneYearAgo() {
            const date = new Date();
            date.setYear(date.getYear() - 1);
            return date.getTime();          
        }
        if(filter === 'any') return true
        if(filter === 'week') return revisionTime > oneWeekAgo(); //will return true if article was revised less than one week ago
        if(filter === 'month') return revisionTime > oneMonthAgo();
        if(filter === 'year') return revisionTime > oneYearAgo();
        console.error(filter + ' is not a date filter option.');
        return false
    }
    return articles.filter(article => isSufficientlyRecent(article.lastRevisionTime));
}


//API calls

function findArticles (searchTerm) {
    
    document.getElementsByClassName('error-text')[0].innerHTML = '' //remove error text
    addLoadingIcon()

    const xhr = new XMLHttpRequest();
    const apiUrl = 'https://en.wikipedia.org/w/api.php?';
    const nearMatch = document.getElementById('exact-match-checkbox').checked //near match for Wikipedia API is very nearly exact
    const options = `action=query&list=search&srsearch=${searchTerm}&srwhat=${nearMatch ? 'nearmatch' : 'text'}&utf8=&format=json&origin=*`;
    const urlToFetch = apiUrl + options;

    xhr.open('GET', urlToFetch);

    xhr.timeout = 3000;
    
    xhr.send(); 
    
    xhr.onload = function() {
      if (xhr.status != 200) {
        handleError(`${xhr.status}: ${xhr.statusText}`); //log error and display error in HTML
        return
      }

      //SUCCESS!!
      const response = JSON.parse(xhr.response)
      
      if(!response.query) {
        handleError('Network Error')
      } 

      const articles = response.query.search
      addArticleDetailsAndUpdate(articles)
    }
    
    xhr.onerror = function() {
        handleError('Network Error')
    }

    xhr.ontimeout = function() {
        handleError('Network request timed out.')
    }


}

function  addArticleDetailsAndUpdate(articles) {

    const pageIds = articles.map(article => article.pageid)
    const pageIdsStr = pageIds.join('|') //multiple pageids can be sent to wikipedia api when separated by '|' symbol
    
    const xhr = new XMLHttpRequest();
    const apiUrl = 'https://en.wikipedia.org/w/api.php?'

    //request extracts (short descriptions) and url information (to create link)
    const options = `action=query&pageids=${pageIdsStr}&prop=extracts|info&inprop=url&exintro=true&explaintext=true&exsentences=3&format=json&origin=*`
    const urlToFetch = apiUrl + options

    xhr.open('GET', urlToFetch);
    
    xhr.send(); 
    
    xhr.onload = function() {
        if (xhr.status != 200) {
            handleError(`${xhr.status}: ${xhr.statusText}`);
        }

        //SUCCESS!!
        const response = JSON.parse(xhr.response)
        const descriptions = pageIds.map(pageId => response.query.pages[pageId].extract)
        const urls = pageIds.map(pageId => response.query.pages[pageId].fullurl)

        const enhancedArticles = articles.map((article, index) => {
            const lastRevision = new Date (article.timestamp)
            const lastRevisionTime = lastRevision.getTime()
            return {...article, description: descriptions[index], url: urls[index], relevance: index, lastRevisionTime}
        })

        removeLoadingIcon() //remove loading gif before adding articles to HTML
        updateArticles(enhancedArticles)
        return
    };
    
    
    xhr.onerror = function() {
        handleError('Network Error')
    };
}


//utility functions for API calls

function handleError(error) {
    document.getElementsByClassName('error-text')[0].innerHTML = error
    console.error(error)
    removeLoadingIcon()
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

findArticles('JavaScript');