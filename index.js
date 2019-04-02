function addArticle({title, description, timestamp}) {
    //create the heading
    const heading = document.createElement('h3')
    const headingText = document.createTextNode(title)
    heading.appendChild(headingText);

    //create the description
    const body = document.createElement('p')
    body.innerHTML = description

    //create the last revised footer
    const footer = document.createElement('p')
    footer.className = 'footer'
    const formattedDate = getFormattedDate(timestamp)
    const revisedText = document.createTextNode('Last revised on ' + formattedDate)
    footer.appendChild(revisedText)

    const article = document.createElement('article')
    article.appendChild(heading)
    article.appendChild(body)
    article.appendChild(footer)
    
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

// addArticle({
//     ns: 0,
//     title: 'Pizza',
//     pageid: 24768,
//     size: 50084,
//     wordcount: 5055,
//     snippet: "<span class='searchmatch'>pizza</span> chains List of <span class='searchmatch'>pizza</span> varieties by country Matzah <span class='searchmatch'>pizza</span> Italian cuisine <span class='searchmatch'>Pizza</span> cake <span class='searchmatch'>Pizza</span> cheese <span class='searchmatch'>Pizza</span> in China <span class='searchmatch'>Pizza</span> delivery <span class='searchmatch'>Pizza</span> farm <span class='searchmatch'>Pizza</span> saver",
//     timestamp: '2019-03-08T18:21:44Z'
// })

function findArticles (searchTerm) {
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
      addDescriptions(articles)
    };
    
    
    xhr.onerror = function() {
      console.log('network error')
    };


}

function  addDescriptions(articles) {
    const pageIds = articles.map(article => article.pageid)
    const pageIdsStr = pageIds.join('|')
    const xhr = new XMLHttpRequest();
    const apiUrl = 'https://en.wikipedia.org/w/api.php?'
    const options = `action=query&pageids=${pageIdsStr}&prop=extracts&exintro=true&explaintext=true&exsentences=3&format=json&origin=*`
    const urlToFetch = apiUrl + options

    xhr.open('GET', urlToFetch);
    
    xhr.send(); 
    
    xhr.onload = function() {
        if (xhr.status != 200) {
            console.log(`${xhr.status}: ${xhr.statusText}`);
            return;
        }
        const response = JSON.parse(xhr.response)
        console.log(response);
        const descriptions = pageIds.map(pageId => {
            return response.query.pages[pageId].extract
        })
        const articlesWithDescriptions = articles.map((article, index) => {
            return {...article, description: descriptions[index]}
        })
        console.log('articles with descriptions', articlesWithDescriptions)
        articlesWithDescriptions.forEach(article => addArticle(article))
        return
    };
    
    
    xhr.onerror = function() {
      console.log('network error')
    };
}

  findArticles('pizza')