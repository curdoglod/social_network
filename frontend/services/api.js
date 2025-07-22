const API_BASE_URL = 'http://127.0.0.1:8000/api'; 

let authToken = null;

const TOKEN_KEY = 'authToken';


const initToken = () => {
  try {
    const storedToken = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
    if (storedToken) {
      authToken = storedToken;
    }
  } catch (e) {
    console.warn('API: Unable to access web storage.', e);
  }
};


const setToken = (token, remember = false) => {
  authToken = token;
  try {
    if (remember) {
      localStorage.setItem(TOKEN_KEY, token);
      sessionStorage.removeItem(TOKEN_KEY);
    } else {
      sessionStorage.setItem(TOKEN_KEY, token);
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (e) {
    console.warn('API: Failed to write token to web storage.', e);
  }
};


const clearToken = () => {
  authToken = null;
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
  } catch (e) {}
};


// Helper to read a cookie value by name (for CSRF token retrieval)
const getCookie = (name) => {
  if (!document.cookie) return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
};


const fetchWithAuth = async (relativeUrl, options = {}) => {
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers, // Allow overriding Content-Type or adding other headers
  };

  if (authToken) {
    headers['Authorization'] = `Token ${authToken}`;
  }

  // Attach CSRF token for non-GET requests
  const method = (options.method || 'GET').toUpperCase();
  if (!['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method)) {
    const csrftoken = getCookie('csrftoken');
    if (csrftoken) {
      headers['X-CSRFToken'] = csrftoken;
    }
  }

  const fullUrl = `${API_BASE_URL}${relativeUrl}`;

  try {
    const response = await fetch(fullUrl, { credentials: 'include', ...options, headers });

    if (!response.ok) {
      let errorData = { detail: `Request failed with status: ${response.status}` };
      try {
        errorData = await response.json();
      } catch (e) {
        console.error('API: Failed to parse error response JSON.', e);
      }
      const message = typeof errorData === 'string' ? errorData : errorData.detail || Object.values(errorData).join('; ');
      throw new Error(message);
    }

    if (response.status === 204) { // No Content
        return null; // Or an appropriate representation for "no content successful response"
    }
    return await response.json();

  } catch (error) {
    console.error(`API Error during fetch to ${fullUrl}:`, error);
    throw error; // Re-throw the caught error (either from !response.ok or network failure)
  }
};



const register = async (userData) => {
  const csrftoken = getCookie('csrftoken');
  const response = await fetch(`${API_BASE_URL}/auth/register/`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}) },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    let errorBody = { detail: `Registration failed with status: ${response.status}` };
    try { errorBody = await response.json(); } catch (e) { /* ignore parsing error */ }
    const message = errorBody.username?.[0] || errorBody.email?.[0] || errorBody.password?.[0] || errorBody.detail || `Registration failed.`;
    throw new Error(message);
  }

  const result = await response.json();
  if (result.token) {
      setToken(result.token); // Store the token for subsequent authenticated requests.
  }
  return result; // Return the full result (user data, token, etc.).
};


const login = async (credentials, remember = false) => {
  const csrftoken = getCookie('csrftoken');
  const response = await fetch(`${API_BASE_URL}/auth/login/`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(csrftoken ? { 'X-CSRFToken': csrftoken } : {}) },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    let errorBody = { detail: `Login failed with status: ${response.status}` };
    try { errorBody = await response.json(); } catch (e) { /* ignore parsing error */ }
    const message = errorBody.non_field_errors?.[0] || errorBody.detail || `Login failed.`;
    throw new Error(message);
  }

  const result = await response.json();
   if (result.token) {
      setToken(result.token, remember);
   }
   return result;
};


const logout = async () => {
  try {
    await fetchWithAuth('/auth/logout/', { method: 'POST' });
    clearToken();
  } catch (error) {
    console.error('API: Logout API call failed. Clearing token client-side anyway.', error);
    clearToken(); // Ensure client-side token is cleared even if API call fails.
    throw error; // Re-throw to allow UI to potentially handle this 
  }
};


const getPosts = async () => {
    return fetchWithAuth('/posts/', { method: 'GET' });
};


const createPost = async (postData) => { // postData is expected to be a FormData object
    return fetchWithAuth('/posts/', {
        method: 'POST',
        body: postData, // Send the FormData object directly.
    });
};


const getComments = async (postId) => {
    return fetchWithAuth(`/posts/${postId}/comments/`, { method: 'GET' });
};


const createComment = async (postId, commentData) => {
  return fetchWithAuth(`/posts/${postId}/comments/`, {
    method: 'POST',
    body: JSON.stringify(commentData), // Convert comment data object to JSON string.
  });
};

const toggleLikePost = async (postId) => {
  return fetchWithAuth(`/posts/${postId}/like/`, { method: 'POST' });
};

const deletePost = async (postId) => {
  return fetchWithAuth(`/posts/${postId}/`, { method: 'DELETE' });
};

const updatePost = async (postId, updateData) => {
  return fetchWithAuth(`/posts/${postId}/`, {
    method: 'PATCH',
    body: JSON.stringify(updateData),
  });
};

const getPost = async (postId) => {
  return fetchWithAuth(`/posts/${postId}/`, { method: 'GET' });
};

const getUserPosts = async (userId) => {
  return fetchWithAuth(`/posts/?author=${userId}`, { method: 'GET' });
};

const updateAvatar = async (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  return fetchWithAuth('/profiles/me/', {
    method: 'PATCH',
    body: formData,
  });
};

const getProfileByUsername = async (username) => {
  return fetchWithAuth(`/profiles/by-username/${username}/`, { method: 'GET' });
};

window.API = {
  initToken,
  register,
  login,
  logout,
  getPosts,
  createPost,
  getComments,
  createComment,
  toggleLikePost,
  deletePost,
  updatePost,
  getUserPosts,
  updateAvatar,
  getProfileByUsername,
  getPost,
};

initToken();
