import React, { useState, useEffect } from 'react';
import { request, gql } from 'graphql-request';

const HYGRAPH_ENDPOINT = 'https://ap-south-1.cdn.hygraph.com/content/cm0hslpc501qt07v10va9bely/master';

const QUERY = gql`
{
    startupPosts(first: 1000) {
      title
      slug
      datePublished
      content {
        html
      }
    }
  }
`;

const BlogPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null); // To track which dropdown is open

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await request(HYGRAPH_ENDPOINT, QUERY);
        setPosts(data.startupPosts);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch posts');
        setLoading(false);
        console.error('Error fetching posts:', err.response || err.message || err);
      }
    };
  
    fetchPosts();
  }, []);

  const toggleDropdown = (slug) => {
    if (openDropdown === slug) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(slug);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="blog-posts">
      <h1>Failed Indian Startups</h1>
      {posts.map((post) => (
        <div key={post.slug} className={`post ${openDropdown === post.slug ? 'open' : ''}`} style={{ marginBottom: '20px' }}>
          <div 
            onClick={() => toggleDropdown(post.slug)} 
            style={{ 
              cursor: 'pointer', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}
          >
            <h2>{post.title}</h2>
            <span>
              {openDropdown === post.slug ? '▼' : '▶'} {/* Dropdown icon */}
            </span>
          </div>
          {openDropdown === post.slug && (
            <>
              {/* <p className="date">Published on: {new Date(post.datePublished).toLocaleDateString()}</p> */}
              <div className="content" dangerouslySetInnerHTML={{ __html: post.content.html }} />
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default BlogPosts;
