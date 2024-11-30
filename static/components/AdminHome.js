
export default {
    template: `
        <div class="container mt-5">
            <h2>Welcome Home, Admin</h2>
            <div class="row mt-4">
                <div class="col-sm-4">
                    <div class="card">
                        <div class="card-body text-center">
                            <h5 class="card-title">Total Users</h5>
                            <p class="card-text">{{ totalActiveUsers }}</p>
                        </div>
                    </div>
                </div>
                <div class="col-sm-4">
                    <div class="card">
                        <div class="card-body text-center">
                            <h5 class="card-title">Total Sponsors</h5>
                            <p class="card-text">{{ totalSponsors }}</p>
                        </div>
                    </div>
                </div>
                <div class="col-sm-4">
                    <div class="card">
                        <div class="card-body text-center">
                            <h5 class="card-title">Total Influencers</h5>
                            <p class="card-text">{{ totalInfluencers }}</p>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Canvas for the chart -->
            <canvas ref="myChart" width="400" height="200"></canvas>
        </div>
    `,
    data() {
        return {
            totalActiveUsers: 0,
            totalSponsors: 0,
            totalInfluencers: 0,
        };
    },
    async mounted() {
        await this.fetchStatistics();
        this.createChart();
    },
    methods: {
      async fetchStatistics() {
        try {
            const response = await fetch('/api/admin/statistics', {
                headers: {
                    'Authentication-Token': localStorage.getItem('auth-token')
                }
            });
            if (!response.ok) throw new Error("Error fetching statistics");
            const data = await response.json();
            this.totalActiveUsers = data.total_active_users || 0;
            this.totalSponsors = data.total_sponsors || 0;
            this.totalInfluencers = data.total_influencers || 0;
        } catch (error) {
            console.error("Error in fetchStatistics:", error);
        }
      },
      createChart() {
          const ctx = this.$refs.myChart.getContext('2d');
          const myChart = new Chart(ctx, {
              type: 'bar',
              data: {
                  labels: ['Total Users', 'Sponsors', 'Influencers'],
                  datasets: [{
                      label: 'Counts',
                      data: [this.totalActiveUsers, this.totalSponsors, this.totalInfluencers],
                      backgroundColor: [
                          'rgba(255, 99, 132, 0.2)',
                          'rgba(54, 162, 235, 0.2)',
                          'rgba(255, 206, 86, 0.2)'
                      ],
                      borderColor: [
                          'rgba(255, 99, 132, 1)',
                          'rgba(54, 162, 235, 1)',
                          'rgba(255, 206, 86, 1)'
                      ],
                      borderWidth: 1
                  }]
              },
              options: {
                  scales: {
                      y: {
                          beginAtZero: true
                      }
                  }
              }
          });
      }
    }
  };
  