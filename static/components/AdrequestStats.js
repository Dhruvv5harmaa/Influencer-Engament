// export default {
//     template: `
//         <div class="container mt-5">
//             <h2>Welcome Home, Admin</h2>
//             <div class="row mt-5">
//                 <div class="col-12">
//                     <h3>Ad Request Status Distribution</h3>
//                     <canvas id="adRequestChart" width="300" height="300" style="max-width: 400px; max-height: 400px; width: 100%; height: auto;"></canvas>
//                 </div>
//             </div>
//         </div>
//     `,
//     data() {
//         return {
//             totalPendingRequests: 0,
//             totalAcceptedRequests: 0,
//         };
//     },
//     async mounted() {
//         await this.fetchAdRequestStats();
//         this.renderChart();
//     },
//     methods: {
//         async fetchAdRequestStats() {
//             try {
//                 const response = await fetch('/api/ad_requests/stats', {
//                     headers: {
//                         'Authentication-Token': localStorage.getItem('auth-token')
//                     }
//                 });

//                 if (!response.ok) {
//                     throw new Error("Error fetching ad request statistics");
//                 }

//                 const data = await response.json();
//                 this.totalPendingRequests = data.total_pending_requests || 0;
//                 this.totalAcceptedRequests = data.total_accepted_requests || 0;
//             } catch (error) {
//                 console.error("Error in fetchAdRequestStats:", error);
//             }
//         },
//         renderChart() {
//             const ctx = document.getElementById('adRequestChart').getContext('2d');
//             const chart = new Chart(ctx, {
//                 type: 'pie',
//                 data: {
//                     labels: ['Pending', 'Accepted'],
//                     datasets: [{
//                         label: 'Ad Request Status',
//                         data: [this.totalPendingRequests, this.totalAcceptedRequests],
//                         backgroundColor: ['#FF6384', '#36A2EB'],
//                         hoverOffset: 4
//                     }]
//                 },
//                 options: {
//                     responsive: true,
//                     maintainAspectRatio: false,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         },
//                         title: {
//                             display: true,
//                             text: 'Ad Request Status Distribution'
//                         }
//                     }
//                 }
//             });
//         }
//     }
// };
export default {
    template: `
        <div class="container mt-5">
            <h2>Welcome Home, Admin</h2>
            <div class="row mt-5">
                <div class="col-sm-6">
                    <h3>Ad Request Status Distribution</h3>
                    <canvas id="adRequestChart" width="300" height="300" style="max-width: 400px; max-height: 400px; width: 100%; height: auto;"></canvas>
                </div>
                <div class="col-sm-6">
                    <h3>Ad Request Delivery Status</h3>
                    <canvas id="deliveryChart" width="300" height="300" style="max-width: 400px; max-height: 400px; width: 100%; height: auto;"></canvas>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            totalPendingRequests: 0,
            totalAcceptedRequests: 0,
            totalDeliveryPendingRequests: 0, // New data property
            totalDeliveryDoneRequests: 0, // New data property
        };
    },
    async mounted() {
        await this.fetchAdRequestStats();
        this.renderCharts();
    },
    methods: {
        async fetchAdRequestStats() {
            try {
                const response = await fetch('/api/ad_requests/stats', {
                    headers: {
                        'Authentication-Token': localStorage.getItem('auth-token')
                    }
                });

                if (!response.ok) {
                    throw new Error("Error fetching ad request statistics");
                }

                const data = await response.json();
                this.totalPendingRequests = data.total_pending_requests || 0;
                this.totalAcceptedRequests = data.total_accepted_requests || 0;
                this.totalDeliveryPendingRequests = data.total_delivery_pending_requests || 0; // Assign new data
                this.totalDeliveryDoneRequests = data.total_delivery_done_requests || 0; // Assign new data
            } catch (error) {
                console.error("Error in fetchAdRequestStats:", error);
            }
        },
        renderCharts() {
            // Render the first chart for Ad Request Status
            const ctx1 = document.getElementById('adRequestChart').getContext('2d');
            new Chart(ctx1, {
                type: 'pie',
                data: {
                    labels: ['Pending', 'Accepted'],
                    datasets: [{
                        label: 'Ad Request Status',
                        data: [this.totalPendingRequests, this.totalAcceptedRequests],
                        backgroundColor: ['#FF6384', '#36A2EB'],
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: 'Ad Request Status Distribution'
                        }
                    }
                }
            });

            // Render the second chart for Delivery Status
            const ctx2 = document.getElementById('deliveryChart').getContext('2d');
            new Chart(ctx2, {
                type: 'pie',
                data: {
                    labels: ['Pending', 'Done'],
                    datasets: [{
                        label: 'Ad Request Delivery Status',
                        data: [this.totalDeliveryPendingRequests, this.totalDeliveryDoneRequests],
                        backgroundColor: ['#FFCE56', '#4BC0C0'],
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        title: {
                            display: true,
                            text: 'Ad Request Delivery Status'
                        }
                    }
                }
            });
        }
    }
};
