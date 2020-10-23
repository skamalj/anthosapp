/* eslint-disable max-len */
export default
Vue.component('cluster',
    {
      data: function() {
        return {
          file: 'test',
          filename: 'Upload kube config file',
          token: '',
          serviceaccount: '',
          credoption: 'token',
          clustername: '',
          clusterendpoint: '',
          clusterlist: [],
        };
      },
      created: function() {
        this.getClusterList();
      },
      methods: {
        handleFileUpload() {
          this.file = this.$refs.kubeconfig.files[0];
          this.filename = this.file.name;
        },
        submitFile() {
          const formData = new FormData();
          Object.keys(this.$data).forEach( (key) => formData.append(key, this.$data[key]));
          axios.post('/savekubeconfig',
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              },
          ).then(function() {
            window.alert('SUCCESS!!');
          })
              .catch(function(err) {
                window.alert(err);
              });
        },
        getClusterList() {
          const vueObj = this;
          axios.post('/getClusterlist').then(function(res) {
            vueObj.clusterlist = res.data;
          })
              .catch(function(err) {
                window.alert(err);
              });
        },
      },
      template: ` \
        <div class="container"> \
            <div class="container m-3">
                <div class="form-check form-check-inline"> \
                    <input class="form-check-input" type="radio" id="configfile" value="configfile" v-model="credoption"> \
                    <label class="form-check-label" for="configfile">KubeConfig</label> \
                </div> \
                <div class="form-check form-check-inline"> \
                    <input class="form-check-input" type="radio"  id="token" value="token" v-model="credoption"> \
                    <label class="form-check-label" for="token">Token</label> \
                </div> \
            </div> 
            <div  class="container m-3"> \   
                <div v-if="credoption == 'configfile'" class="custom-file">
                    <label class="custom-file-label" v-model="filename" for="kubeConfigFile">{{ filename }}</label> \
                    <input type="file" name="kubeconfig" class="custom-file-input" ref="kubeconfig" id="kubeConfigFile" v-on:change="handleFileUpload()"> \
                </div> \
            </div> \
            <div v-if="credoption == 'token'" class="container m-3"> \
                <input  class="form-control" type="text" placeholder="Service Account Name"  v-model:value="serviceaccount"> \
                <input  class="form-control" type="text" placeholder="Copy your service account token value" id="clusterToken" v-model:value="token"> \
            </div> \  
            <div  class="container m-3"> \
                <input  class="form-control" type="text" placeholder="Cluster Name" id="clustername" v-model:value="clustername"> \
            </div> \ 
            <div  class="container m-3"> \
                <input  class="form-control" type="text" placeholder="Cluster endpoint - https://1.2.3.4" id="clusterendpoint" v-model:value="clusterendpoint"> \
            </div> \
            <div class="row m-1 justify-content-end"> \
                <button type="button" class="btn btn-dark" v-on:click="submitFile()">Submit</button> \
            </div>   
            <div class="container m-3 mt-5">  
            <table class="table">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Name</th>
                  <th scope="col">Endpoint</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(cluster, index) in clusterlist" v-if="cluster">
                  <th scope="row">{{ index +1 }}</th>
                  <td>{{ cluster.name }}</td>
                  <td>{{ cluster.endpoint }}</td>
                </tr>
              </tbody>
            </table>
            </div>  
        </div>`,
    },
);
