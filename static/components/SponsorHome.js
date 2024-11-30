
export default {
    template: `
    <div class="container mt-4">
        <h1 class="text-center mb-4">Welcome, {{ username }}</h1>
        <button @click='downloadResource'> Download All Campign Details </button>
        <span v-if='isWaiting'>Waiting...</span>

        <!-- Display Campaigns -->
        <div v-if="campaigns.length">
            <h2 class="mb-3">Your Campaigns</h2>
            <div class="row">
                <div v-for="campaign in campaigns" :key="campaign.id" class="col-md-6">
                    <div class="card mb-4">
                        <div class="card-body">
                            <h3 class="card-title">{{ campaign.name }}</h3>
                            <p class="card-text">{{ campaign.description }}</p>
                            <ul class="list-group list-group-flush">
                                <li class="list-group-item"><strong>Start Date:</strong> {{ campaign.start_date }}</li>
                                <li class="list-group-item"><strong>End Date:</strong> {{ campaign.end_date }}</li>
                                <li class="list-group-item"><strong>Budget:</strong> {{ campaign.budget }}</li>
                                <li class="list-group-item"><strong>Niche:</strong> {{ campaign.niche }}</li>
                                <li class="list-group-item"><strong>Goals:</strong> {{ campaign.goals }}</li>
                            </ul>
                            <button class="btn btn-primary mt-3" @click="openEditForm(campaign)">Edit</button>
                            <button type="button" class="btn btn-danger mt-3" @click="deleteCampaign(campaign.id)">Delete</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-else>
            <p class="text-center text-muted">No campaigns found.</p>
        </div>

        <!-- Edit Campaign Modal -->
        <div v-if="showEditForm" class="modal fade show" tabindex="-1" role="dialog" style="display: block;">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Edit Campaign</h5>
                        <button type="button" class="close" @click="closeEditForm">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="startDate">Start Date</label>
                            <input type="date" v-model="selectedCampaign.start_date" class="form-control" id="startDate">
                        </div>
                        <div class="form-group">
                            <label for="endDate">End Date</label>
                            <input type="date" v-model="selectedCampaign.end_date" class="form-control" id="endDate">
                        </div>
                        <div class="form-group">
                            <label for="budget">Budget</label>
                            <input type="number" v-model="selectedCampaign.budget" class="form-control" id="budget">
                        </div>
                        <div class="form-group">
                            <label for="goals">Goals</label>
                            <input type="text" v-model="selectedCampaign.goals" class="form-control" id="goals">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="closeEditForm">Close</button>
                       
                        <button type="button" class="btn btn-primary" @click="saveCampaign">Save Changes</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal overlay -->
        <div v-if="showEditForm" class="modal-backdrop fade show"></div>
    </div>
    `,
    props: {
        username: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            campaigns: [],
            showEditForm: false,
            selectedCampaign: null,
            isWaiting:false,
        };
    },
    async mounted() {
        const response = await fetch('/api/sponsor/campaigns_all', {
            headers: {
                'Authentication-Token': localStorage.getItem('auth-token')
            }
        });

        if (response.ok) {
            const data = await response.json();
            this.campaigns = data;
        } else {
            console.error('Failed to fetch campaigns');
        }
    },
    methods: {
        async downloadResource() {
            this.isWaiting = true;
        
           
            const res = await fetch(`/create-csv`, {
                method: 'GET',
                headers: {
                    'Authentication-Token': localStorage.getItem('auth-token')
                }
            });
        
            if (res.ok) {
                const data = await res.json();
                const taskId = data['task-id'];
        
                const intv = setInterval(async () => {
                    const csv_res = await fetch(`/get-csv/${taskId}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json'  // Removed Authentication-Token
                        }
                    });
        
                    if (csv_res.ok) {
                        this.isWaiting = false;
                        clearInterval(intv);
                        window.location.href = `/get-csv/${taskId}`;  // Trigger the file download
                         // Display an alert once the download has been triggered
                        alert('CSV file has been downloaded successfully.');
                    }
                }, 1000);
            } else {
                this.isWaiting = false;
                alert('Failed to start CSV download');
            }
        },
        
        
   
        // Open the edit form with the selected campaign data
        openEditForm(campaign) {
            this.selectedCampaign = { ...campaign };  // Create a copy to edit
            this.showEditForm = true;
        },

        // Close the edit form
        closeEditForm() {
            this.selectedCampaign = null;
            this.showEditForm = false;
        },

        // Save the edited campaign
        async saveCampaign() {
            const response = await fetch(`/api/sponsor/campaigns/${this.selectedCampaign.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authentication-Token': localStorage.getItem('auth-token')
                },
                body: JSON.stringify({
                    start_date: this.selectedCampaign.start_date,
                    end_date: this.selectedCampaign.end_date,
                    budget: this.selectedCampaign.budget,
                    goals: this.selectedCampaign.goals
                })
            });

            if (response.ok) {
                const updatedCampaign = await response.json();

                // Update the campaign in the list
                const index = this.campaigns.findIndex(c => c.id === this.selectedCampaign.id);
                if (index !== -1) {
                    this.campaigns[index] = updatedCampaign;
                }

                // Close the edit form
                this.closeEditForm();
            } else {
                alert('Failed to update campaign');
            }
        },
        // Delete campaign method
        async deleteCampaign(campaignId) {
            if (confirm('Are you sure you want to delete this campaign?')) {
                const response = await fetch(`/api/sponsor/campaigns/${campaignId}/delete`, {
                    method: 'DELETE',
                    headers: {
                        'Authentication-Token': localStorage.getItem('auth-token')
                    }
                });

                if (response.ok) {
                    // Remove the campaign from the list
                    this.campaigns = this.campaigns.filter(c => c.id !== campaignId);
                    alert('Campaign deleted successfully.');
                } else {
                    alert('Failed to delete campaign.');
                }
            }
        },
        
       
    }
};
