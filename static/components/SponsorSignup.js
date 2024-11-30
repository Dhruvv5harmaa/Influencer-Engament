export default {
    template: `
      <div class='d-flex justify-content-center' style="margin-top:25vh">
          <div class="mb-3 p-5 bg-light">
              <div class='text-danger'>*{{error}}</div>
              <label for="user-name" class="form-label">Username</label>
              <input type="text" class="form-control" id="user-name" v-model="cred.username" placeholder="Enter your username">
              <label for="user-email" class="form-label">Email address</label>
              <input type="email" class="form-control" id="user-email" v-model="cred.email" placeholder="name@example.com">
              <label for="user-password" class="form-label">Password</label>
              <input type="password" class="form-control" id="user-password" v-model="cred.password">
              <label for="industry" class="form-label">Industry</label>
              <input type="text" class="form-control" id="industry" v-model="cred.industry">
              <label for="niche" class="form-label">Niche</label>
              <input type="text" class="form-control" id="niche" v-model="cred.niche">
              <label for="reach" class="form-label">Reach</label>
              <input type="text" class="form-control" id="reach" v-model="cred.reach">
              <label for="platform" class="form-label">Platform</label>
              <input type="text" class="form-control" id="platform" v-model="cred.platform">
  
              <button class="btn btn-primary mt-2" @click='signUpAsSponsor' >Submit</button>
          </div>
      </div>
    `,
    data() {
      return {
        cred: {
          username: null,
          email: null,
          password: null,
          industry: null,
          niche: null,
          reach: null,
          platform: null
        },
        error: null,
      };
    },
    methods: {
      async signUpAsSponsor() {
        const res = await fetch('/user-signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.cred),
        });
        const data = await res.json();
        if (res.ok) {
          this.$router.push({ path: '/' }); // Redirect after successful sign-up
        } else {
          this.error = data.message;
        }
      }
    }
  };
  