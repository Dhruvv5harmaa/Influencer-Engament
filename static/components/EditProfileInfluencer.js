
export default {
    template: `
    <div class="container mt-4">
        <h1 class="text-center mb-4">Welcome, {{user_info.username}}</h1>
        
        <!-- Edit User Form -->
        <div class="mt-4">
            <h2>Edit Influencer Details</h2>
            <form @submit.prevent="saveUser">
                <div class="mb-3" v-for="(value, key) in updated_info" :key="key">
                    <label :for="key" class="form-label">{{ key.charAt(0).toUpperCase() + key.slice(1) }}</label>
                    <input type="text" class="form-control" :id="key" v-model="updated_info[key]" 
                           :placeholder="user_info[key] || 'Enter ' + key" required>
                </div>
                <button type="submit" class="btn btn-primary">Save Changes</button>
            </form>
        </div>
    </div>
    `,
    data() {
        return {
            user_info: {},
            updated_info: {},  // Initialize as an object
        };
    },
    async mounted() {
        await this.fetchUserDetails();  // Call fetchUserDetails on mount
    },
    
    methods: {
        async fetchUserDetails() {
            try {
                const response = await fetch('/api/influencer-detail', {
                    headers: {
                        'Authentication-Token': localStorage.getItem('auth-token')
                    }
                });
                
                if (response.ok) {
                    const userData = await response.json();
                    this.user_info = userData;
                    this.updated_info = { ...userData };  // Set updated_info to userData
                } else {
                    alert('Failed to fetch user details');
                }
            } catch (error) {
                console.error('Error fetching user details:', error);
                alert('An error occurred while fetching user details.');
            }
        },
        async saveUser() {
            try {
                const response = await fetch(`/api/update-info-influencer/${this.user_info.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authentication-Token': localStorage.getItem('auth-token')
                    },
                    body: JSON.stringify(this.updated_info)
                });

                if (response.ok) {
                    const updatedUser = await response.json();
                    this.user_info = updatedUser.user;  // Update user_info with the returned data
                    
                    alert('User details updated successfully!');
                } else {
                    alert('Failed to update user details');
                }
            } catch (error) {
                console.error('Error updating user details:', error);
                alert('An error occurred while updating user details.');
            }
        },
    }
};
