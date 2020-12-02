/* eslint-disable max-len */
export default
Vue.component('DeployOperator',
    {
      data: function() {
        return {
          clusterName: '',
          clusterlist: [],
        };
      },
      methods: {
        deployOperator() {
          const formData = new FormData();
          formData.append('repoName', globalobj.selected);
          Object.keys(this.$data).forEach( (key) => formData.append(key, this.$data[key]));
          globalobj.showBusy();
          axios.post('/deployOperator',
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              },
          ).then(function(resp) {
            globalobj.appendLog(resp.data);
            globalobj.hideBusy();
          })
              .catch(function(err) {
                globalobj.hideBusy();
                window.alert(err);
              });
        },
        getClusterList() {
          const vueObj = this;
          axios.post('/getRepoClusterMapping').then(function(resp) {
            vueObj.clusterlist = resp.data;
          })
              .catch(function(err) {
                window.alert(err);
              });
        },
      },
      created: function() {
        this.getClusterList();
      },
      watch: {
        repoName: function(val) {
          window.alert(val);
        },
      },
      created: function() {
        this.getClusterList();
      },
      template: ` \
        <div class="container m-0 p-0"> \
            <div class="form-group m-3">     
              <select v-model="clusterName" class="form-control">
                <option hidden value=""> Select Cluster</option>
                <option v-for="cluster in clusterlist" :value="cluster">{{ cluster }}</option>
              </select>
            </div>
            <div class="row pb-3 m-0 justify-content-end"> \
                <button type="button" :disabled="!clusterName" class="btn btn-dark" v-on:click="deployOperator()">Configure</button> \
            </div>  
            <div class="container m-3 mt-5">  
            <table class="table">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Cluster</th>
                  <th scope="col">Repo</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(cluster, index) in clusterlist" v-if="cluster">
                  <th scope="row">{{ index + 1}}</th>
                  <td>{{ cluster.clustername }}</td>
                  <td>{{ cluster.reponame }}</td>
                </tr>
              </tbody>
            </table>
            </div>  
        </div>`,
    },
);
