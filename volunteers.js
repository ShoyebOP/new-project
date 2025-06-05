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
document.addEventListener('DOMContentLoaded', async function() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userType = localStorage.getItem('userType');
    const volunteersTableBody = document.getElementById('volunteersTableBody');
    const adminControls = document.getElementById('adminControls');
    const addVolunteerBtn = document.getElementById('addVolunteerBtn');

    // Check if the user is logged in, otherwise redirect to login page
    if (!isLoggedIn) {
        window.location.href = 'index.html';
        return;
    }

    // Show/hide admin controls based on user type
    if (userType === 'admin' || userType === 'mod') {
        adminControls.style.display = 'block';
    } else {
        adminControls.style.display = 'none';
    }

    const changePasswordLink = document.getElementById('changePasswordLink');
    if (userType !== 'admin') {
        changePasswordLink.style.display = 'none';
    }

    // Load volunteers data from GitHub
    let volunteers = [];
    let currentSha = null;

    async function loadVolunteers() {
        const fileData = await getGitHubFileContent(REPO_OWNER, REPO_NAME, DATA_FILE_PATH, GITHUB_TOKEN);
        if (fileData) {
            const data = JSON.parse(fileData.content);
            volunteers = data.volunteers || [];
            currentSha = fileData.sha;
            renderVolunteers();
        }
    }

    function renderVolunteers() {
        volunteersTableBody.innerHTML = ''; // Clear existing rows
        volunteers.forEach((volunteer, index) => {
            const row = volunteersTableBody.insertRow();
            row.innerHTML = `
                <td>${volunteer.name}</td>
                <td>${volunteer.class}</td>
                <td>${volunteer.section}</td>
                <td>${volunteer.roll}</td>
                <td>${volunteer.mobile}</td>
                ${userType === 'admin' || userType === 'mod' ? `<td><button class="delete-btn" data-index="${index}">Delete</button></td>` : ''}
            `;
        });

        // Add event listeners to delete buttons if admin or mod
        if (userType === 'admin' || userType === 'mod') {
            volunteersTableBody.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const index = this.getAttribute('data-index');
                    deleteVolunteer(index);
                });
            });
        }
    }

    async function addVolunteer() {
        const name = document.getElementById('name').value;
        const className = document.getElementById('class').value;
        const section = document.getElementById('section').value;
        const roll = document.getElementById('roll').value;
        const mobile = document.getElementById('mobile').value;

        if (name && className && section && roll && mobile) {
            // Fetch current data to avoid conflicts
            const fileData = await getGitHubFileContent(REPO_OWNER, REPO_NAME, DATA_FILE_PATH, GITHUB_TOKEN);
            if (fileData) {
                const data = JSON.parse(fileData.content);
                data.volunteers = data.volunteers || [];
                data.volunteers.push({ name, class: className, section, roll, mobile });

                const newSha = await updateGitHubFile(REPO_OWNER, REPO_NAME, DATA_FILE_PATH, JSON.stringify(data, null, 2), fileData.sha, GITHUB_TOKEN);
                if (newSha) {
                    currentSha = newSha;
                    volunteers = data.volunteers; // Update local volunteers array
                    renderVolunteers();
                    // Clear input fields
                    document.getElementById('name').value = '';
                    document.getElementById('class').value = '';
                    document.getElementById('section').value = '';
                    document.getElementById('roll').value = '';
                    document.getElementById('mobile').value = '';
                }
            }
        } else {
            alert('Please fill in all fields');
        }
    }

    async function deleteVolunteer(index) {
        // Fetch current data to avoid conflicts
        const fileData = await getGitHubFileContent(REPO_OWNER, REPO_NAME, DATA_FILE_PATH, GITHUB_TOKEN);
        if (fileData) {
            const data = JSON.parse(fileData.content);
            data.volunteers = data.volunteers || [];
            data.volunteers.splice(index, 1);

            const newSha = await updateGitHubFile(REPO_OWNER, REPO_NAME, DATA_FILE_PATH, JSON.stringify(data, null, 2), fileData.sha, GITHUB_TOKEN);
            if (newSha) {
                currentSha = newSha;
                volunteers = data.volunteers; // Update local volunteers array
                renderVolunteers();
            }
        }
    }

    // Initial load
    loadVolunteers();

    // Add event listener for adding volunteer if admin or mod
    if (userType === 'admin' || userType === 'mod') {
        addVolunteerBtn.addEventListener('click', addVolunteer);
    }
});