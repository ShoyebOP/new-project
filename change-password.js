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
document.addEventListener('DOMContentLoaded', function() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userType = localStorage.getItem('userType');

    // Redirect if not logged in or not an admin
    if (!isLoggedIn || userType !== 'admin') {
        window.location.href = 'index.html'; // Redirect to login page
        return;
    }

    const changePasswordUsernameInput = document.getElementById('changePasswordUsername');
    const newPasswordInput = document.getElementById('newPassword');
    const changePasswordBtn = document.getElementById('changePasswordBtn');

    changePasswordBtn.addEventListener('click', async function() {
        const usernameToChange = changePasswordUsernameInput.value;
        const newPassword = newPasswordInput.value;

        if (usernameToChange && newPassword) {
            // Fetch current data to avoid conflicts
            const fileData = await getGitHubFileContent(REPO_OWNER, REPO_NAME, DATA_FILE_PATH, GITHUB_TOKEN);

            if (fileData) {
                const data = JSON.parse(fileData.content);
                data.users = data.users || {};

                if (data.users[usernameToChange] !== undefined) {
                    data.users[usernameToChange] = newPassword; // Update password

                    const newSha = await updateGitHubFile(REPO_OWNER, REPO_NAME, DATA_FILE_PATH, JSON.stringify(data, null, 2), fileData.sha, GITHUB_TOKEN);
                    if (newSha) {
                        alert(`Password for ${usernameToChange} updated (simulated).`);
                        changePasswordUsernameInput.value = '';
                        newPasswordInput.value = '';
                    }
                } else {
                    alert(`User "${usernameToChange}" not found.`);
                }
            }
        } else {
            alert('Please enter both username and new password.');
        }
    });
});