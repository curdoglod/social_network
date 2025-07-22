const App = () => {
  const [user, setUser] = React.useState(() => {
    try {
      const stored = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
      return stored ? JSON.parse(stored) : null;
    } catch(e){ return null; }
  });
  
  const [isAuthView, setIsAuthView] = React.useState('login'); // Default to login view
  
  const VIEW_KEY = 'appMainView';
  const PROFILE_KEY = 'appProfileUser';
  const POST_KEY = 'appPostId';
  
  const [mainView, setMainView] = React.useState(() => {
    try {
      return sessionStorage.getItem(VIEW_KEY) || 'feed';
    } catch(e){ return 'feed'; }
  });
  
  const [postId, setPostId] = React.useState(() => {
    try {
      return sessionStorage.getItem(POST_KEY) || null;
    } catch(e){ return null; }
  });
  
  const [profileUser, setProfileUser] = React.useState(() => {
    try {
      const stored = sessionStorage.getItem(PROFILE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch(e){ return null; }
  });
  
  React.useEffect(() => {
    try {
      sessionStorage.setItem(VIEW_KEY, mainView);
      if (profileUser) {
        sessionStorage.setItem(PROFILE_KEY, JSON.stringify(profileUser));
      } else {
        sessionStorage.removeItem(PROFILE_KEY);
      }
      if (postId) {
        sessionStorage.setItem(POST_KEY, postId);
      } else {
        sessionStorage.removeItem(POST_KEY);
      }
    } catch(e){}
  }, [mainView, profileUser, postId]);
  
  
  const handleRegisterSuccess = (userData) => {
    setUser(userData); // Set the user state with the new user's data.
    try { sessionStorage.setItem('currentUser', JSON.stringify(userData)); } catch(e){}
  };
  
  
  const handleLoginSuccess = (userData, remember=false) => {
    setUser(userData);
    try {
      if (remember) {
        localStorage.setItem('currentUser', JSON.stringify(userData));
        sessionStorage.removeItem('currentUser');
      } else {
        sessionStorage.setItem('currentUser', JSON.stringify(userData));
        localStorage.removeItem('currentUser');
      }
    } catch(e){}
  };
  
  
  const handleLogout = () => {
    setUser(null);
    try { sessionStorage.removeItem('currentUser'); localStorage.removeItem('currentUser'); } catch(e){}
    try { sessionStorage.removeItem(VIEW_KEY); sessionStorage.removeItem(PROFILE_KEY); } catch(e){}
    setMainView('feed');
    setProfileUser(null);
    setIsAuthView('login'); 
  };
  
  
  const toggleAuthView = () => {
    setIsAuthView(prevView => prevView === 'login' ? 'register' : 'login');
  };
  
  const handleProfileClick = () => {
    if (!user) return;
    window.history.pushState({}, '', `/${user.username}`);
    setProfileUser(user);
    setMainView('profile');
  };
  
  const handleOpenOtherProfile = (profileData) => {
    if (!profileData?.username) return;
    window.history.pushState({}, '', `/${profileData.username}`);
    setProfileUser(profileData);
    setMainView('profile');
  };
  
  const handleBack = () => {
    window.history.back();
  };

  const handleOpenPost = (post) => {
    window.history.pushState({}, '', `/post/${post.id}`);
    setPostId(String(post.id));
    setMainView('post');
  };

  // Handle initial load and browser navigation (back/forward)
  React.useEffect(() => {
    const parsePathAndLoadProfile = () => {
      const segments = window.location.pathname.split('/').filter(Boolean);
      if (segments.length === 1) {
        const username = segments[0];
        window.API.getProfileByUsername(username)
          .then((profile) => {
            const data = {
              id: profile.user || profile.id,
              username: profile.username || username,
              is_superuser: profile.is_superuser,
              avatar_url: profile.avatar_url,
              email: profile.email,
            };
            setProfileUser(data);
            setMainView('profile');
          })
          .catch((err) => {
            console.error('Failed to load profile by path', err);
            setMainView('feed');
            setProfileUser(null);
          });
      } else if (segments.length === 2 && segments[0] === 'post') {
        const postId = segments[1];
        window.API.getPost(postId)
          .then((post) => {
            setPostId(postId);
            setMainView('post');
          })
          .catch((err) => {
            console.error('Failed to load post by path', err);
            setMainView('feed');
            setPostId(null);
          });
      } else {
        setMainView('feed');
        setProfileUser(null);
        setPostId(null);
      }
    };

    // Initial parse
    parsePathAndLoadProfile();

    // Listen to back/forward navigation
    const handler = () => parsePathAndLoadProfile();
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation bar: Always displayed. It shows user information and a logout button if a user is logged in. */}
      <Navigation user={user} onLogout={handleLogout} />
      
      {/* Layout with sidebar when logged in */}
      <div className="flex">
        {user && (
          <Sidebar 
            user={user} 
            onLogout={handleLogout} 
            onProfileClick={handleProfileClick}
            onBack={mainView !== 'feed' ? handleBack : undefined}
          />
        )}
        {/* Main content area */}
        <div className={`flex-1 container mx-auto px-4 py-8 ${user ? 'ml-16 md:ml-64' : ''}`}>
        {user ? (
          mainView === 'profile' ? (
            <Profile 
              profileUser={profileUser || user} 
              currentUser={user} 
              onProfileClick={handleOpenOtherProfile}
              onOpenPost={handleOpenPost}
            />
          ) : mainView === 'post' ? (
            <PostPage 
              postId={postId} 
              currentUser={user} 
              onBackToFeed={handleBack}
              onProfileClick={handleOpenOtherProfile}
            />
          ) : (
            <PostsSection user={user} onProfileClick={handleOpenOtherProfile} onOpenPost={handleOpenPost} />
          )
        ) : (
          <div className="flex items-center justify-center min-h-screen bg-gray-100 w-full">
            <div className="max-w-md w-full">
              {isAuthView === 'login' ? (
                <LoginForm onLogin={handleLoginSuccess} switchToRegister={toggleAuthView} />
              ) : (
                <RegisterForm onRegister={handleRegisterSuccess} switchToLogin={toggleAuthView} />
              )}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
