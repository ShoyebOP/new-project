// !! WARNING: Storing sensitive information like GitHub tokens in client-side code is INSECURE.
// !! This is for demonstration purposes only based on user's explicit instruction to ignore security.
// !! For a real application, use a backend to handle GitHub API interactions securely.

const GITHUB_TOKEN = 'YOUR_GITHUB_TOKEN'; // Replace with your GitHub Personal Access Token
const REPO_OWNER = 'YOUR_REPO_OWNER'; // Replace with your GitHub username or organization name
const REPO_NAME = 'YOUR_REPO_NAME'; // Replace with your repository name
const DATA_FILE_PATH = 'new-project/data.json'; // Path to your data.json file

async function getGitHubFileContent(owner, repo, path, token) {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const headers = { 'Authorization': `token ${token}` };

    try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        // File content is Base64 encoded
        const content = atob(data.content);
        return { content: content, sha: data.sha };
    } catch (error) {
        console.error('Error fetching file from GitHub:', error);
        alert('Error loading data from GitHub. Please check console for details.');
        return null;
    }
}

async function updateGitHubFile(owner, repo, path, content, sha, token) {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const headers = {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json'
    };
    const body = JSON.stringify({
        message: 'Update data.json',
        content: btoa(content), // Content must be Base64 encoded
        sha: sha
    });

    try {
        const response = await fetch(url, { method: 'PUT', headers, body });
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return data.content.sha; // Return the new SHA
    } catch (error) {
        console.error('Error updating file on GitHub:', error);
        alert('Error saving data to GitHub. Please check console for details.');
        return null;
    }
}
document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    // Fetch user data from data.json on GitHub
    const fileData = await getGitHubFileContent(REPO_OWNER, REPO_NAME, DATA_FILE_PATH, GITHUB_TOKEN);

    if (fileData) {
        const data = JSON.parse(fileData.content);
        const users = data.users || {}; // Get users object, default to empty if not exists

        if (users[username] === password) {
            // In a real application, you would use sessions or tokens for authentication
            // For this simulation, we'll use localStorage to indicate login status and user type
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userType', username); // Store 'admin', 'mod', or 'volunteers'
            window.location.href = 'volunteers.html'; // Redirect to the volunteers page
        } else {
            errorMessage.textContent = 'Invalid username or password';
        }
    } else {
        errorMessage.textContent = 'Could not load user data.';
    }
});
document.getElementById('togglePassword').addEventListener('click', function() {
    const passwordInput = document.getElementById('password');
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    // Toggle the eye icon
    this.textContent = type === 'password' ? '👁️' : '🔒'; // Use appropriate icons
});