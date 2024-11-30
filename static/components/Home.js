import AdminHome from "./AdminHome.js"
import StudyResource from "./StudyResource.js"
import SponsorHome from "./SponsorHome.js"
export default { 
   
    template:`<div>Welcome Home 
   

    
    <AdminHome v-if="userRole=='admin' "/>
    <SponsorHome v-if="userRole=='sponsor'" :username="username" />
 
    
    </div>`,

   
    data(){
        return{
            // userRole: this.$route.query.role,
            userRole:localStorage.getItem('role') ,
            authToken:localStorage.getItem('auth-token'),
            resources:[],
            username: '',  // Add a new data property for the username
           
        }
    },
    components:{
        AdminHome,
        SponsorHome,
      
    },
    async mounted() {
        try {
            const response = await fetch('/api/user_info_new', {
                method: 'GET',
                headers: {
                    'Authentication-Token': this.authToken // Include the auth token
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.username = data.username; // Set the username from the response
            } else {
                console.error('Failed to fetch user info:', response.status);
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
        }
    },
}