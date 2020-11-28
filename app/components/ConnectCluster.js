/* eslint-disable max-len */
export default
Vue.component('ConnectCluster',
    {
      data: function() {
        return {
          clusterName: '',
          username: '',
          clusterList: [],
          logintoken: '',
        };
      },
      methods: {
        manageConnect(optype) {
          const formData = new FormData();
          const endpoint = optype == 'connect' ? '/connectCluster' : '/disconnectCluster';
          formData.append('repoName', globalobj.selected);
          Object.keys(this.$data).forEach( (key) => formData.append(key, this.$data[key]));
          globalobj.showBusy();
          axios.post(endpoint,
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
        getConnectLoginToken() {
          const vueObj = this;
          const formData = new FormData();
          Object.keys(this.$data).forEach( (key) => formData.append(key, this.$data[key]));
          globalobj.showBusy();
          axios.post('/getConnectLoginToken',
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              },
          ).then(function(resp) {
            vueObj.logintoken = resp.data;
            globalobj.hideBusy();
          })
              .catch(function(err) {
                globalobj.hideBusy();
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
                <button type="button" :disabled="!clusterName" class="btn btn-dark ml-3" v-on:click="manageConnect('connect')">Register</button> \
                <button type="button" :disabled="!clusterName" class="btn btn-dark ml-3" v-on:click="manageConnect('disconnect')">Unregister</button> \
            </div>  
            <div  class="container m-3"> \
                <input  class="form-control mb-3" type="text" placeholder="User Name" v-model:value="username"> \
                <h5><span class="badge badge-default" v-if="username">Servie Account name: {{ username }}-hub-login-sa</span></h5>            
                <div class="row pb-3 m-0 justify-content-end"> \
                  <button type="button" :disabled="!(clusterName && username)" class="btn btn-dark ml-3" v-on:click="getConnectLoginToken">Get Token</button> \
                </div>
                  <input  class="form-control"  placeholder="Login Token"  v-model:value="logintoken"> \
            </div> \
        </div>`,
    },
);
