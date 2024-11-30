
export default { 
    template: `
<div>
    <div class='d-flex justify-content-center' style="margin-top:25vh">
        <div class="mb-3 p-5 bg-light">
            <div class='text-danger'>*{{ error }}</div>

            <!-- Login Form -->
            <div v-if="!showSignupForm && !showInfluencerSignupForm">
                <label for="user-email" class="form-label">Email address</label>
                <input type="email" class="form-control" id="user-email" placeholder="name@example.com"
                       v-model="cred.email">
                <label for="user-password" class="form-label">Password</label>
                <input type="password" class="form-control" id="user-password" v-model="cred.password">
                <button class="btn btn-primary mt-2" @click='login'>Login</button>
            </div>

            <!-- Sign Up Buttons -->
            <button class="btn btn-secondary mt-2" @click="openSignupForm">Sign Up as Sponsor</button>
            <button class="btn btn-secondary mt-2" @click="openInfluencerSignupForm">Sign Up as Influencer</button>
        </div>
    </div>

    <!-- Sponsor Signup Modal -->
    <div v-if="showSignupForm" class="modal fade show" tabindex="-1" role="dialog" style="display: block;">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Sign Up as Sponsor</h5>
                    <button type="button" class="close" @click="closeSignupForm">
                        <span>&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="signup-username">Username</label>
                        <input type="text" class="form-control" id="signup-username" v-model="signupCred.username" placeholder="Your username" required>
                    </div>
                    <div class="form-group">
                        <label for="signup-email">Email address</label>
                        <input type="email" class="form-control" id="signup-email" v-model="signupCred.email" placeholder="name@example.com" required>
                    </div>
                    <div class="form-group">
                        <label for="signup-password">Password</label>
                        <input type="password" class="form-control" id="signup-password" v-model="signupCred.password" required>
                    </div>
                    <div class="form-group">
                        <label for="industry">Industry</label>
                        <input type="text" class="form-control" id="industry" v-model="signupCred.industry" placeholder="Your industry">
                    </div>
                    <div class="text-danger">{{ error }}</div> <!-- Error message display -->
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" @click="closeSignupForm">Close</button>
                    <button type="button" class="btn btn-primary" @click="signup">Sign Up</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Influencer Signup Modal -->
    <div v-if="showInfluencerSignupForm" class="modal fade show" tabindex="-1" role="dialog" style="display: block;">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Sign Up as Influencer</h5>
                    <button type="button" class="close" @click="closeInfluencerSignupForm">
                        <span>&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="influencer-username">Username</label>
                        <input type="text" class="form-control" id="influencer-username" v-model="influencerCred.username" placeholder="Your username" required>
                    </div>
                    <div class="form-group">
                        <label for="influencer-email">Email address</label>
                        <input type="email" class="form-control" id="influencer-email" v-model="influencerCred.email" placeholder="name@example.com" required>
                    </div>
                    <div class="form-group">
                        <label for="influencer-password">Password</label>
                        <input type="password" class="form-control" id="influencer-password" v-model="influencerCred.password" required>
                    </div>
                    <div class="form-group">
                        <label for="influencer-industry">Industry</label>
                        <input type="text" class="form-control" id="influencer-industry" v-model="influencerCred.industry" placeholder="Your industry">
                    </div>
                    <div class="form-group">
                        <label for="influencer-niche">Niche</label>
                        <input type="text" class="form-control" id="influencer-niche" v-model="influencerCred.niche" placeholder="Your niche">
                    </div>
                    <div class="form-group">
                        <label for="influencer-reach">Reach</label>
                        <input type="text" class="form-control" id="influencer-reach" v-model="influencerCred.reach" placeholder="Your reach">
                    </div>
                    <div class="form-group">
                        <label for="influencer-platform">Platform</label>
                        <input type="text" class="form-control" id="influencer-platform" v-model="influencerCred.platform" placeholder="Your platform">
                    </div>
                    <div class="text-danger">{{ error }}</div> <!-- Error message display -->
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" @click="closeInfluencerSignupForm">Close</button>
                    <button type="button" class="btn btn-primary" @click="signupInfluencer">Sign Up</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal overlay -->
    <div v-if="showSignupForm || showInfluencerSignupForm" class="modal-backdrop fade show"></div>
</div>

    `,
    data() {
        return {
            cred: {
                email: null,
                password: null,
            },
            signupCred: {
                username: null, // Add this line for username
                email: null,
                password: null,
                industry: null,
             
            },
            influencerCred: {
                username: null, // Influencer username
                email: null,
                password: null,
                industry: null,
                niche: null,
                reach: null,
                platform: null,
            },
            showSignupForm: false, // Control visibility of signup form modal
            showInfluencerSignupForm: false, // Control visibility of influencer signup form modal
            error: null,
        }
    },
    methods: {
        async login() {
            const res = await fetch('/user-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.cred),
            });
            const data = await res.json();
            if (res.ok) {
                localStorage.setItem('auth-token', data.token);
                localStorage.setItem('role', data.role);
                this.$router.push({ path: '/' }); // Redirect after login
            } else {
                this.error = data.message; // Show error message
            }
        },
        openSignupForm() {
            this.showSignupForm = true; // Show signup form modal
        },
        closeSignupForm() {
            this.showSignupForm = false; // Hide signup form modal
        },
        openInfluencerSignupForm() {
            this.showInfluencerSignupForm = true; // Show influencer signup form modal
        },
        closeInfluencerSignupForm() {
            this.showInfluencerSignupForm = false; // Hide influencer signup form modal
        },
        async signup() {
            const res = await fetch('/sponsor-signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.signupCred), // Ensure username is included
            });
            const data = await res.json();
            if (res.ok) {
                this.closeSignupForm(); // Hide the signup form after successful signup
                this.signupCred = { username: null, email: null, password: null, industry: null }; // Reset fields
                console.log("Signup successful!", data);
            } else {
                this.error = data.message; // Show the error message
            }
        },
        async signupInfluencer() {
            const res = await fetch('/influencer-signup', { // URL for influencer signup
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.influencerCred), // Send the influencer data
            });
            
            const data = await res.json(); // Parse the response
        
            if (res.ok) {
                this.closeInfluencerSignupForm(); // Hide the signup form after successful signup
                this.influencerCred = { // Reset the influencer fields
                    username: null,
                    email: null,
                    password: null,
                    industry: null,
                    niche: null,
                    reach: null,
                    platform: null,
                };
                console.log("Influencer Signup successful!", data); // Log success message
            } else {
                this.error = data.message; // Show the error message if signup fails
            }
        },
    },
}
