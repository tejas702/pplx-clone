import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { getDocs, collection, setDoc, doc } from "firebase/firestore";
import './Youtube.css';

const Youtube = () => {
    const [videos, setVideos] = useState([]);
    const [filteredVideos, setFilteredVideos] = useState([]);
    const [playingVideo, setPlayingVideo] = useState(null);
    const [error, setError] = useState(null);
    const [newVideoLink, setNewVideoLink] = useState('');
    const [toastMessage, setToastMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "videos"));
                const videoArray = querySnapshot.docs.map(doc => ({
                    videoTitle: doc.id,
                    iframeValue: doc.data().iframe,
                    videoSummary: doc.data().summary
                }));
                for (let i = videoArray.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [videoArray[i], videoArray[j]] = [videoArray[j], videoArray[i]];
                }
                setVideos(videoArray);
                setFilteredVideos(videoArray);
                console.log('Fetched videos:', videoArray);
            } catch (error) {
                console.error("Error fetching documents: ", error);
                setError(error.message);
            }
        };

        fetchData();
    }, []);

    const handleSearchChange = (e) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);
        if (query === '') {
            setFilteredVideos(videos);
        } else {
            const filtered = videos.filter(video => 
                isSubsequence(query, video.videoTitle.toLowerCase())
            );
            setFilteredVideos(filtered);
        }
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            const query = searchQuery.toLowerCase();
            if (query === '') {
                setFilteredVideos(videos);
            } else {
                const filtered = videos.filter(video => 
                    isSubsequence(query, video.videoTitle.toLowerCase())
                );
                setFilteredVideos(filtered);
            }
        }
    };

    const isSubsequence = (query, title) => {
        let queryIndex = 0;
        for (let i = 0; i < title.length; i++) {
            if (title[i] === query[queryIndex]) {
                queryIndex++;
            }
            if (queryIndex === query.length) {
                return true;
            }
        }
        return false;
    };

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                closeVideo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const closeVideo = () => {
        setPlayingVideo(null);
    };

    const handlePlayVideo = (index) => {
        setPlayingVideo(index);
    };

    const handleOverlayClick = (e) => {
        if (e.target.classList.contains('video-overlay')) {
            closeVideo();
        }
    };

    const handleNewVideoSubmit = async () => {
        if (!newVideoLink) {
            setToastMessage("Please enter a valid YouTube link.");
            return;
        }

        try {
            // Use newVideoLink as the document ID
            await setDoc(doc(db, "new_videos", newVideoLink), {
                link: newVideoLink
            });
            setToastMessage("New video will be added soon.");
            setNewVideoLink(''); // Clear the text field after submission
        } catch (error) {
            setToastMessage("Failed to submit video link.");
            console.error("Error adding document: ", error);
        }

        // Hide the toast after 3 seconds
        setTimeout(() => {
            setToastMessage('');
        }, 3000);
    };

    const handleInputChange = (e) => {
        setNewVideoLink(e.target.value);
    };

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (videos.length === 0) {
        return <div>Loading...</div>;
    }

    return (
        <div className="youtube-container">
            <div className="title-and-input">
                <p>Startup YouTube <span className="subtitle">a directory of the best startup videos from youtube</span></p>
            </div>
            <div className="search-box">
                <input 
                    type="text" 
                    placeholder="Search videos..." 
                    value={searchQuery} 
                    onChange={handleSearchChange} 
                    onKeyDown={handleSearchKeyDown}
                />
            </div>
            <div className="video-grid">
                {filteredVideos.map((video, index) => (
                    <div key={index} className="video-item" onClick={() => handlePlayVideo(index)}>
                        <div className="video-thumbnail">
                            <img src={`https://img.youtube.com/vi/${getVideoId(video.iframeValue)}/0.jpg`} alt={video.videoTitle} />
                            {/* <div className="watch-text">🎬 Watch</div> */}
                        </div>
                        <h2 className="video-title">{video.videoTitle}</h2>
                        {/* <br /> */}
                        {/* <p className="video-summary">{video.videoSummary}</p> Add video summary */}
                    </div>
                ))}
            </div>

            {playingVideo !== null && (
                <div className="video-overlay" onClick={handleOverlayClick}>
                    <div className="video-overlay-content" onClick={(e) => e.stopPropagation()}>
                        <div className="video-wrapper" dangerouslySetInnerHTML={{ __html: videos[playingVideo].iframeValue }} />
                    </div>
                </div>
            )}
            {toastMessage && <div className="toast-message">{toastMessage}</div>}
        </div>
    );
};

// Helper function to extract video ID from iframe string
const getVideoId = (iframeString) => {
    const match = iframeString.match(/embed\/([\w-]{11})/);
    return match ? match[1] : null;
};

export default Youtube;
