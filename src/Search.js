import React, { useState, useRef, useEffect } from 'react';
import DOMPurify from 'dompurify'; // To sanitize HTML
import './search.css';
import { analytics } from './firebase';
import { logEvent } from "firebase/analytics";
import { OPENAI_API_KEY, JINA_API_KEY } from './secrets';


const Search = () => {
  const [query, setQuery] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerHeight < 500) {
        document.querySelector('.search-input-container').style.position = 'absolute';
        document.querySelector('.search-input-container').style.bottom = '50px';
      } else {
        document.querySelector('.search-input-container').style.position = 'relative';
        document.querySelector('.search-input-container').style.bottom = '0';
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) {
      setDescription('Please enter a search query.');
      return;
    }
    document.activeElement.blur();
    logEvent(analytics, 'search_click', {
      query: query,
    });
    setLoading(true);
    setDescription('');
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    try {
      const modifiedQuery = query
        .toLowerCase()
        .replace(/ /g, '%20')
        .concat('%3F');

      const jinaResponse = await fetch(`https://s.jina.ai/${modifiedQuery}`, {
        headers: {
          'Authorization': 'Bearer ' + JINA_API_KEY
        }
      });
      const jinaData = await jinaResponse.text();

      const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + OPENAI_API_KEY
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: `Include source links in the respective data in your response. Provide a bulleted but detailed response: ${query}\n\n${jinaData}`
            }
          ],
          max_tokens: 16384
        })
      });

      const openAiData = await openAiResponse.json();

      // Process the content using custom regex
      const cleanedDescription = openAiData.choices[0].message.content
        .replace(/(?:^|\.\s*)-\s*/g, match => `<br><br>• `) // Add empty line before bullet points
        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">[$1]</a>')
        .trim();

      // Sanitize the HTML to prevent XSS
      const sanitizedHtml = DOMPurify.sanitize(cleanedDescription);

      setDescription(sanitizedHtml);
      setSearchHistory(prevHistory => [...prevHistory, {
        query: query,
        result: sanitizedHtml
      }]);
      setQuery('');

      // Scroll down a little after the description is fetched
      window.scrollBy({
        top: 500, // Adjust this value to control how far it scrolls
        left: 0,
        behavior: 'smooth'
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      setDescription('There was an error processing your request.');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkClick = (event) => {
    if (event.target.tagName === 'A') {
      event.preventDefault();
      window.open(event.target.href, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="search-container">
      <div className="search-history">
        {searchHistory.map((item, index) => (
          <div key={index} className="search-item">
            <h3 className="query-text">Query: {item.query}</h3>
            <div
              className="description-container"
              dangerouslySetInnerHTML={{ __html: item.result }}
              onClick={handleLinkClick}
            />
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="search-input-container">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault(); // Prevent default Enter behavior
              handleSearch();
            }
          }}
          placeholder="Ask anything..."
          className="search-input"
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? <div className="loader"></div> : 'Search'}
        </button>
      </div>
    </div>
  );
};

export default Search;
