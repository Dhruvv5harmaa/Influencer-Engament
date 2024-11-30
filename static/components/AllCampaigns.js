
export default {
    template: `
    <div class="container mt-4">
        <h1 class="text-center mb-4">Welcome, {{ username }}</h1>
        
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
                            <button type="button" class="btn btn-danger mt-3" @click="deleteCampaign(campaign.id)">Delete</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-else>
            <p class="text-center text-muted">No campaigns found.</p>
        </div>

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
        const response = await fetch('/all-campaigns', {
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
