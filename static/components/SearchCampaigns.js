// export default {
//     template: `
//     <div class="container mt-4">
//         <div v-if="error" class="alert alert-danger">{{ error }}</div>
        
//         <div class="form-group">
//             <input type="text" v-model="searchParams.niche" placeholder="Search by Niche" class="form-control mb-2" />
//             <input type="number" v-model="searchParams.budget" placeholder="Search by Budget" class="form-control mb-2" />
//             <button @click="searchCampaigns" class="btn btn-primary">Search</button>
//         </div>
  
//         <div v-if="campaigns.length">
//             <h3>Ongoing Campaigns</h3>
//             <table class="table">
//                 <thead>
//                     <tr>
//                         <th>Name</th>
//                         <th>Description</th>
//                         <th>Start Date</th>
//                         <th>End Date</th>
//                         <th>Budget</th>
//                         <th>Goals</th>
//                         <th>Niche</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     <tr v-for="campaign in campaigns" :key="campaign.id">
//                         <td>{{ campaign.name }}</td>
//                         <td>{{ campaign.description }}</td>
//                         <td>{{ campaign.start_date }}</td>
//                         <td>{{ campaign.end_date }}</td>
//                         <td>{{ campaign.budget }}</td>
//                         <td>{{ campaign.goals }}</td>
//                         <td>{{ campaign.niche }}</td>
//                     </tr>
//                 </tbody>
//             </table>
//         </div>
//     </div>
//     `,

//     data() {
//         return {
//             searchParams: {
//                 niche: '',
//                 budget: ''
//             },
//             campaigns: [],
//             error: null
//         };
//     },

//     methods: {
//         async searchCampaigns() {
//             try {
//                 const queryParams = new URLSearchParams(this.searchParams).toString();
//                 const res = await fetch(`/api/search-ongoing-campaigns?${queryParams}`, {
//                     headers: { 'Authentication-Token': localStorage.getItem('auth-token') }
//                 });
//                 const data = await res.json();
                
//                 if (res.ok) {
//                     this.campaigns = data.campaigns; // Assuming your API returns an array of campaigns
//                 } else {
//                     this.error = data.message || 'Failed to fetch campaigns';
//                 }
//             } catch (error) {
//                 console.error('An error occurred while searching for campaigns:', error);
//                 this.error = 'An error occurred while searching for campaigns';
//             }
//         }
//     }
// };
export default {
    template: `
    <div class="container mt-4">
        <div v-if="error" class="alert alert-danger">{{ error }}</div>
        
        <div class="form-group">
            <input type="text" v-model="searchParams.niche" placeholder="Search by Niche" class="form-control mb-2" />
            <input type="number" v-model="searchParams.budget" placeholder="Search by Budget" class="form-control mb-2" />
            <button @click="searchCampaigns" class="btn btn-primary">Search</button>
        </div>
  
        <div v-if="campaigns.length">
            <h3>Ongoing Campaigns</h3>
            <table class="table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Budget</th>
                        <th>Goals</th>
                        <th>Niche</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="campaign in campaigns" :key="campaign.id">
                        <td>{{ campaign.name }}</td>
                        <td>{{ campaign.description }}</td>
                        <td>{{ campaign.start_date }}</td>
                        <td>{{ campaign.end_date }}</td>
                        <td>{{ campaign.budget }}</td>
                        <td>{{ campaign.goals }}</td>
                        <td>{{ campaign.niche }}</td>
                        <td>
                            <button @click="openAdRequestModal(campaign)" class="btn btn-success">Send Ad Request</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Ad Request Modal -->
        <div v-if="showAdRequestModal" class="modal" tabindex="-1" role="dialog" style="display: block;">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Send Ad Request</h5>
                        <button type="button" class="close" @click="closeAdRequestModal">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="message">Message</label>
                            <textarea v-model="adRequestData.message" id="message" class="form-control"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="paymentAmount">Payment Amount</label>
                            <input v-model="adRequestData.payment_amount" type="number" id="paymentAmount" class="form-control" />
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="closeAdRequestModal">Cancel</button>
                        <button type="button" class="btn btn-primary" @click="submitAdRequest">Submit</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal overlay -->
        <div v-if="showAdRequestModal" class="modal-backdrop fade show"></div>
    </div>
    `,

    data() {
        return {
            searchParams: {
                niche: '',
                budget: ''
            },
            campaigns: [],
            error: null,
            showAdRequestModal: false,
            adRequestData: {
                message: '',
                payment_amount: '',
                campaign_id: null
            }
        };
    },

    methods: {
        async searchCampaigns() {
            try {
                const queryParams = new URLSearchParams(this.searchParams).toString();
                const res = await fetch(`/api/search-ongoing-campaigns?${queryParams}`, {
                    headers: { 'Authentication-Token': localStorage.getItem('auth-token') }
                });
                const data = await res.json();
                
                if (res.ok) {
                    this.campaigns = data.campaigns; // Assuming your API returns an array of campaigns
                } else {
                    this.error = data.message || 'Failed to fetch campaigns';
                }
            } catch (error) {
                console.error('An error occurred while searching for campaigns:', error);
                this.error = 'An error occurred while searching for campaigns';
            }
        },
        openAdRequestModal(campaign) {
            // Open the modal and set the selected campaign
            this.adRequestData.campaign_id = campaign.id;
            this.adRequestData.message = '';
            this.adRequestData.payment_amount = '';
            this.showAdRequestModal = true;
        },
        closeAdRequestModal() {
            this.showAdRequestModal = false;
        },
        async submitAdRequest() {
            try {
                const res = await fetch(`/api/ad-request-from-influencer`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authentication-Token': localStorage.getItem('auth-token')
                    },
                    body: JSON.stringify({
                        campaign_id: this.adRequestData.campaign_id,
                        message: this.adRequestData.message,
                        payment_amount: this.adRequestData.payment_amount
                    })
                });
                const data = await res.json();
                
                if (res.ok) {
                    alert('Ad Request sent successfully!');
                    this.closeAdRequestModal();
                } else {
                    this.error = data.message || 'Failed to send Ad Request';
                }
            } catch (error) {
                console.error('An error occurred while sending the ad request:', error);
                this.error = 'An error occurred while sending the ad request';
            }
        }
    }
};
