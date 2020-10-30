/* eslint-disable max-len */
export default
Vue.component('DeployOperator',
    {
      data: function() {
        return {
          clusterName: '',
          clusterList: [],
        };
      },
      methods: {
        deployOperator() {
          const formData = new FormData();
          formData.append('repoName', JSON.stringify(globalobj.selected));
          Object.keys(this.$data).forEach( (key) => formData.append(key, this.$data[key]));
          axios.post('/deployOperator',
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              },
          ).then(function(resp) {
            globalobj.appendLog(resp.data);
          })
              .catch(function(err) {
                window.alert(err);
              });
        },
        getClusterList() {
          const vueObj = this;
          axios.post('/getClusterlist').then(function(res) {
            res.data.forEach((cluster) => {
              if (cluster) {
                vueObj.clusterList.push(cluster.name);
              }
            });
          })
              .catch(function(err) {
                window.alert(err);
              });
        },
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
                <option v-for="cluster in clusterList" :value="cluster">{{ cluster }}</option>
              </select>
            </div>
            <div class="row pb-3 m-0 justify-content-end"> \
                <button type="button" :disabled="!clusterName" class="btn btn-dark" v-on:click="deployOperator()">Configure</button> \
            </div>  
        </div>`,
    },
);
