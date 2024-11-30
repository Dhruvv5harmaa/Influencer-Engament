// export default {
//     template: `
//       <div>
//         <h1>Pending Ad Requests (From Influencers)</h1>
//         <div v-if="pendingRequests.length === 0">
//           <p>No pending ad requests from influencers.</p>
//         </div>
//         <div v-else>
//           <table class="table">
//             <thead>
//               <tr>
//                 <th>Campaign</th>
//                 <th>Messages</th>
//                 <th>Requirements</th>
//                 <th>Payment Amount</th>
//                 <th>Status</th>
//               </tr>
//             </thead>
//             <tbody>
//               <tr v-for="request in pendingRequests" :key="request.id">
//                 <td>{{ request.campaign_name }}</td>
//                 <td>{{ request.messages }}</td>
//                 <td>{{ request.requirements }}</td>
//                 <td>{{ request.payment_amount }}</td>
//                 <td>{{ request.status }}</td>
//                 <td>
//                   <button @click="updateStatus(request.id, 'Accepted')" class="btn btn-success btn-sm">Accept</button>
//                   <button @click="updateStatus(request.id, 'Rejected')" class="btn btn-danger btn-sm">Reject</button>
//                   <button @click="openEditModal(request)" class="btn btn-warning btn-sm">Edit Request</button>
//                 </td>
//               </tr>
//             </tbody>
//           </table>
//         </div>


//         <!-- Edit Request Modal -->
//         <div v-if="showEditModal" class="modal" tabindex="-1" role="dialog" style="display: block;">
//           <div class="modal-dialog" role="document">
//             <div class="modal-content">
//               <div class="modal-header">
//                 <h5 class="modal-title">Edit Ad Request</h5>
//                 <button type="button" class="close" @click="closeEditModal">
//                   <span>&times;</span>
//                 </button>
//               </div>
//               <div class="modal-body">
//                 <div class="form-group">
//                   <label for="editMessage">Edit Message</label>
//                   <textarea v-model="editRequestData.messages" id="editMessage" class="form-control"></textarea>
//                 </div>
//                 <div class="form-group">
//                   <label for="editRequirements">Edit Requirements</label>
//                   <textarea v-model="editRequestData.requirements" id="editRequirements" class="form-control"></textarea>
//                 </div>
//                 <div class="form-group">
//                   <label for="editPaymentAmount">Edit Payment Amount</label>
//                   <input v-model="editRequestData.payment_amount" type="number" id="editPaymentAmount" class="form-control" />
//                 </div>
//               </div>
//               <div class="modal-footer">
//                 <button type="button" class="btn btn-secondary" @click="closeEditModal">Cancel</button>
//                 <button type="button" class="btn btn-primary" @click="submitEditRequest">Submit</button>
//               </div>
//             </div>
//           </div>
//         </div>

//         <!-- Modal overlay -->
//         <div v-if="showEditModal" class="modal-backdrop fade show"></div>
//       </div>



//       </div>
//     `,
//     data() {
//       return {
//         pendingRequests: [],
//         showEditModal: false,
//         editRequestData: {
//           id: null,
//           messages: '',
//           requirements: '',
//           payment_amount: null
//         },
//         error: null
      
//       };
//     },
//     async created() {
//       try {
//         const res = await fetch('/api/get-sponsor-pending-requests', {
//           headers: {
//             'Authentication-Token': localStorage.getItem('auth-token'),
//           },
//         });
//         const data = await res.json();
//         if (res.ok) {
//           this.pendingRequests = data;
//         } else {
//           alert(data.message || 'Failed to fetch pending ad requests');
//         }
//       } catch (error) {
//         console.error(error);
//         alert('An error occurred while fetching pending ad requests');
//       }
//     },
//     methods: {
//         async updateStatus(requestId, newStatus) {
//           try {
//             const res = await fetch(`/api/update-ad-request-status-sponsor/${requestId}`, {
//               method: 'PUT',
            
//               headers: {
//                 'Content-Type': 'application/json',
//                 'Authentication-Token': localStorage.getItem('auth-token'),
//               },
//               body: JSON.stringify({ status: newStatus }),
//             });
    
//             if (res.ok) {
//               // Remove the updated request from the pendingRequests array
//               const requestIndex = this.pendingRequests.findIndex(r => r.id === requestId);
//               this.pendingRequests.splice(requestIndex, 1);
//               alert(`Ad request has been ${newStatus.toLowerCase()} successfully.`);
//             } else {
//               const data = await res.json();
//               alert(data.message || 'Failed to update status.');
//             }
//           } catch (error) {
//             console.error(error);
//             alert('An error occurred while updating the status');
//           }
//         },
//     },
    
   
    
  
// }

export default {
  template: `
    <div>
      <h1>Pending Ad Requests (From Influencers)</h1>
      <div v-if="pendingRequests.length === 0">
        <p>No pending ad requests from influencers.</p>
      </div>
      <div v-else>
        <table class="table">
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Messages</th>
              <th>Requirements</th>
              <th>Payment Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="request in pendingRequests" :key="request.id">
              <td>{{ request.campaign_name }}</td>
              <td>{{ request.messages }}</td>
              <td>{{ request.requirements }}</td>
              <td>{{ request.payment_amount }}</td>
              <td>{{ request.status }}</td>
              <td>
                <button @click="updateStatus(request.id, 'Accepted')" class="btn btn-success btn-sm">Accept</button>
                <button @click="updateStatus(request.id, 'Rejected')" class="btn btn-danger btn-sm">Reject</button>
                <button @click="openEditModal(request)" class="btn btn-warning btn-sm">Edit Request</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Edit Request Modal -->
      <div v-if="showEditModal" class="modal" tabindex="-1" role="dialog" style="display: block;">
        <div class="modal-dialog" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Edit Ad Request</h5>
              <button type="button" class="close" @click="closeEditModal">
                <span>&times;</span>
              </button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label for="editMessage">Edit Message</label>
                <textarea v-model="editRequestData.messages" id="editMessage" class="form-control"></textarea>
              </div>
              <div class="form-group">
                <label for="editRequirements">Edit Requirements</label>
                <textarea v-model="editRequestData.requirements" id="editRequirements" class="form-control"></textarea>
              </div>
              <div class="form-group">
                <label for="editPaymentAmount">Edit Payment Amount</label>
                <input v-model="editRequestData.payment_amount" type="number" id="editPaymentAmount" class="form-control" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeEditModal">Cancel</button>
              <button type="button" class="btn btn-primary" @click="submitEditRequest">Submit</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal overlay -->
      <div v-if="showEditModal" class="modal-backdrop fade show"></div>
    </div>
  `,

  data() {
    return {
      pendingRequests: [],
      showEditModal: false,
      editRequestData: {
        id: null,
        messages: '',
        requirements: '',
        payment_amount: null,
      },
      error: null,
    };
  },

  async created() {
    try {
      const res = await fetch('/api/get-sponsor-pending-requests', {
        headers: {
          'Authentication-Token': localStorage.getItem('auth-token'),
        },
      });
      const data = await res.json();
      if (res.ok) {
        this.pendingRequests = data;
      } else {
        alert(data.message || 'Failed to fetch pending ad requests');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while fetching pending ad requests');
    }
  },

  methods: {
    // Method to update status of the request (Accept/Reject)
    async updateStatus(requestId, newStatus) {
      try {
        const res = await fetch(`/api/update-ad-request-status-sponsor/${requestId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authentication-Token': localStorage.getItem('auth-token'),
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (res.ok) {
          const requestIndex = this.pendingRequests.findIndex(r => r.id === requestId);
          this.pendingRequests.splice(requestIndex, 1); // Remove the request from the list
          alert(`Ad request has been ${newStatus.toLowerCase()} successfully.`);
        } else {
          const data = await res.json();
          alert(data.message || 'Failed to update status.');
        }
      } catch (error) {
        console.error(error);
        alert('An error occurred while updating the status');
      }
    },

    // Open the Edit Modal with prefilled data
    openEditModal(request) {
      this.editRequestData = { ...request }; // Clone the request object to be edited
      this.showEditModal = true;
    },

    // Close the Edit Modal
    closeEditModal() {
      this.showEditModal = false;
      this.editRequestData = {
        id: null,
        messages: '',
        requirements: '',
        payment_amount: null,
      };
    },

    // Submit the edited request data
    async submitEditRequest() {
      try {
        const res = await fetch(`/api/update-ad-request-sponsor/${this.editRequestData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authentication-Token': localStorage.getItem('auth-token'), // Adding authentication header
          },
          body: JSON.stringify({
            message: this.editRequestData.messages,      // Sending updated message
            requirements: this.editRequestData.requirements, // Sending updated requirements
            payment_amount: this.editRequestData.payment_amount, // Sending updated payment amount
          }),
        });
    
        const result = await res.json();
    
        if (res.ok) {
          // Update the request in the pendingRequests list
          const requestIndex = this.pendingRequests.findIndex(r => r.id === this.editRequestData.id);
          if (requestIndex !== -1) {
            this.pendingRequests[requestIndex] = { ...this.editRequestData };
          }
    
          alert('Ad request updated successfully');
          this.closeEditModal(); // Close the modal after successful submission
        } else {
          console.error('Failed to update ad request:', result.message);
          this.error = result.message;
        }
      } catch (error) {
        console.error('An error occurred while updating the ad request:', error);
        this.error = 'An error occurred while updating the ad request.';
      }
    },
    
  },
};
