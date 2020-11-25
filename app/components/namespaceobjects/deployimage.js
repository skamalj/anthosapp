/* eslint-disable max-len */
export default
Vue.component('deployimage',
    {
      data: function() {
        return {
          clusterselector: '',
          namespaceselector: '',
          deploymentname: '',
          image: '',
          replicas: '',
          port: '',
          serviceport: '',
        };
      },
      props: ['nscontext', 'repoName'],
      methods: {
        createDeployment() {
          const vueObj = this;
          const formData = new FormData();
          formData.append('nscontext', vueObj.nscontext);
          Object.keys(this.$data).forEach( (key) => formData.append(key, this.$data[key]));
          axios.post('/createDeployment',
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              },
          ).then(function(response) {
            globalobj.appendLog(response.data);
            vueObj.refreshClusterTree();
            vueObj.deploymentname = '';
            vueObj.image = '';
            vueObj.replicas = '';
            vueObj.port = '';
            vueObj.serviceport = '';
          })
              .catch(function(err) {
                window.alert(err);
              });
        },
        refreshClusterTree() {
          this.$parent.$refs.namespacetree.refresh();
        },
      },
      template: ` \
        <div class="container"> \
            <h5><span class="badge badge-default">Selector:</span></h5> 
            <div  class="container m-3"> \
                <input  class="form-control" type="text" placeholder="Cluster Selector"  v-model:value="clusterselector"> \
            </div> \
            <div  class="container m-3"> \
                <input  class="form-control" type="text" placeholder="Namespace Selector"  v-model:value="namespaceselector"> \
            </div> \
            <h5><span class="badge badge-default">Deployment Definition:</span></h5>
            <div  class="container m-3"> \
                <input  class="form-control" type="text" placeholder="Deployment Name"  v-model:value="deploymentname"> \
            </div> \ 
            <div  class="container m-3"> \
                <input  class="form-control" type="text" placeholder="Specify Image"  v-model:value="image"> \
            </div> \ 
            <div  class="container m-3"> \
                <input  class="form-control" type="text" placeholder="Replicas"  v-model:value="replicas"> \
            </div> \
            <div  class="container m-3"> \
                <input  class="form-control" type="text" placeholder="Application Port"  v-model:value="port"> \
            </div> \
            <div  class="container m-3"> \
                <input  class="form-control" type="text" placeholder="Service Port (Optional, if specified will create service)"  v-model:value="serviceport"> \
            </div> \   
            <div class="row m-1 justify-content-end"> \
                <button type="button" class="btn btn-dark" v-on:click="createDeployment()" \
                :disabled="!(nscontext && deploymentname && replicas && image && port)">Submit</button> \
            </div>  \
            <h5><span class="badge badge-default">Context:  {{ nscontext }}</span></h5> \
        </div>`,
    },
);
