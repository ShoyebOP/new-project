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
    const mapArea = document.getElementById('mapArea');
    const mapImage = document.getElementById('mapImage');
    const volunteerMarkersContainer = document.getElementById('volunteerMarkers');
    const layersList = document.getElementById('layersList');
    const newLayerNameInput = document.getElementById('newLayerName');
    const addLayerBtn = document.getElementById('addLayerBtn');
    const toggleVolunteersListBtn = document.getElementById('toggleVolunteersList');
    const volunteersListElement = document.getElementById('volunteersList');
    const layersControl = document.querySelector('.layers-control');


    // Redirect if not logged in or not admin/mod
    if (!isLoggedIn || (userType !== 'admin' && userType !== 'mod')) {
        window.location.href = 'index.html'; // Redirect to login page
        return;
    }

    // --- Map Loading (Simulated) ---
    // In a real app, you would handle map uploads and display here.
    // Using a placeholder image for demonstration.
    mapImage.src = 'placeholder-map.jpg'; // Replace with a path to a placeholder image

    // --- Data Loading and Saving (using GitHub API) ---
    let currentSha = null;
    let appData = {
        users: {},
        volunteers: [],
        mapLayers: [],
        placedMarkers: []
    };

    async function loadData() {
        const fileData = await getGitHubFileContent(REPO_OWNER, REPO_NAME, DATA_FILE_PATH, GITHUB_TOKEN);
        if (fileData) {
            appData = JSON.parse(fileData.content);
            currentSha = fileData.sha;
            renderLayers();
            renderVolunteersList();
            renderMarkers();
        }
    }

    async function saveData() {
        if (currentSha) {
            const newSha = await updateGitHubFile(REPO_OWNER, REPO_NAME, DATA_FILE_PATH, JSON.stringify(appData, null, 2), currentSha, GITHUB_TOKEN);
            if (newSha) {
                currentSha = newSha;
            }
        }
    }


    // --- Layer Management (Admin Only) ---
    function renderLayers() {
        layersList.innerHTML = '';
        appData.mapLayers.forEach((layer, index) => {
            const li = document.createElement('li');
            li.textContent = layer.name;
            if (userType === 'admin') {
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Delete';
                deleteBtn.onclick = () => deleteLayer(index);
                li.appendChild(deleteBtn);
            }
            layersList.appendChild(li);
        });
    }

    async function addLayer() {
        const layerName = newLayerNameInput.value.trim();
        if (layerName && userType === 'admin') {
            appData.mapLayers.push({ name: layerName, visible: true }); // Simulate layer visibility
            await saveData();
            renderLayers();
            newLayerNameInput.value = '';
        } else if (userType !== 'admin') {
            alert('Only admin can add layers.');
        }
    }

    async function deleteLayer(index) {
        if (userType === 'admin') {
            appData.mapLayers.splice(index, 1);
            await saveData();
            renderLayers();
            // Also remove markers associated with this layer (requires more complex data structure)
            // For this simulation, we won't implement layer-specific markers.
        }
    }

    if (userType === 'admin') {
        addLayerBtn.addEventListener('click', addLayer);
    } else {
        // Hide layer controls for non-admin
        layersControl.style.display = 'none';
    }


    // --- Volunteer List (Draggable) ---
    function renderVolunteersList() {
        volunteersListElement.innerHTML = '';
        appData.volunteers.forEach(volunteer => {
            const li = document.createElement('li');
            li.textContent = `${volunteer.name} (${volunteer.class}, ${volunteer.roll})`;
            li.setAttribute('draggable', true);
            li.dataset.volunteer = JSON.stringify(volunteer); // Store volunteer data
            volunteersListElement.appendChild(li);
        });
    }

    toggleVolunteersListBtn.addEventListener('click', function() {
        volunteersListElement.classList.toggle('hidden');
        this.textContent = volunteersListElement.classList.contains('hidden') ? 'Show Volunteers' : 'Hide Volunteers';
    });


    // --- Drag and Drop Functionality ---
    let draggedVolunteerData = null;

    document.addEventListener('dragstart', function(event) {
        if (event.target.matches('#volunteersList li')) {
            draggedVolunteerData = JSON.parse(event.target.dataset.volunteer);
            event.dataTransfer.setData('text/plain', JSON.stringify(draggedVolunteerData));
            event.target.classList.add('dragging');
        } else if (event.target.classList.contains('volunteer-marker')) {
             draggedVolunteerData = JSON.parse(event.target.dataset.volunteer); // Set dragged data for existing marker
             event.dataTransfer.setData('text/plain', JSON.stringify(draggedVolunteerData));
             event.target.classList.add('dragging');
             // Remove the marker temporarily while dragging
             event.target.style.display = 'none';
        }
    });

    document.addEventListener('dragend', function(event) {
        if (event.target.matches('#volunteersList li') || event.target.classList.contains('volunteer-marker')) {
            event.target.classList.remove('dragging');
             if (event.target.classList.contains('volunteer-marker')) {
                 event.target.style.display = 'flex'; // Show the marker again
             }
            draggedVolunteerData = null; // Clear dragged data
        }
    });

    mapArea.addEventListener('dragover', function(event) {
        event.preventDefault(); // Allow drop
    });

    mapArea.addEventListener('drop', function(event) {
        event.preventDefault();
        if (draggedVolunteerData && (userType === 'admin' || userType === 'mod')) {
            const rect = mapArea.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            placeVolunteerMarker(draggedVolunteerData, x, y);
        }
    });

    // --- Volunteer Markers on Map ---
    function renderMarkers() {
        volunteerMarkersContainer.innerHTML = ''; // Clear existing markers
        appData.placedMarkers.forEach(marker => {
            createMarkerElement(marker);
        });
    }

    function createMarkerElement(markerData) {
        const marker = document.createElement('div');
        marker.classList.add('volunteer-marker');
        marker.style.left = `${markerData.x}px`;
        marker.style.top = `${markerData.y}px`;
        marker.textContent = `${markerData.volunteer.class}, ${markerData.volunteer.roll}`; // Label with class and roll
        marker.dataset.volunteer = JSON.stringify(markerData.volunteer); // Store full volunteer data

        // Make markers draggable
        marker.setAttribute('draggable', true);


        // Show full info on tap/click
        marker.addEventListener('click', function() {
            const volunteer = JSON.parse(this.dataset.volunteer);
            alert(`Name: ${volunteer.name}\nClass: ${volunteer.class}\nSection: ${volunteer.section}\nRoll: ${volunteer.roll}\nMobile: ${volunteer.mobile}`);
        });

        volunteerMarkersContainer.appendChild(marker);
    }

    async function placeVolunteerMarker(volunteerData, x, y) {
        // Check if a marker for this volunteer already exists
        const existingMarkerIndex = appData.placedMarkers.findIndex(marker => marker.volunteer.roll === volunteerData.roll);

        if (existingMarkerIndex > -1) {
            // Update existing marker position
            appData.placedMarkers[existingMarkerIndex].x = x;
            appData.placedMarkers[existingMarkerIndex].y = y;
        } else {
            // Add new marker
            appData.placedMarkers.push({ volunteer: volunteerData, x, y });
        }

        await saveData();
        renderMarkers(); // Re-render all markers
    }

    // Initial load of all data
    loadData();
});